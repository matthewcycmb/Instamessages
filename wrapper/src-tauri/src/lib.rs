// Instachat Wrapper: a caged instagram.com for the things the official
// API can never do — starting new conversations, group chats, and (on iOS)
// DMs for private accounts. Cage rules: DM inbox + login flows only. No
// feed, no reels, no explore, no profiles, no stories.

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
    'html.im-inbox [role="button"]:has(svg[aria-label="Back"])'
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
      if (el.childElementCount === 0 && /^Your note$/.test(el.textContent.trim())) {
        var node = el, hops = 0;
        while (node.parentElement && hops < 8) {
          node = node.parentElement;
          hops++;
          if (node.querySelectorAll("img").length >= 2) {
            node.style.setProperty("display", "none", "important");
            return;
          }
        }
      }
    }
  }
  new MutationObserver(hideTray).observe(document.documentElement, { childList: true, subtree: true });
})();
"#;

/// Host-level gate: allow the whole Meta domain family so login, two-factor,
/// Accounts Center, CDNs, and API subdomains all work. The *feed* cage is
/// enforced by CAGE_SCRIPT on the instagram.com path, not here — blocking by
/// host was breaking the login redirect chain.
fn allowed(url: &Url) -> bool {
    let scheme = url.scheme();
    if scheme == "about" || scheme == "data" || scheme == "blob" {
        return true;
    }
    match url.host_str() {
        Some(host) => {
            host == "instagram.com"
                || host.ends_with(".instagram.com")
                || host == "facebook.com"
                || host.ends_with(".facebook.com")
                || host == "ig.me"
                || host.ends_with(".cdninstagram.com")
                || host.ends_with(".fbcdn.net")
                || host == "meta.com"
                || host.ends_with(".meta.com")
        }
        None => false,
    }
}

// Present as Safari for the platform so Instagram's login isn't rejected as
// an unsupported in-app browser. iOS gets the iPhone UA so Instagram serves
// its mobile web layout.
#[cfg(not(target_os = "ios"))]
const USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
     AppleWebKit/605.1.15 (KHTML, like Gecko) \
     Version/17.4 Safari/605.1.15";
#[cfg(target_os = "ios")]
const USER_AGENT: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) \
     AppleWebKit/605.1.15 (KHTML, like Gecko) \
     Version/17.5 Mobile/15E148 Safari/604.1";

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
            .user_agent(USER_AGENT)
            .on_navigation(|url| allowed(url));

            #[cfg(desktop)]
            let builder = builder
                .title("Instachat")
                .inner_size(1100.0, 760.0);

            let window = builder.build()?;

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

            // instamessages://dm/<username> → jump straight to that DM composer.
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    if url.scheme() != "instamessages" {
                        continue;
                    }
                    let user = url
                        .path()
                        .trim_start_matches('/')
                        .trim_start_matches("dm/")
                        .to_string();
                    let user = if user.is_empty() {
                        url.host_str().filter(|h| *h != "dm").unwrap_or("").to_string()
                    } else {
                        user
                    };
                    if !user.is_empty() && user.chars().all(|c| c.is_alphanumeric() || c == '.' || c == '_') {
                        let _ = window.eval(&format!(
                            "location.href='https://www.instagram.com/m/{}'",
                            user
                        ));
                        let _ = window.set_focus();
                    }
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
