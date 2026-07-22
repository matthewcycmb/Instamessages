// Instamessages Wrapper: a caged instagram.com for the two things the
// official API can never do — starting new conversations and group chats.
// Cage rules (decision Q3): DM inbox + login flows only. No feed, no
// reels, no explore, no profiles.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;

const HOME: &str = "https://www.instagram.com/direct/inbox/";

/// Runs at document-start on every page. Block-list, not allow-list: only the
/// actual feed surfaces (home, reels, explore) redirect to the inbox. Login,
/// two-factor, onetap, accounts, and every /direct page are left completely
/// alone, so the auth flow never gets interrupted. Redirect is deferred to
/// the SPA router (assign, not replace at parse time) to avoid blanking.
const CAGE_SCRIPT: &str = r#"
(function () {
  // Feed + any standalone media viewer: a reel/post/story shared in a DM
  // opens a viewer whose URL becomes /reel|/p|/tv|/stories — bounce it, so
  // shared media can't be watched. The DM preview thumbnail still shows.
  var FEED = [
    /^\/$/, /^\/reels?(\/|$)/, /^\/explore(\/|$)/,
    /^\/p\//, /^\/tv\//, /^\/stories\//
  ];
  function blocked(p) { return FEED.some(function (r) { return r.test(p); }); }
  function enforce() {
    if (!location.hostname.endsWith("instagram.com")) return;
    if (blocked(location.pathname)) {
      try { window.stop(); } catch (e) {}
      location.replace("/direct/inbox/");
    }
  }
  var push = history.pushState.bind(history);
  history.pushState = function () { push.apply(null, arguments); setTimeout(enforce, 0); };
  window.addEventListener("popstate", enforce);
  document.addEventListener("DOMContentLoaded", enforce);

  // Hide the whole left navigation rail (Home, Reels, Search, Notifications,
  // Create, Profile, More, Meta-apps). DMs live in their own columns, so none
  // of these are needed — and removing them kills every relapse doorway.
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
    'div[role="button"]:has(svg[aria-label="Also from Meta"])'
  ].join(',') + '{display:none !important;}';
  var style = document.createElement("style");
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(HOME.parse().unwrap()),
            )
            .title("Instamessages Wrapper")
            .inner_size(1100.0, 760.0)
            .initialization_script(CAGE_SCRIPT)
            // Present as desktop Safari so Instagram's login isn't rejected as
            // an unsupported in-app browser.
            .user_agent(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) \
                 AppleWebKit/605.1.15 (KHTML, like Gecko) \
                 Version/17.4 Safari/605.1.15",
            )
            .on_navigation(|url| allowed(url))
            .build()?;

            #[cfg(debug_assertions)]
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
        .run(tauri::generate_context!())
        .expect("error while running Instamessages Wrapper");
}
