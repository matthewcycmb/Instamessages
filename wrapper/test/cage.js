
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
    // Instagram's own "+". Hidden everywhere, and this is SETTLED, not a
    // default: builds 28-29 (2026-07-31) ran the story-posting experiment a
    // tester asked for - the CSS unhide revealed nothing (the DM inbox
    // renders no create entry) and a direct probe at /create/story/ was
    // bounced through "/" by Instagram itself, on device. Web posting cannot
    // work without exempting home, and home is where every 07-29 leak came
    // from. Posting lives in the real Instagram app.
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
  // What counts as "leaves the app": any http(s) URL that is not Instagram's.
  // l.instagram.com is Meta's linkshim - every external link in a DM or a
  // story sticker is wrapped in it - so it unwraps to its ?u= destination
  // rather than being treated as Instagram's own.
  function externalize(href) {
    try {
      var u = new URL(href, location.href);
      if (!/^https?:$/.test(u.protocol)) return null;
      if (u.hostname === "l.instagram.com") {
        var real = u.searchParams.get("u");
        if (real) return externalize(real) || real;
      }
      if (/(^|\.)instagram\.com$/.test(u.hostname)) return null;
      return u.href;
    } catch (e) { return null; }
  }
  // One tap can reach the browser twice - the anchor handler fires AND
  // Instagram's own handler calls window.open on the same URL - so identical
  // opens within a beat collapse to one Safari tab.
  var lastOpen = "", lastOpenAt = 0;
  function openExternal(url) {
    var now = Date.now();
    if (url === lastOpen && now - lastOpenAt < 1500) return;
    lastOpen = url; lastOpenAt = now;
    if (window.__TAURI_INTERNALS__) {
      window.__TAURI_INTERNALS__
        .invoke("plugin:opener|open_url", { url: url })
        .catch(function () {});
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var ext = externalize(a.href);
    if (!ext) return;
    e.preventDefault();
    openExternal(ext);
  }, true);
  // The anchor handler only sees real <a> taps. Mobile DM bubbles and story
  // link stickers open through window.open instead, which is a silent no-op
  // in a webview - the tap just dies. Route it like a click: external to the
  // real browser, Instagram's own "new tab" navigates in place (the cage
  // rules on the destination still apply). Returning null is what a blocked
  // popup returns, which every site already handles.
  window.open = function (href) {
    var ext = href && externalize(href);
    if (ext) openExternal(ext);
    else if (href) location.href = href;
    return null;
  };

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

  // The paywall, phone only. Konvo is a paid app on iOS: an iPhone at the
  // inbox without an active subscription gets the two-page paywall (S11
  // value -> S12 price), with the decline path (S13 counter-offer -> S14
  // hard stop) behind the close button. The Mac stays free - S11 promises
  // "the Mac app is included", so the gate must never appear there.
  //
  // Money truth lives in StoreKit (Transaction.currentEntitlements via
  // KonvoStore.swift), not in this cache. localStorage.konvoPaid exists so a
  // paying user coming back offline, or before the bridge answers, never
  // sees a paywall flash; every launch re-verifies and the verdict wins,
  // both directions. There is no "onboarded" flag on this origin on purpose:
  // on iOS the bundled onboarding page gates every path to the inbox, so
  // "at the inbox on an iPhone" already means onboarding is done.
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) (function () {
    function cached() {
      try { return !!localStorage.getItem("konvoPaid"); } catch (e) { return false; }
    }
    function setCache(v) {
      try {
        if (v) localStorage.setItem("konvoPaid", "1");
        else localStorage.removeItem("konvoPaid");
      } catch (e) {}
    }

    // Bridge to KonvoStore.swift. Fire-and-forget postMessage with a numbered
    // callback; Swift replies through __konvoStoreReply. A build without the
    // Swift class (or the tests) has no handler - the catch answers null and
    // everything degrades to "no verdict, keep the cache".
    var pending = {}, seq = 0;
    window.__konvoStoreReply = function (id, res) {
      var cb = pending[id];
      delete pending[id];
      if (cb) cb(res || null);
    };
    function storekit(cmd, productId, cb) {
      seq++;
      pending[seq] = cb;
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: cmd, id: seq, productId: productId || "" });
      } catch (e) { delete pending[seq]; cb(null); }
    }

    style.textContent +=
      '#im-pay{position:fixed;inset:0;z-index:2147483645;background:#fff;color:#141d33;' +
      'display:flex;flex-direction:column;font-family:-apple-system,system-ui,sans-serif;' +
      '-webkit-font-smoothing:antialiased}' +
      '#im-pay h2{margin:0;font-weight:700;letter-spacing:-0.035em;line-height:1.2}' +
      '#im-pay p{margin:0}' +
      '#im-pay .imp-mid{flex:1;display:flex;flex-direction:column;justify-content:center;' +
      'padding:0 24px;overflow-y:auto}' +
      '#im-pay .imp-foot{flex:none;padding:0 20px 34px}' +
      '#im-pay .imp-btn{width:100%;min-height:54px;border:0;border-radius:13px;' +
      'background:#0a5cf0;color:#fff;font-family:inherit;font-size:17px;font-weight:600;' +
      'letter-spacing:-0.012em;box-shadow:0 8px 18px rgba(10,92,240,.24)}' +
      '#im-pay .imp-btn[disabled]{opacity:.5}' +
      '#im-pay .imp-ghost{text-align:center;font-size:15px;color:#5d6478;padding:16px 0 2px}' +
      '#im-pay .imp-fine{text-align:center;font-size:12.5px;line-height:1.5;color:#5d6478;' +
      'margin-top:12px}' +
      '#im-pay .imp-links{display:flex;justify-content:center;gap:18px;margin-top:10px;' +
      'font-size:13.5px;color:#5d6478}' +
      '#im-pay .imp-links span{text-decoration:underline}' +
      '#im-pay .imp-trust{display:flex;align-items:flex-start;gap:14px}' +
      '#im-pay .imp-ic{width:34px;height:34px;flex:none;border-radius:10px;background:#eef3ff;' +
      'display:inline-flex;align-items:center;justify-content:center}' +
      '#im-pay .imp-trust b{display:block;font-size:17px;font-weight:600}' +
      '#im-pay .imp-trust i{display:block;font-style:normal;font-size:15px;line-height:1.45;' +
      'color:#5d6478;margin-top:3px}';

    // Every word below is Matthew's, hand-tuned in the onboarding mockup -
    // do not edit copy here. S15's "Seven days free" line is why monthly and
    // weekly purchases and restores skip that page: only yearly has a trial.
    var CHECK =
      "<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20 6 9 17l-5-5'/></svg>";
    var PAGES = {
      value:
        "<div class='imp-mid' style='padding:0 20px'>" +
        "<h2 style='font-size:26px;margin-bottom:24px'>You're here for the messages.</h2>" +
        "<div style='display:flex;gap:10px;margin-bottom:26px'>" +
        "<div style='flex:1;height:132px;border-radius:16px;box-shadow:inset 0 0 0 1px #d9d9de;" +
        "padding:12px;display:flex;flex-direction:column;gap:6px;overflow:hidden'>" +
        "<span style='height:30px;border-radius:5px;background:#eeeae3'></span>" +
        "<span style='height:14px;width:70%;border-radius:5px;background:#eeeae3'></span>" +
        "<span style='height:26px;border-radius:5px;background:#eeeae3'></span>" +
        "<span style='height:18px;width:45%;border-radius:5px;background:#eeeae3'></span>" +
        "<span style='font-size:11px;font-weight:700;letter-spacing:0.07em;color:#5d6478;" +
        "margin-top:2px'>BEFORE</span></div>" +
        "<div style='flex:1;height:132px;border-radius:16px;box-shadow:inset 0 0 0 1.4px #0a5cf0;" +
        "padding:12px;display:flex;flex-direction:column;gap:10px'>" +
        "<span style='display:flex;align-items:center;gap:8px'><span style='width:20px;" +
        "height:20px;border-radius:50%;background:#0a5cf0'></span><span style='flex:1;" +
        "height:8px;border-radius:4px;background:#eeeae3'></span></span>" +
        "<span style='display:flex;align-items:center;gap:8px'><span style='width:20px;" +
        "height:20px;border-radius:50%;background:#d9d9de'></span><span style='flex:1;" +
        "height:8px;border-radius:4px;background:#eeeae3'></span></span>" +
        "<span style='display:flex;align-items:center;gap:8px'><span style='width:20px;" +
        "height:20px;border-radius:50%;background:#d9d9de'></span><span style='flex:1;" +
        "height:8px;border-radius:4px;background:#eeeae3'></span></span>" +
        "<span style='flex:1'></span>" +
        "<span style='font-size:11px;font-weight:700;letter-spacing:0.07em;color:#0a5cf0'>" +
        "KONVO</span></div></div>" +
        "<div style='display:flex;flex-direction:column;gap:18px'>" +
        "<div class='imp-trust'><span class='imp-ic'><svg width='18' height='18'" +
        " viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' stroke-width='2.1'" +
        " stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 0 2.1 1.1 4 2.9 " +
        "5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/></svg></span>" +
        "<span><b>All your messages</b><i>DMs, group chats, requests, new conversations." +
        "</i></span></div>" +
        "<div class='imp-trust'><span class='imp-ic'><svg width='18' height='18'" +
        " viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' stroke-width='2.2'" +
        " stroke-linecap='round'><circle cx='12' cy='12' r='9'/>" +
        "<path d='m5.8 5.8 12.4 12.4'/></svg></span>" +
        "<span><b>No feed, no Reels, no Explore</b><i>Gone, not hidden. There is nothing " +
        "to scroll.</i></span></div>" +
        "<div class='imp-trust'><span class='imp-ic'><svg width='18' height='18'" +
        " viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' stroke-width='2.1'" +
        " stroke-linecap='round'><circle cx='12' cy='12' r='9' stroke-dasharray='4 3'/>" +
        "<circle cx='12' cy='12' r='4'/></svg></span>" +
        "<span><b>Friends' stories stay</b><i>From people you follow, right in your inbox." +
        "</i></span></div>" +
        "<div class='imp-trust'><span class='imp-ic'><svg width='18' height='18'" +
        " viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' stroke-width='2'" +
        " stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='5' width='18'" +
        " height='12' rx='2'/><path d='M2 19h20'/></svg></span>" +
        "<span><b>iPhone and Mac</b><i>The Mac app is included.</i></span></div>" +
        "</div></div>" +
        "<div class='imp-foot'><button class='imp-btn' data-act='price'>Continue</button></div>",
      counter:
        "<div class='imp-mid' style='padding:0 20px'>" +
        "<h2 style='font-size:30px;letter-spacing:-0.04em;line-height:1.16;" +
        "margin-bottom:8px'>Not ready for a year?</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:#5d6478;margin-bottom:24px'>" +
        "Try it a week at a time.</p>" +
        "<div style='border-radius:16px;background:#f0f5ff;box-shadow:inset 0 0 0 2px #0a5cf0;" +
        "padding:20px'>" +
        "<div style='font-size:24px;font-weight:700;letter-spacing:-0.035em'>$1.99 a week" +
        "</div><div style='font-size:15px;color:#5d6478;margin-top:6px'>Cancel anytime. " +
        "No trial.</div></div></div>" +
        "<div class='imp-foot'>" +
        "<button class='imp-btn' data-act='weekly'>Try a week</button>" +
        "<div class='imp-ghost' data-act='stop'>No thanks</div>" +
        "<div class='imp-fine' style='margin-top:8px'>$1.99/week, auto-renews weekly until " +
        "canceled in Settings &rsaquo; Subscriptions.</div>" +
        "<div class='imp-links' style='margin-top:8px'>" +
        "<span data-act='restore'>Restore Purchases</span>" +
        "<span data-act='terms'>Terms of Use</span>" +
        "<span data-act='privacy'>Privacy Policy</span></div></div>",
      stop:
        "<div class='imp-mid'>" +
        "<div style='margin-bottom:28px'><svg width='52' height='52' viewBox='0 0 512 512'>" +
        "<rect width='512' height='512' rx='116' fill='#0a5cf0'/>" +
        "<path d='M256 146c-64 0-116 45-116 100 0 31 16 58 42 76v46l52-25c7 1 14 2 22 2 " +
        "64 0 116-45 116-99s-52-100-116-100Z' fill='none' stroke='#fff' stroke-width='26'" +
        " stroke-linejoin='round'/></svg></div>" +
        "<h2 style='font-size:26px;margin-bottom:12px'>Konvo is a paid app.</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:#5d6478'>Instagram's free version " +
        "is still there, with everything we just hid.</p></div>" +
        "<div class='imp-foot'>" +
        "<button class='imp-btn' data-act='price'>See plans</button>" +
        "<div class='imp-ghost' data-act='restore'>Restore Purchase</div></div>",
      unlocked:
        "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        "<svg width='118' height='118' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'" +
        " style='margin-bottom:42px'><path d='M20 6 9 17l-5-5'/></svg>" +
        "<div style='font-size:44px;font-weight:700;letter-spacing:-0.05em;line-height:1;" +
        "text-align:center'>You're in.</div>" +
        "<p style='font-size:17px;line-height:1.5;color:#5d6478;margin-top:16px;" +
        "text-align:center'>Seven days free. Your messages are waiting.</p></div>" +
        "<div class='imp-foot' style='padding:0 28px 40px'>" +
        "<button class='imp-btn' data-act='done'>Open my messages</button>" +
        "<div class='imp-ghost' data-act='mac' style='font-size:16px;font-weight:600;" +
        "color:#0a5cf0'>Get Konvo on your Mac too</div></div>"
    };

    // S12 is the one two-state page: the Yearly/Monthly toggle. Each state
    // tells its own truth - the trial timeline and "8¢ a day" belong to
    // yearly alone; monthly is $4.99 with no trial, so its headline says 16¢
    // (same round-down arithmetic as the 8) and the timeline goes away
    // rather than describe a trial that does not exist.
    function seg(label, act, selected) {
      return "<span data-act='" + act + "' style='flex:1;text-align:center;padding:9px 0;" +
        "border-radius:9px;font-size:15px;font-weight:600;" +
        (selected ? "background:#fff;box-shadow:0 1px 3px rgba(20,29,51,0.12);color:#141d33"
                  : "color:#5d6478") + "'>" + label + "</span>";
    }
    var TIMELINE =
      "<div style='display:flex;flex-direction:column'>" +
      "<div style='display:flex;gap:15px'>" +
      "<div style='flex:none;display:flex;flex-direction:column;align-items:center'>" +
      "<span style='width:32px;height:32px;border-radius:50%;background:#0a5cf0;" +
      "display:inline-flex;align-items:center;justify-content:center'>" +
      "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<rect x='4' y='10.5' width='16' height='10.5' rx='3'/>" +
      "<path d='M8.5 10.5V8a3.5 3.5 0 0 1 7 0'/></svg></span>" +
      "<span style='flex:1;width:3px;border-radius:999px;background:rgba(10,92,240,.22);" +
      "margin-top:5px'></span></div>" +
      "<div style='padding-bottom:20px'><div style='font-size:16.5px;font-weight:700;" +
      "letter-spacing:-0.02em'>Today</div><div style='font-size:15px;line-height:1.45;" +
      "color:#5d6478;margin-top:2px'>Everything unlocks.</div></div></div>" +
      "<div style='display:flex;gap:15px'>" +
      "<div style='flex:none;display:flex;flex-direction:column;align-items:center'>" +
      "<span style='width:32px;height:32px;border-radius:50%;background:#6f9de4;" +
      "display:inline-flex;align-items:center;justify-content:center'>" +
      "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M18 8.5a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7'/>" +
      "<path d='M10.4 20.5a2 2 0 0 0 3.2 0'/></svg></span>" +
      "<span style='flex:1;width:3px;border-radius:999px;background:rgba(10,92,240,.22);" +
      "margin-top:5px'></span></div>" +
      "<div style='padding-bottom:20px'><div style='font-size:16.5px;font-weight:700;" +
      "letter-spacing:-0.02em'>Day 5</div><div style='font-size:15px;line-height:1.45;" +
      "color:#5d6478;margin-top:2px'>We'll remind you the trial is ending.</div></div></div>" +
      "<div style='display:flex;gap:15px'>" +
      "<div style='flex:none;display:flex;flex-direction:column;align-items:center'>" +
      "<span style='width:32px;height:32px;border-radius:50%;background:#a8bedd;" +
      "display:inline-flex;align-items:center;justify-content:center'>" +
      "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='m12 3 2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.9l1.2-6.5-4.8-4.6 " +
      "6.6-.9Z'/></svg></span></div>" +
      "<div><div style='font-size:16.5px;font-weight:700;letter-spacing:-0.02em'>Day 7" +
      "</div><div style='font-size:15px;line-height:1.45;color:#5d6478;margin-top:2px'>" +
      "You'll be charged $29.99, cancel anytime before.</div></div></div>" +
      "</div>";
    function pricePage(monthly) {
      return "<div style='flex:none;padding:18px 28px 0;display:flex;" +
        "justify-content:flex-end'>" +
        "<button data-act='counter' aria-label='Close' style='background:none;border:0;" +
        "padding:8px;margin:-8px'><svg width='15' height='15' viewBox='0 0 24 24'" +
        " fill='none' stroke='#5d6478' stroke-width='2.8' stroke-linecap='round'>" +
        "<path d='M18 6 6 18'/><path d='m6 6 12 12'/></svg></button></div>" +
        "<div class='imp-mid' style='padding:0 28px'>" +
        "<h2 style='font-size:29px;letter-spacing:-0.04em;line-height:1.14'>Cure your " +
        "scrolling addiction for <span style='color:#0a5cf0'>" +
        (monthly ? "16&cent;" : "8&cent;") + " a day</span>.</h2>" +
        "<p style='font-size:16px;line-height:1.45;color:#5d6478;margin:8px 0 20px'>" +
        (monthly ? "$4.99 a month. Cancel anytime."
                 : "First 7 days free, then $29.99 a year.") + "</p>" +
        "<div style='display:flex;background:#f2f4f7;border-radius:12px;padding:4px;" +
        "margin-bottom:26px'>" +
        seg("Yearly", "price", !monthly) + seg("Monthly", "price-m", monthly) +
        "</div>" +
        (monthly ? "" : TIMELINE) + "</div>" +
        "<div class='imp-foot' style='padding:22px 28px 34px'>" +
        "<button class='imp-btn' data-act='" + (monthly ? "monthly" : "yearly") + "'>" +
        (monthly ? "Subscribe for $4.99 a month" : "Start my free week") + "</button>" +
        "<div class='imp-fine'>" +
        (monthly ? "$4.99/month, auto-renews monthly until "
                 : "$29.99/year after the free trial. Auto-renews yearly until ") +
        "canceled in Settings &rsaquo; Subscriptions.</div>" +
        "<div class='imp-links'><span data-act='restore'>Restore Purchases</span>" +
        "<span data-act='terms'>Terms of Use</span>" +
        "<span data-act='privacy'>Privacy Policy</span></div></div>";
    }

    var wall = null;
    function dismiss() {
      if (wall && wall.parentNode) wall.parentNode.removeChild(wall);
      wall = null;
    }
    function buy(btn, productId) {
      btn.disabled = true;
      storekit("purchase", productId, function (res) {
        btn.disabled = false;
        if (res && res.ok && res.entitled) {
          setCache(true);
          // Only the yearly plan has the trial S15 talks about.
          if (productId === "konvo.pro.yearly") wall.innerHTML = PAGES.unlocked;
          else dismiss();
        }
      });
    }
    function ensure() {
      if (wall || cached() || !atInbox()) return;
      wall = document.createElement("div");
      wall.id = "im-pay";
      wall.innerHTML = PAGES.value;
      wall.addEventListener("click", function (e) {
        var t = e.target.closest("[data-act]");
        if (!t || !wall) return;
        var act = t.getAttribute("data-act");
        if (act === "price" || act === "price-m") {
          wall.innerHTML = pricePage(act === "price-m");
        } else if (act === "counter" || act === "stop") {
          wall.innerHTML = PAGES[act];
        } else if (act === "yearly") {
          buy(t, "konvo.pro.yearly");
        } else if (act === "monthly") {
          buy(t, "konvo.pro.monthly");
        } else if (act === "weekly") {
          buy(t, "konvo.pro.weekly");
        } else if (act === "restore") {
          // AppStore.sync then re-read entitlements; unlocking straight to
          // the inbox - a restorer is returning, not starting a trial.
          storekit("restore", null, function (res) {
            if (res && res.entitled) { setCache(true); dismiss(); }
          });
        } else if (act === "done") {
          dismiss();
        } else if (act === "mac") {
          openExternal("https://konvoinstall.com");
        } else if (act === "terms") {
          openExternal("https://konvoinstall.com/terms");
        } else if (act === "privacy") {
          openExternal("https://konvoinstall.com/privacy");
        }
      });
      (document.body || document.documentElement).appendChild(wall);
    }

    // Verify at every launch; the verdict beats the cache in both
    // directions. No reply (bridge missing, StoreKit unreachable offline)
    // changes nothing - the cache carries a paying user through airplane
    // mode, and a fresh user has no cache to be wrongly unlocked by.
    storekit("entitlements", null, function (res) {
      if (!res) return;
      setCache(!!res.entitled);
      if (res.entitled) dismiss();
    });
    // Same belt-and-braces cadence as enforce(): the inbox is reached by SPA
    // navigation after login, which fires no event this script can hook.
    setInterval(ensure, 800);
    ensure();
  })();

  function sweep() { hideRequests(); hideProfileLink(); }
  new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  sweep();
})();
