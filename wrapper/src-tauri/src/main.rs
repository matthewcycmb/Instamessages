// Instamessages Wrapper: a caged instagram.com for the two things the
// official API can never do — starting new conversations and group chats.
// Cage rules (decision Q3): DM inbox + login flows only. No feed, no
// reels, no explore, no profiles.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_deep_link::DeepLinkExt;

const HOME: &str = "https://www.instagram.com/direct/inbox/";

/// Runs at document-start on every page. Belt to the Rust suspenders:
/// anything on instagram.com outside the allowlist bounces to the inbox,
/// which also catches in-page SPA redirects (e.g. post-login "/").
const CAGE_SCRIPT: &str = r#"
(function () {
  var ok = /^\/(direct|accounts|challenge|two_factor|m\/|api|graphql|ajax)/;
  function enforce() {
    if (location.hostname.endsWith("instagram.com") && !ok.test(location.pathname)) {
      location.replace("/direct/inbox/");
    }
  }
  enforce();
  var push = history.pushState.bind(history);
  history.pushState = function () { push.apply(null, arguments); setTimeout(enforce, 0); };
  window.addEventListener("popstate", enforce);
})();
"#;

fn allowed(url: &Url) -> bool {
    matches!(
        url.host_str(),
        Some(
            "www.instagram.com"
                | "instagram.com"
                | "ig.me"
                | "accountscenter.instagram.com"
                | "static.cdninstagram.com"
        )
    )
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
            .on_navigation(|url| allowed(url))
            .build()?;

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
