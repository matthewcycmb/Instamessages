// Instachat Wrapper: a caged instagram.com for the things the official
// API can never do — starting new conversations, group chats, and (on iOS)
// DMs for private accounts. Cage rules: DM inbox + login flows only. No
// feed, no reels, no explore, no profiles, no stories.

use tauri::utils::config::Color;
use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;
#[cfg(target_os = "macos")]
use tauri::Manager;

const HOME: &str = "https://www.instagram.com/direct/inbox/";

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

  // Feed + any standalone media viewer: a reel/post/story shared in a DM
  // opens a viewer whose URL becomes /reel|/p|/tv|/stories — bounce it, so
  // shared media can't be watched. The DM preview thumbnail still shows.
  var FEED = [
    /^\/$/, /^\/reels?(\/|$)/, /^\/explore(\/|$)/,
    /^\/p\//, /^\/tv\//, /^\/stories\//
  ];
  // Auth/DM plumbing that must never be touched. Everything else that looks
  // like /<username> is a profile page — another relapse doorway (mobile web
  // makes avatars tappable everywhere).
  var SAFE = /^\/(direct|accounts|challenge|challenges|two_factor|auth_platform|oauth|api|graphql|session|login|legal|terms|privacy|about|emails|m)(\/|$)/;
  var PROFILE = /^\/[A-Za-z0-9._]+\/?$/;
  function blocked(p) {
    if (FEED.some(function (r) { return r.test(p); })) return true;
    if (PROFILE.test(p) && !SAFE.test(p)) return true;
    return false;
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
    '[role="link"]:has(svg[aria-label="Notifications"])',
    'a:has(svg[aria-label="Notifications"])',
    '[role="link"]:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="New post"])',
    'a:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="Create"])',
    'a:has(svg[aria-label="Profile"])',
    'a:has(img[alt$="profile picture"])',
    // the leftover paper-plane: the Direct/Messages nav icon (we are already in DMs)
    'a[href="/direct/inbox/"]',
    'a[href="/direct/"]',
    'a:has(svg[aria-label="Direct"])',
    'a:has(svg[aria-label="Messenger"])',
    'a:has(svg[aria-label="Messages"])',
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
    'a[href^="/direct/requests"]'
  ].join(',') + '{display:none !important;}';
  var style = document.createElement("style");
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);


  // Notes/stories tray in the mobile inbox: the hard wall is the URL cage
  // (tapping a story ring lands on /stories/... and bounces), this hides the
  // temptation row itself. Anchored on the "Your note" leaf because
  // Instagram's class names are minified and unstable.
  function hideTray() {
    var leaves = document.querySelectorAll("span,div");
    for (var i = 0; i < leaves.length; i++) {
      var el = leaves[i];
      if (el.childElementCount !== 0 || el.textContent.trim() !== "Your note") continue;
      // Walk out to the outermost ancestor that is still one row: the tray
      // spans the viewport but stays short, while the conversation list around
      // it is tall. The original anchor required >= 2 images in an ancestor and
      // missed the common case where yours is the only note; the replacement
      // then capped the walk at 8 hops, and the row measured on a real inbox
      // sits at hop 9-10 (140x357 against a 390 viewport), so it was never
      // reached. 14 leaves headroom without running into the tall scroller,
      // which the height test rejects anyway.
      // ponytail: geometric heuristic, swap for a stable selector if Instagram
      // ever ships one.
      var node = el, row = null, hops = 0;
      while (node.parentElement && hops < 14) {
        node = node.parentElement;
        hops++;
        var r = node.getBoundingClientRect();
        if (r.height > 0 && r.height <= 200 && r.width >= window.innerWidth * 0.8) {
          row = node;
        }
      }
      if (row) {
        row.style.setProperty("display", "none", "important");
        return;
      }
    }
  }
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
  // NB: only attribute writes belong in here. This runs from a MutationObserver
  // watching childList, so anything that adds or removes nodes (textContent
  // included) retriggers it and spins until the page hangs.
  function sweep() { hideTray(); hideRequests(); }
  new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  sweep();
})();
"#;

/// Navigation gate: allow all web navigation so Meta's login / new-device
/// verification chain (which bounces across Meta domains and can hop to
/// external verification like reCAPTCHA) is never cancelled. The *feed* cage
/// is enforced by CAGE_SCRIPT on the main Instagram host, not here — a host
/// allow-list was stranding the login flow on a blank page.
fn allowed(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https" | "about" | "data" | "blob")
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
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(HOME.parse().unwrap()),
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
                .title("Instachat")
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
        .expect("error while building Instachat")
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
