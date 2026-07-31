// Konvo Wrapper: a caged instagram.com for the things the official
// API can never do — starting new conversations, group chats, and (on iOS)
// DMs for private accounts. Cage rules: no feed, no reels feed, no explore.
// Profiles, stories, and single posts stay reachable — people-shaped
// surfaces, not the algorithm's.

use tauri::utils::config::Color;
use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;
#[cfg(target_os = "macos")]
use tauri::Manager;

/// Runs at document-start on every page. Block-list, not allow-list: only the
/// actual feed surfaces (home, reels, explore, media viewers, profiles)
/// redirect to the inbox. Login, two-factor, onetap, accounts, and every
/// /direct page are left completely alone, so the auth flow never gets
/// interrupted. Redirect is deferred to the SPA router (assign, not replace
/// at parse time) to avoid blanking.
const CAGE_SCRIPT: &str = r#"
(function () {
  // Only cage the main Instagram web app. Auth / new-device verification
  // surfaces (accountscenter.instagram.com, and Meta's own login pages on
  // meta.com / facebook.com) must load completely untouched — running the
  // cage there called window.stop() and blanked the login flow.
  var H = location.hostname;
  if (H !== "instagram.com" && H !== "www.instagram.com") return;

  // First launch on a fresh install has no cache and no session, so
  // instagram.com takes 10-15s to paint and the window sits empty the whole
  // time. Warm launches are instant, but the cold one is the first thing a
  // new tester ever sees, and a blank window reads as a broken app. Show a
  // spinner until the page paints over it.
  (function boot() {
    var b = document.createElement("div");
    b.id = "im-boot";
    b.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#000;" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px";
    // Icon + wordmark, not a bare spinner. The wait is Instagram's bundle over
    // the network and is not ours to shorten, but a logo reads as an app
    // starting where a lone spinner on black reads as a page that has hung.
    // SVG attributes use single quotes on purpose: a double quote immediately
    // followed by a hash closes the Rust raw string this whole script lives in.
    b.innerHTML =
      "<svg width='62' height='62' viewBox='0 0 512 512' aria-hidden='true'>" +
        "<rect width='512' height='512' rx='116' fill='#0a84ff'/>" +
        "<g transform='translate(70,70) scale(15.5)' fill='none' stroke='#fff'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
        "<path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z'/></g></svg>" +
      "<div style='font:600 17px -apple-system,system-ui,sans-serif;color:#f5f5f7;" +
        "letter-spacing:-0.01em'>Konvo</div>" +
      "<div style='width:20px;height:20px;border:2px solid #2c2c2e;" +
        "border-top-color:#0a84ff;border-radius:50%;animation:im-spin .8s linear infinite'></div>" +
      "<style>@keyframes im-spin{to{transform:rotate(360deg)}}</style>";
    (document.body || document.documentElement).appendChild(b);
    function clear() {
      var el = document.getElementById("im-boot");
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    window.addEventListener("load", clear);
    // Never let the overlay trap someone if load never fires (offline, a
    // redirect chain, a stalled request).
    setTimeout(clear, 20000);
  })();

  // Only the algorithm's surfaces bounce. Single-media permalinks — /p/, /tv/,
  // /reel/<code> — are conversation material: a post opened from a profile
  // grid or shared in a DM is one person's post, and there is no /p/ feed to
  // leak into. The desktop's next/prev arrows on a post walk that same
  // person's grid, which is browsing a friend, not a feed.
  // Profiles themselves are deliberately open: finding someone you just met
  // and hitting Message is the whole point of a DM app. What stays shut is
  // everything you can watch - including a profile's own reels tab, which the
  // leading-slash patterns below would otherwise sail straight past.
  //
  // One deliberate exemption: /reel/<code>/, the permalink for the single reel
  // somebody sent you. Watching what a friend sent is part of the conversation;
  // the reels *feed* at /reels/ is not, and stays caged. The two differ by one
  // letter, so the pattern below is plural ON PURPOSE - restoring the old
  // "reels?" re-cages shared reels, and dropping to "reel" opens the feed.
  // Swiping out of that one reel into the next is shut off separately, below.
  //
  // /stories/ is deliberately absent: a story is a friend's post, not the
  // algorithm's — the viewer only walks people you follow and exits to "/",
  // which bounces. Restoring the pattern re-cages story viewing everywhere.
  var FEED = [
    /^\/$/, /^\/reels(\/|$)/, /^\/reel\/?$/, /^\/explore(\/|$)/,
    /^\/[A-Za-z0-9._]+\/(reels|tagged|saved)(\/|$)/
  ];
  // No exemptions. Posting a story used to open "/" behind a CSS blanket, and
  // every leak that cost time - the compose bar following the user into
  // threads, Following/Favorites rendering blank, a markup change away from
  // showing the live feed - traced back to that one hole. Posting belongs to
  // Instagram; this app is for talking. Home is simply unreachable now.
  function blocked(p) {
    return FEED.some(function (r) { return r.test(p); });
  }
  function atInbox() {
    return /^\/direct\/(inbox|requests)?\/?$/.test(location.pathname);
  }
  function enforce() {
    if (!location.hostname.endsWith("instagram.com")) return;
    if (blocked(location.pathname)) {
      try { window.stop(); } catch (e) {}
      location.replace("/direct/inbox/");
    }
    // Route flag so CSS can hide the inbox's back-to-feed arrow while
    // keeping the thread view's back-to-inbox arrow.
    document.documentElement.classList.toggle("im-inbox", atInbox());
  }
  var push = history.pushState.bind(history);
  history.pushState = function () { push.apply(null, arguments); setTimeout(enforce, 0); };
  var replace = history.replaceState.bind(history);
  history.replaceState = function () { replace.apply(null, arguments); setTimeout(enforce, 0); };
  window.addEventListener("popstate", enforce);
  document.addEventListener("DOMContentLoaded", enforce);
  setInterval(enforce, 800); // SPA belt-and-braces: some route changes skip history APIs

  // Sleep/wake, desktop only: after the machine sleeps, Instagram's live
  // connection is dead but the page still looks fine, so the inbox silently
  // stops updating and the app feels hung. Timers do not fire while asleep, so
  // a gap between ticks is the signal - more reliable than visibilitychange,
  // which does not fire consistently across sleep on macOS.
  //
  // Must NOT run on iOS. iOS suspends timers every time the app is
  // backgrounded, so the same check fires on any return after five minutes and
  // reloads instagram.com from scratch - a 5-10s wait every single time you
  // open the app. iOS already evicts and reloads the webview on its own when it
  // needs to, so there is nothing here for us to fix.
  // ponytail: full reload, which drops an unsent draft. Reconnecting instead
  // would mean driving Instagram's own minified socket code.
  if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    var tick = Date.now();
    setInterval(function () {
      var now = Date.now();
      if (now - tick > 300000) location.reload(); // 5 min of missing ticks
      tick = now;
    }, 30000);

    // Real-time unread notifications. The Mac app keeps running while hidden,
    // so this keeps ticking after the window is closed. Polls the same badge
    // endpoint Instagram's own web client polls for its tab badge - same
    // origin, same session, same fingerprint, so nothing about it looks
    // foreign. Notify only on an increase and only while the window is not
    // being looked at; reading threads lowers the count and resets the
    // baseline by itself. The invoke is a no-op unless the notification
    // capability granted it (macOS only), and any failure stays silent.
    // ponytail: a 30s poll, not Instagram's realtime socket - worst case a
    // message is 30s late. Driving their minified MQTT code is not worth it.
    var lastBadge = null;
    setInterval(function () {
      fetch("/api/v1/direct_v2/get_badge_count/", {
        headers: { "X-IG-App-ID": "936619743392459" }
      }).then(function (r) { return r.json(); }).then(function (d) {
        var n = d && typeof d.badge_count === "number" ? d.badge_count : null;
        if (n === null) return;
        if (lastBadge !== null && n > lastBadge && window.__TAURI_INTERNALS__ &&
            (document.hidden || !document.hasFocus())) {
          window.__TAURI_INTERNALS__.invoke("plugin:notification|notify", {
            options: {
              title: "Konvo",
              body: n === 1 ? "1 unread conversation" : n + " unread conversations"
            }
          }).catch(function () {});
        }
        lastBadge = n;
      }).catch(function () {});
    }, 30000);
  }

  // Hide every navigation doorway. Desktop: the left rail. Mobile web: the
  // bottom tab bar (same aria-labels, different containers) plus the
  // "open the app" upsells and the inbox back arrow.
  var css = [
    'a:has(svg[aria-label="Home"])',
    'a[href="/"]',
    'a:has(svg[aria-label="Explore"])',
    'a[href="/explore/"]',
    'a:has(svg[aria-label="Reels"])',
    'a[href^="/reels/"]',
    '[role="link"]:has(svg[aria-label="Search"])',
    'a:has(svg[aria-label="Search"])',
    'div[role="button"]:has(svg[aria-label="Search"])',
    // The notifications heart is phone-only, pushed on below.
    'a:has(svg[aria-label="Profile"])',
    // The Messages nav entry stays. It used to be redundant - every screen was
    // already a DM screen - but profiles and notifications are reachable now,
    // and it is the only way back to the inbox from either.
    // the hamburger "More" / Settings at the bottom
    'svg[aria-label="Settings"]',
    'a:has(svg[aria-label="Settings"])',
    'div[role="button"]:has(svg[aria-label="Settings"])',
    'div[role="button"]:has(svg[aria-label="More"])',
    'a:has(svg[aria-label="More"])',
    // Threads + the "Also from Meta" app-switcher grid
    'a[aria-label="Threads"]',
    'a:has(svg[aria-label="Threads"])',
    'div[role="button"]:has(svg[aria-label="Threads"])',
    '[aria-label="Also from Meta"]',
    'div[role="button"]:has(svg[aria-label="Also from Meta"])',
    // Mobile web: "use the app" upsells and store badges
    'a[href*="itunes.apple.com"]',
    'a[href*="apps.apple.com"]',
    'a[href*="play.google.com"]',
    'a[href*="app.link"]',
    '[aria-label="Open app"]',
    // Mobile web: the inbox back arrow escapes to the feed; the thread view
    // arrow (same label) must survive, hence the route-scoped class.
    'html.im-inbox a:has(svg[aria-label="Back"])',
    'html.im-inbox div[role="button"]:has(svg[aria-label="Back"])',
    'html.im-inbox [role="button"]:has(svg[aria-label="Back"])',
    // Message Requests tab in the inbox header
    'a[href="/direct/requests/"]',
    'a[href^="/direct/requests"]',
    // Instagram's own "+". Its menu offers Post as well as Story, and posting
    // to the grid is out of scope - the phone reaches stories through the
    // "Your story" tray instead, so nothing needs this button on any platform.
    '[role="link"]:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="New post"])',
    'a:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="Create"])'
  ];
  // The Notifications heart stays on both platforms. This flip-flopped:
  // shipped on desktop 2026-07-30 (build 25), reverted the same afternoon
  // ("it's triggering smth in me"), re-added by explicit request 2026-07-31.
  // The wall behind it holds either way — likes tapped in the drawer land on
  // /p/, follows land on profiles, both deliberately open now.
  var style = document.createElement("style");
  // Avatars are never a doorway, but they are also not clutter: hiding the
  // link took the picture with it and left a hole in the profile header. Inert
  // rather than gone - the face still shows, the tap goes nowhere, and
  // profiles stay something you reach through a deliberate "View profile".
  style.textContent = css.join(',') + '{display:none !important;}' +
    "a:has(img[alt$='profile picture']){pointer-events:none !important;}";
  (document.head || document.documentElement).appendChild(style);

  // The phone inbox has no tab bar at all - Instagram's mobile-web DM layout
  // ships without one, so there was never a heart to keep. The only
  // notifications doorway on a phone is one we add ourselves: a floating
  // heart on the inbox, straight to Instagram's own activity page. Gated to
  // the inbox route (im-inbox) so it never floats over a conversation, and to
  // phones - the Mac tried a heart in build 25 and it came back out same-day.
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // Single-quoted on purpose: starting a double-quoted string with a hash
    // would put quote-then-hash in the source, which closes the Rust raw
    // string this script lives in.
    style.textContent +=
      '#im-heart{display:none;position:fixed;right:16px;bottom:24px;width:44px;height:44px;' +
      'border-radius:50%;background:rgba(38,38,38,.92);color:#f5f5f7;z-index:2147483000;' +
      'align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
      'html.im-inbox #im-heart{display:flex}';
    var heart = document.createElement("a");
    heart.id = "im-heart";
    heart.href = "/accounts/activity/";
    heart.setAttribute("aria-label", "Notifications");
    heart.innerHTML =
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
      " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0" +
      "-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg>";
    (document.body || document.documentElement).appendChild(heart);
  }


  // The notes/stories tray in the inbox is deliberately visible now: with
  // home caged it is the only doorway into a friend's story on either
  // platform. The hideTray() that removed it died with the /stories/ bounce.
  //
  // "Requests" tab: often a link/button with no stable href attribute, so
  // anchor on the text and hide its clickable ancestor. Matched as a prefix,
  // not an equality: the live tab renders a pending count ("Requests (2)"),
  // which an exact match missed entirely.
  function hideRequests() {
    var leaves = document.querySelectorAll("span,div,a");
    for (var i = 0; i < leaves.length; i++) {
      var el = leaves[i];
      if (el.childElementCount === 0 && /^Requests\b/.test(el.textContent.trim())) {
        var node = el, hops = 0;
        while (node && hops < 5) {
          if (node.tagName === "A" || node.getAttribute("role") === "button" ||
              node.getAttribute("role") === "link") {
            node.style.setProperty("display", "none", "important");
            return;
          }
          node = node.parentElement;
          hops++;
        }
        el.style.setProperty("display", "none", "important");
        return;
      }
    }
  }
  // The iPhone tap-swallower that used to live here is gone. Its entire job was
  // to stop shared media being watched - it killed the tap on a media bubble
  // because the fullscreen viewer it opens never changes the URL, so the path
  // cage above could not see it. Watching what someone sent you is now the
  // point, so there is nothing left for it to do.
  //
  // It took the "View profile" href bail-out and the inbox-avatar carve-out with
  // it; both existed only to stop the swallower being over-broad. If a reason to
  // block media taps ever comes back, those two go back with it.

  // NB: only attribute writes belong in here. This runs from a MutationObserver
  // watching childList, so anything that adds or removes nodes (textContent
  // included) retriggers it and spins until the page hangs.
  // The nav's Profile entry, which draws itself as your own avatar rather than
  // a labelled icon. It is not inside a <nav>, carries no aria-label, and is
  // an <a> shaped exactly like the avatar links we want to keep - what
  // separates it is position: chrome sits outside <main>, content inside it.
  // The profile header and every face in a thread are inside <main>.
  function hideProfileLink() {
    var a = document.querySelectorAll("a[href]");
    for (var i = 0; i < a.length; i++) {
      if (!a[i].closest("main") && a[i].querySelector("img[alt$='profile picture']")) {
        a[i].style.display = "none";
      }
    }
  }
  // A link someone sends in a DM opens nowhere: Instagram marks it
  // target="_blank", and a webview has no tabs, so window.open is a silent
  // no-op. Hand it to the real browser instead - inside the cage there is no
  // back button and no reason to render someone else's site.
  //
  // Deliberately not done by cancelling the navigation in Rust: the login
  // chain hops across Meta domains and out to reCAPTCHA, and a host allow-list
  // there strands it on a blank page. A click on an anchor is the one signal
  // that separates "the user asked for this" from "Instagram is redirecting".
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !/^https?:$/.test(a.protocol)) return;
    if (/(^|\.)instagram\.com$/.test(a.hostname)) return;
    e.preventDefault();
    if (window.__TAURI_INTERNALS__) {
      window.__TAURI_INTERNALS__
        .invoke("plugin:opener|open_url", { url: a.href })
        .catch(function () {});
    }
  }, true);

  // The only reel you may watch is the one that was sent to you, so the way
  // out of it has to be shut: Instagram advances to the next reel on a vertical
  // drag, a wheel tick, or the arrow/page keys. Kill all three, on the reel
  // permalink only, so threads and the inbox keep scrolling normally.
  // Deliberately gesture-level rather than selector-level: it does not care what
  // Instagram calls its containers this week, which every hide() in this file
  // does. Space is left alone - it pauses the video.
  // Two shapes to cover, confirmed on device: the Mac opens the reel at
  // /reel/<code>/, the phone opens a fullscreen player in place and never
  // touches the URL. So a path test alone misses the phone entirely - hence the
  // second test. A <video> filling the viewport is the player; a video bubble
  // inside a thread is not, so threads keep scrolling normally.
  // ponytail: re-queries the videos on each gesture event. Cache it on
  // touchstart if a thread full of clips ever feels sticky.
  function watchingReel() {
    if (/^\/reel\//.test(location.pathname)) return true;
    // A post page is not the reel player, however tall its video renders:
    // locking gestures there kills comment scrolling and the desktop's
    // next/prev arrows through a profile's grid.
    if (/^\/p\//.test(location.pathname)) return false;
    var v = document.querySelectorAll("video");
    for (var i = 0; i < v.length; i++) {
      if (v[i].getBoundingClientRect().height > innerHeight * 0.8) return true;
    }
    return false;
  }
  // preventDefault is not enough: Instagram advances to the next reel from its
  // OWN touch handlers, so suppressing the browser's default scroll leaves the
  // swipe working. The event has to never reach them, which is what capture +
  // stopImmediatePropagation does.
  ["wheel", "touchmove", "pointermove"].forEach(function (t) {
    document.addEventListener(t, function (e) {
      if (!watchingReel()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
  document.addEventListener("keydown", function (e) {
    if (watchingReel() && /^(Arrow(Up|Down)|Page(Up|Down)|Home|End)$/.test(e.key)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Instagram ships its web player muted. A once-per-element unmute was not
  // enough on device, which rules out "it just starts muted" and leaves two
  // live causes: the player re-mutes on re-render, and the audio can sit on a
  // different element from the picture. So unmute every media element, every
  // time one starts, rather than once per <video>.
  // WebKit permits this without a gesture: wry already sets
  // mediaTypesRequiringUserActionForPlayback to None.
  // volumechange is deliberately NOT a trigger - it would fight you muting it
  // by hand, and it re-enters through the write below.
  function unmute() {
    if (!watchingReel()) return;
    var m = document.querySelectorAll("video,audio");
    for (var i = 0; i < m.length; i++) {
      var e = m[i], h = e.getBoundingClientRect().height;
      // The picture fills the screen; a separate audio stream has no box at all
      // (an <audio>, or a zero-height <video> carrying only sound). A small box
      // is a clip sitting in the thread behind the player - leave it muted, or
      // the conversation plays over the reel.
      if (e.tagName === "AUDIO" || h === 0 || h > innerHeight * 0.8) {
        if (e.muted || !e.volume) { e.muted = false; e.volume = 1; }
      }
    }
  }
  // Driven by media events, not by sweep: sweep runs on every DOM mutation and
  // would undo you muting the thing by hand a moment later. Instagram re-mutes
  // when it re-renders, and a re-render restarts playback, so the events cover
  // it. They do not bubble but they do capture - hence the third argument.
  ["play", "playing", "loadedmetadata", "canplay"].forEach(function (t) {
    document.addEventListener(t, unmute, true);
  });

  function sweep() { hideRequests(); hideProfileLink(); }
  new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  sweep();
})();
"#;

/// Navigation gate: allow all web navigation so Meta's login / new-device
/// verification chain (which bounces across Meta domains and can hop to
/// external verification like reCAPTCHA) is never cancelled. The *feed* cage
/// is enforced by CAGE_SCRIPT on the main Instagram host, not here — a host
/// allow-list was stranding the login flow on a blank page.
/// "tauri" is the bundled splash page the webview starts on.
fn allowed(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https" | "about" | "data" | "blob" | "tauri")
}

// Present as Safari for the platform so Instagram's login isn't rejected as
// an unsupported in-app browser. iOS gets the iPhone UA so Instagram serves
// its mobile web layout.
//
// The Version/ token is derived at runtime so it matches the WebKit actually
// rendering the page; the hardcoded 17.4 it replaced was nine major versions
// behind on macOS 26 and would go stale again every release. The Macintosh/
// 10_15_7 and AppleWebKit/605.1.15 tokens are frozen in real Safari too, so
// those stay literal.
//
// NOTE for anyone debugging a login loop here: an `e=1348020` redirect loop
// out of /auth_platform/ is NOT a wrapper problem, and the UA is not the
// lever. It was chased at length on 2026-07-25 and traced to a single stuck
// Instagram account, which failed identically in Safari and in a clean Chrome
// profile on the same machine. A healthy account completes the whole
// new-device flow in this wrapper — reCAPTCHA image challenge, WhatsApp/SMS
// two-factor, "trust this device" — and lands in the inbox. Check the account
// against another browser before touching this code.

/// Version to claim when the installed Safari can't be read.
#[cfg(target_os = "macos")]
const FALLBACK_SAFARI_VERSION: &str = "26.5";

#[cfg(target_os = "macos")]
fn user_agent() -> String {
    let version = std::process::Command::new("defaults")
        .args([
            "read",
            "/Applications/Safari.app/Contents/Info.plist",
            "CFBundleShortVersionString",
        ])
        .output()
        .ok()
        .filter(|out| out.status.success())
        .and_then(|out| String::from_utf8(out.stdout).ok())
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty() && v.chars().all(|c| c.is_ascii_digit() || c == '.'))
        .unwrap_or_else(|| FALLBACK_SAFARI_VERSION.to_string());
    format!(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 \
         (KHTML, like Gecko) Version/{version} Safari/605.1.15"
    )
}

#[cfg(target_os = "ios")]
fn user_agent() -> String {
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 \
     (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        .to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tauri_builder = tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        // Links friends send in DMs: the cage hands them to the real browser
        // rather than opening them inside the app, which has no tabs, no back
        // button, and no business rendering canva.link.
        .plugin(tauri_plugin_opener::init());
    // Native notifications are macOS-only: the Mac app keeps running while
    // hidden, so its webview can watch for unread DMs. iOS suspends the
    // webview on background, so there is nothing there to register.
    #[cfg(target_os = "macos")]
    let tauri_builder = tauri_builder.plugin(tauri_plugin_notification::init());
    tauri_builder
        .setup(|app| {
            // Start on the bundled splash, not on instagram.com directly.
            // instagram.com begins with a network round-trip, and until its
            // response arrives there is no document for CAGE_SCRIPT to paint
            // into — which showed as a dead black window on every cold
            // launch. The splash paints from disk on the first frame, then
            // navigates; the in-page boot overlay takes over seamlessly at
            // instagram's document-start.
            let builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index.html".into()),
            )
            .initialization_script(CAGE_SCRIPT)
            // Without this the webview paints white until Instagram's first
            // frame arrives, so launch flashed white -> black. Sets both the
            // window and the webview.
            .background_color(Color(0, 0, 0, 255))
            .on_navigation(|url| allowed(url));

            // Only Apple platforms get an override. WebView2 on Windows
            // already reports a genuine Edge-on-Windows UA, so the old shared
            // constant had the Windows build claiming to be Safari on a Mac.
            #[cfg(any(target_os = "macos", target_os = "ios"))]
            let builder = builder.user_agent(&user_agent());

            #[cfg(desktop)]
            let builder = builder
                .title("Konvo")
                .inner_size(1100.0, 760.0);

            let window = builder.build()?;

            // iOS: wry builds the WKWebView at the parent view's full frame, so
            // the layout viewport spans the status bar and the home indicator —
            // Instagram's header paints under the clock, where the system owns
            // the pixels and the back arrow can't be tapped.
            //
            // This has to be fixed here rather than in CAGE_SCRIPT. Instagram
            // sizes its shell in vh, which always resolves to the full screen,
            // so no padding or height we set on an ancestor can reclaim the
            // space; the webview itself has to be smaller. Constraints against
            // the safe-area guide resolve at layout time, unlike safeAreaInsets,
            // which still reads zero this early in setup.
            #[cfg(target_os = "ios")]
            {
                use objc2::runtime::{AnyObject, Bool};
                use objc2::msg_send;

                let _ = window.with_webview(|webview| unsafe {
                    let wk: *mut AnyObject = webview.inner().cast();
                    let vc: *mut AnyObject = webview.view_controller().cast();
                    let root: *mut AnyObject = msg_send![vc, view];
                    let guide: *mut AnyObject = msg_send![root, safeAreaLayoutGuide];

                    // Hand sizing to Auto Layout; wry set a flexible
                    // autoresizing mask that would otherwise fight these.
                    let _: () = msg_send![
                        wk,
                        setTranslatesAutoresizingMaskIntoConstraints: Bool::NO
                    ];

                    let pin = |a: *mut AnyObject, b: *mut AnyObject| {
                        let c: *mut AnyObject = msg_send![a, constraintEqualToAnchor: b];
                        let _: () = msg_send![c, setActive: Bool::YES];
                    };
                    pin(msg_send![wk, topAnchor], msg_send![guide, topAnchor]);
                    pin(msg_send![wk, bottomAnchor], msg_send![guide, bottomAnchor]);
                    pin(msg_send![wk, leadingAnchor], msg_send![guide, leadingAnchor]);
                    pin(msg_send![wk, trailingAnchor], msg_send![guide, trailingAnchor]);
                });
            }

            // macOS: the red × hides the window instead of quitting, so the
            // app stays in the Dock and reopens instantly (⌘Q still quits).
            #[cfg(target_os = "macos")]
            {
                let hide_target = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = hide_target.hide();
                    }
                });

                // Menu bar icon: one click brings the hidden window back, the
                // same job as the Dock icon but always on screen. No menu —
                // the only action Konvo has is "show me my messages".
                // tray.png is a template image (black + alpha, generated
                // monochrome bubble): macOS recolors it to match the menu bar
                // theme, like every system icon. The colored app icon was
                // tried first and read as noise next to the monochrome row.
                let tray_target = window.clone();
                tauri::tray::TrayIconBuilder::new()
                    .icon(tauri::image::Image::from_bytes(include_bytes!(
                        "../icons/tray.png"
                    ))?)
                    .icon_as_template(true)
                    .on_tray_icon_event(move |_, event| {
                        if let tauri::tray::TrayIconEvent::Click { .. } = event {
                            let _ = tray_target.show();
                            let _ = tray_target.set_focus();
                        }
                    })
                    .build(app)?;
            }

            #[cfg(all(debug_assertions, desktop))]
            window.open_devtools();

            // instamessages://open           → just bring the app forward.
            // instamessages://dm/<username>  → and jump to that DM composer.
            // In `scheme://host/path`, the first segment is the *host*, not the
            // path — so branch on it. Anything unrecognized surfaces the window
            // where it was rather than being read as a username.
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    if url.scheme() != "instamessages" {
                        continue;
                    }
                    let user = match url.host_str().unwrap_or("") {
                        "dm" => url.path().trim_start_matches('/').to_string(),
                        _ => String::new(),
                    };
                    // Restore first: the macOS close button only hides the
                    // window, so "running but invisible" is the steady state
                    // and set_focus alone can't be relied on to reveal it.
                    #[cfg(desktop)]
                    let _ = window.show();
                    if !user.is_empty() && user.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '_') {
                        let _ = window.eval(&format!(
                            "location.href='https://www.instagram.com/m/{}'",
                            user
                        ));
                    }
                    let _ = window.set_focus();
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building Konvo")
        .run(|_app, _event| {
            // Dock icon click while the window is hidden → bring it back.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                if let Some(w) = _app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
        });
}
