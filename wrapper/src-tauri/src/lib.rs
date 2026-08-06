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
  // Top frame only. Instagram loads its verification/challenge UI in
  // same-host iframes; the cage running inside one window.stop()s and
  // route-bounces the challenge content, leaving an empty lock modal.
  // Everything the cage does is a top-frame concern, and the Swift bridge
  // already refuses subframes.
  try { if (window.self !== window.top) return; } catch (e) { return; }

  // The onboarding quiz's motive + weekly hours arrive in the URL fragment
  // (dist/index.html sets it at the login handoff; localStorage does not
  // cross the tauri -> instagram origin boundary). Persist into this origin
  // and strip the hash so it survives login, reloads, and relaunches.
  if ((location.hash || "").indexOf('#konvo=') === 0) {
    try { localStorage.konvoQuiz = location.hash.slice(7); } catch (e) {}
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }

  // First launch on a fresh install has no cache and no session, so
  // instagram.com takes 10-15s to paint and the window sits empty the whole
  // time. Warm launches are instant, but the cold one is the first thing a
  // new tester ever sees, and a blank window reads as a broken app. Show a
  // spinner until the page paints over it.
  (function boot() {
    // Once per app launch, never between screens. This overlay exists for
    // the cold start where instagram.com takes 10-15s to paint; showing it
    // again on an in-app navigation just reads as the app hanging.
    // sessionStorage dies with the webview session, so a relaunch shows it
    // again and a navigation does not.
    try {
      if (sessionStorage.konvoBooted) return;
      sessionStorage.konvoBooted = "1";
    } catch (e) {}
    // Konvo's whole funnel is the light design - the quiz, Instagram's
    // login, and the paywall all render while the app is pinned Light
    // (lib.rs). The paywall block below hands appearance to the phone only
    // once the wall is out of the way, so the first thing that ever renders
    // dark is the chat itself.
    var b = document.createElement("div");
    b.id = "im-boot";
    b.style.cssText = "position:fixed;inset:0;z-index:2147483646;" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center";
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
      "<div id='im-boot-w' style='position:absolute;bottom:56px;font:500 15px " +
        "-apple-system,system-ui,sans-serif;letter-spacing:-0.01em;opacity:.55'>" +
        "Konvo</div>";
    (document.body || document.documentElement).appendChild(b);
    // Painted as a function of the current scheme, and repainted if the
    // scheme flips while the overlay is up - which is exactly what the
    // appearance message above causes on a dark phone.
    function paintBoot() {
      var dark = !/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      b.style.background = dark ? '#000' : '#fff';
      var w = document.getElementById("im-boot-w");
      if (w) w.style.color = dark ? '#f5f5f7' : '#141d33';
    }
    paintBoot();
    if (window.matchMedia) {
      try {
        matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintBoot);
      } catch (e) {}
    }
    // Fade, never cut: Instagram's own launch dissolves into the app, and
    // a hard removal here read as a flicker between two screens.
    function clear() {
      var el = document.getElementById("im-boot");
      if (!el || el.dataset.going) return;
      el.dataset.going = "1";
      el.style.transition = "opacity .32s ease";
      el.style.opacity = "0";
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 340);
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
  // Instagram's mobile web lays out smaller than their native app. Telling
  // it the screen is narrower than it is makes every row, avatar and
  // bubble render larger once the browser scales that layout to the real
  // width - and because it is a real reflow, nothing overflows sideways.
  // Measured against the native app, screen by screen: its INBOX matches
  // Instagram's mobile web 1:1 (124 vs 125px avatars, identical row
  // pitch), but its THREADS run ~7% larger (574 vs 534px bubbles). One
  // global scale cannot serve both - and scaling everything is what blew
  // up post pages. So: threads only.
  // ponytail: THE sizing knob, per route.
  var THREAD_SCALE = 1.07;
  // CSS zoom, not a viewport meta rewrite: WebKit ignored the width change
  // after first layout (two builds rendered pixel-identical), and zoom is
  // the one that actually reflows - fewer CSS pixels across, everything
  // laid out larger, still no horizontal overflow.
  // The inbox title (your username + chevron) renders smaller and sits
  // further left than the native app's. No CSS selector for it survives
  // Instagram's class churn, so find it the way findMe() does - the
  // username-shaped leaf in the top strip - and style that element.
  // ponytail: measured 18% short of native; re-measure if their header
  // changes shape.
  // Runs ONCE per arrival at the inbox, never on the tick: this is a
  // whole-document scan plus getBoundingClientRect (forced layout), and on
  // an 800ms timer it was a guaranteed hitch while scrolling.
  var titleSized = false, titleEl = null, titleMo = null;
  function sizeInboxTitle() {
    if (titleSized || !atInbox()) return;
    titleSized = true;
    var els = document.querySelectorAll("span,h1,div");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.childElementCount || el.dataset.imTitle) continue;
      var t = (el.textContent || "").trim();
      if (!/^[A-Za-z0-9._]{2,30}$/.test(t)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.top < 0 || r.top > 120) continue;
      el.dataset.imTitle = "1";
      el.style.fontSize = "23px";
      el.style.fontWeight = "700";
      el.style.letterSpacing = "-0.02em";
      titleEl = el;
      // Watch the row it lives in: Instagram rebuilds this header when you
      // come back from a chat, and a rebuilt element carries none of our
      // styling, so the name flashed at its original size first.
      if (titleMo) titleMo.disconnect();
      var host = el.parentElement && el.parentElement.parentElement;
      if (host && window.MutationObserver) {
        titleMo = new MutationObserver(function () {
          if (titleEl && titleEl.isConnected) return;
          titleSized = false;
          sizeInboxTitle();
        });
        titleMo.observe(host, { childList: true, subtree: true });
      }
      return;
    }
  }

  function sizeViewport() {
    var want = /^\/direct\/t\//.test(location.pathname) ? String(THREAD_SCALE) : "";
    if (document.documentElement.style.zoom !== want) {
      document.documentElement.style.zoom = want;
    }
  }

  function enforce() {
    if (!location.hostname.endsWith("instagram.com")) return;
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) sizeViewport();
    if (blocked(location.pathname)) {
      try { window.stop(); } catch (e) {}
      location.replace("/direct/inbox/");
    }
    // Route flag so CSS can hide the inbox's back-to-feed arrow while
    // keeping the thread view's back-to-inbox arrow.
    var ib = atInbox();
    document.documentElement.classList.toggle("im-inbox", ib);
    // Tell the native side when the route crosses the inbox boundary: the
    // back-swipe keeps an inbox snapshot to reveal under the drag, because
    // Instagram takes ~300ms to render history.back() and the live page
    // mid-render is the glitch every naive swipe shows.
    var r = ib ? "inbox"
      : location.pathname.indexOf("/direct/t/") === 0 ? "thread" : "other";
    if (r !== lastRoute) {
      lastRoute = r;
      titleSized = false;
      if (r !== "inbox" && titleMo) { titleMo.disconnect(); titleMo = null; }
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        try {
          window.webkit.messageHandlers.konvoStore.postMessage(
            { cmd: "route", id: 0, productId: r });
        } catch (e) {}
        // Arriving at the inbox: report when it FINISHES rendering - DOM
        // mutations quiet for a beat, capped hard - so the back-swipe
        // holds its snapshot until the crossfade can land on a finished
        // inbox instead of a mid-render skeleton.
        if (r === "inbox" && window.MutationObserver) {
          try {
            if (settleMo) settleMo.disconnect();
            if (settleTick) clearInterval(settleTick);
            var last = Date.now(), t0 = last;
            settleMo = new MutationObserver(function () { last = Date.now(); });
            settleMo.observe(document.body || document.documentElement,
              { childList: true, subtree: true });
            var tick = settleTick = setInterval(function () {
              var now = Date.now();
              if (now - last > 180 || now - t0 > 2000) {
                clearInterval(tick);
                if (settleMo) { settleMo.disconnect(); settleMo = null; }
                sizeInboxTitle();
                try {
                  window.webkit.messageHandlers.konvoStore.postMessage(
                    { cmd: "route", id: 0, productId: r + "-settled" });
                  // The letterbox above and below the webview is native and
                  // CSS cannot reach it. Hand it the page's own background
                  // so the app reads as one surface instead of a page with
                  // black bars around it.
                  window.webkit.messageHandlers.konvoStore.postMessage(
                    { cmd: "bg", id: 0,
                      productId: getComputedStyle(document.body).backgroundColor });
                } catch (e) {}
              }
            }, 90);
          } catch (e) {}
        }
      }
    }
  }
  var lastRoute = null, settleMo = null, settleTick = null;
  // Every screen change gets the same push, wherever it goes - a DM, a
  // profile from a DM, a profile from search. pushState is Instagram's
  // forward navigation and popstate is a back; the native side owns the
  // animation, so this only has to say which way. Full page loads (not
  // SPA) fire neither and simply do not animate.
  // Search mode is a route the URL never changes for, so the class carries
  // it: focusing a search box unhides Instagram's own way back out.
  function keepSearchBack(input) {
    var box = input.getBoundingClientRect();
    var mid = box.top + box.height / 2;
    var arrows = document.querySelectorAll(
      "a:has(svg[aria-label='Back']),[role='button']:has(svg[aria-label='Back'])");
    for (var i = 0; i < arrows.length; i++) {
      // Same row as the field it belongs to. The header's escape arrow
      // sits a row above and stays hidden.
      var r = arrows[i].getBoundingClientRect();
      var same = Math.abs(r.top + r.height / 2 - mid) < box.height;
      arrows[i].classList.toggle("im-keep-back", same);
    }
  }
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    // Inbox only, and real inputs only: Instagram's message composer is a
    // role=textbox, so this used to fire on every tap into a chat and run
    // three document-wide :has() scans while the keyboard animated.
    if (!t || t.tagName !== "INPUT" || !atInbox()) return;
    // Instagram renders the search-mode back arrow a beat after focus, and
    // sometimes re-renders it again; one shot missed it.
    [60, 250, 600].forEach(function (ms) {
      setTimeout(function () { keepSearchBack(t); }, ms);
    });
  }, true);
  document.addEventListener("focusout", function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (a && a.tagName === "INPUT") return;
      var kept = document.querySelectorAll(".im-keep-back");
      for (var i = 0; i < kept.length; i++) kept[i].classList.remove("im-keep-back");
    }, 0);
  }, true);

  var isPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);

  // Which destinations are worth a slide: a conversation, and a person's
  // profile. Settings, Edit profile, activity, posts - those are places a
  // button opens, not screens you walk into, and animating everything made
  // the app feel like it was constantly sliding.
  // Trailing slash OPTIONAL: Instagram pushes a profile as "/name/" from
  // some controls and "/name" from others (measured on device), and
  // requiring the slash silently dropped half the profile taps into the
  // no-animation path.
  function worthSliding(p) {
    if (/^\/direct\/t\//.test(p)) return true;
    return /^\/[A-Za-z0-9._]+\/?$/.test(p) &&
      !/^\/(accounts|explore|direct|p|reel|reels|stories|about|legal|challenge|notifications)(\/|$)/
        .test(p);
  }
  // A tap on a back arrow always pops (right to left), whatever Instagram's
  // router calls it - their Message button replays as a back, and a back
  // arrow sometimes replays as a push.
  var lastBackTap = 0, ownButtonAt = 0;
  // The tap must land ON the arrow, not merely inside something that
  // contains one: Instagram's thread header puts the back arrow and the
  // friend's name in the same control, so a "contains" test counted
  // opening their profile as pressing back and slid the wrong way.
  document.addEventListener("click", function (e) {
    var svg = e.target.closest && e.target.closest("svg");
    if (svg && svg.getAttribute("aria-label") === "Back") {
      lastBackTap = Date.now();
    }
  }, true);
  function navFor(dir) {
    var p = location.pathname;
    // Konvo's own buttons: open, do not travel.
    if (Date.now() - ownButtonAt < 800) { ownButtonAt = 0; return "push-silent"; }
    if (Date.now() - lastBackTap < 800) { lastBackTap = 0; return "pop"; }
    // A conversation and a profile are both places you go INTO, whatever
    // Instagram's router replays them as - opening someone's profile from
    // the top of a chat came through as a back and slid the wrong way.
    if (/^\/direct\/t\//.test(p) || worthSliding(p)) return "push";
    return "push-silent";
  }

  var navSuppress = 0;
  function nav(dir) {
    if (!isPhone) return;
    // One tap, one animation: spaGo raises both events.
    if (navSuppress && Date.now() - navSuppress < 400) return;
    navSuppress = Date.now();
    try {
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: "nav", id: 0, productId: dir });
    } catch (e) {}
  }
  var push = history.pushState.bind(history);
  history.pushState = function () {
    push.apply(null, arguments);
    setTimeout(function () {
      // Opening a post is not a screen you walk into sideways - the photo
      // belongs to the profile behind it, so no slide. It still has to be
      // STACKED though: without a picture of the profile underneath it,
      // swiping back out of a post revealed whatever was one level deeper
      // and stuttered while the real page caught up.
      // enforce() FIRST: it sets the thread zoom, and changing the page
      // scale after the native slide has started makes the incoming screen
      // pop mid-animation.
      enforce();
      nav(navFor("push"));
    }, 0);
  };
  var replace = history.replaceState.bind(history);
  history.replaceState = function () { replace.apply(null, arguments); setTimeout(enforce, 0); };
  window.addEventListener("popstate", function () {
    // Direction follows what the user did, not what Instagram's router
    // did. Opening a conversation from a profile's Message button is a
    // step INTO something even though their router replays it as a back,
    // and animating that leftwards feels like the app went backwards.
    enforce();
    setTimeout(function () { nav(navFor("pop")); }, 0);
  });
  document.addEventListener("DOMContentLoaded", enforce);
  setInterval(enforce, 800); // SPA belt-and-braces: some route changes skip history APIs

  // The native app's little tap when a message sends. The selector is a
  // guess at Instagram's send control, patchable as sendSel in the
  // cage-patch; a miss costs the buzz and nothing else.
  var SEND_SEL = "div[role=button][aria-label*='Send' i],button[aria-label*='Send' i]";
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(SEND_SEL);
      if (!t) return;
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "haptic", id: 0, productId: "" });
      } catch (err) {}
    }, true);
  }

  // Remote hotfix channel - config, NOT code. Instagram ships DOM changes on
  // its schedule and App Review takes days; a static JSON on konvoinstall.com
  // closes that gap: extra hide-selectors, extra CSS, extra bounce patterns,
  // live one git push after Meta breaks something. Strictly additive - the
  // baseline cage in this binary always applies - and remote JS is
  // deliberately NOT supported: selectors and regexes are data, downloadable
  // code is an App Review 2.5.2 rejection. Last good patch is cached so an
  // offline launch keeps yesterday's fix; a failed fetch changes nothing.
  function applyPatch(p) {
    if (!p) return;
    try {
      var extra = "";
      if (p.hide && p.hide.length) extra += p.hide.join(",") + "{display:none !important;}";
      if (p.css) extra += p.css;
      if (extra) {
        var st = document.createElement("style");
        st.textContent = extra;
        (document.head || document.documentElement).appendChild(st);
      }
      (p.block || []).forEach(function (s) { FEED.push(new RegExp(s)); });
      // {"superwall": true} switches the paywall from the injected wall to
      // the native Superwall placement (KonvoStore). Off until campaigns
      // exist in the Superwall dashboard; flipping it back off is the
      // kill switch if a remote paywall misbehaves.
      if (p.superwall) window.__konvoSW = true;
      // {"betaFree": false} withdraws the free-during-beta button
      // from tester builds without shipping anything.
      if (p.betaFree === false) window.__konvoNoFree = true;
      if (p.sendSel) SEND_SEL = p.sendSel;
      enforce();
    } catch (e) {}
  }
  try { applyPatch(JSON.parse(localStorage.konvoPatch || "null")); } catch (e) {}
  fetch("https://konvoinstall.com/cage-patch.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (p) {
      if (!p) return;
      try { localStorage.konvoPatch = JSON.stringify(p); } catch (e) {}
      applyPatch(p);
    })
    .catch(function () {});

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
    // The inbox back arrow escapes to the feed, so it goes. Search mode
    // renders a SECOND, identical-looking arrow beside the search field
    // which is the way out of search; the focus handler tags that one
    // .im-keep-back by its row, and only it survives.
    'html.im-inbox a:has(svg[aria-label="Back"]):not(.im-keep-back)',
    'html.im-inbox div[role="button"]:has(svg[aria-label="Back"]):not(.im-keep-back)',
    'html.im-inbox [role="button"]:has(svg[aria-label="Back"]):not(.im-keep-back)',
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
    // The rule that made every avatar inert is GONE: it dated from when
    // profiles were unreachable, and profiles are a deliberate doorway now.
    // It was also killing taps on the notes tray, which is built out of
    // avatars - so liking a friend's note did nothing.
    // Two lines that stop the app reading as a web page: the grey flash
    // WebKit paints under every tap is the loudest browser tell there is,
    // and manipulation drops the wait-for-double-tap-zoom delay so taps
    // land immediately. Pinch zoom on photos still works.
    "*{-webkit-tap-highlight-color:transparent}" +
    "html{touch-action:manipulation}" +
    // No browser callout menus on app chrome: long-pressing an avatar or
    // a button in a native app does not offer Save Image or Copy Link.
    // Message TEXT is deliberately untouched - codes and addresses have to
    // stay selectable.
    "img,svg,[role='button'],[role='link'],a{-webkit-touch-callout:none}" +
    "svg,[role='button']{-webkit-user-select:none}";
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
      'html.im-inbox #im-heart{display:flex}' +
      '#im-me{display:none;position:fixed;right:16px;bottom:80px;width:44px;height:44px;' +
      'border-radius:50%;background:rgba(38,38,38,.92);color:#f5f5f7;z-index:2147483000;' +
      'align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
      'html.im-inbox #im-me{display:flex}';
    // Our buttons are plain anchors, and an anchor is a FULL PAGE LOAD:
    // Instagram's entire bundle again, seconds of waiting, and the trip
    // back reloads whatever you came from. Instagram's own links go
    // through its router instead, so hand the tap to a matching link of
    // theirs when the page has one; the anchor href stays as the fallback.
    // Drive Instagram's own router instead of following the link: an
    // anchor is a full page load - their entire bundle again, seconds of
    // waiting, and the trip back reloads whatever you came from. A
    // pushState plus a popstate makes their SPA render the route in place
    // (measured on device: /accounts/activity/ came back as a rendered
    // /notifications/ in ~1s with no reload).
    // ponytail: if a route ever ignores the event the URL changes with
    // nothing drawn, so a real navigation follows half a second later.
    function spaGo(href, e) {
      e.preventDefault();
      ownButtonAt = Date.now();
      var before = document.body ? document.body.innerText.slice(0, 80) : "";
      history.pushState({}, "", href);
      dispatchEvent(new PopStateEvent("popstate", { state: {} }));
      setTimeout(function () {
        var now = document.body ? document.body.innerText.slice(0, 80) : "";
        if (now === before) location.assign(href);
      }, 500);
    }
    var heart = document.createElement("a");
    heart.id = "im-heart";
    // /notifications/ is the phone route; /accounts/activity/ is desktop.
    heart.href = /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? "/notifications/" : "/accounts/activity/";
    heart.setAttribute("aria-label", "Notifications");
    heart.addEventListener("click", function (e) { spaGo(heart.href, e); });
    heart.innerHTML =
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
      " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0" +
      "-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg>";
    (document.body || document.documentElement).appendChild(heart);

    // Your own profile, the one doorway the cage never offered. Instagram
    // needs the username in the path and the session endpoint that used to
    // supply it answers 400 to this webview, so read it off the inbox
    // header's account switcher and remember it. Unknown username falls
    // back to Edit profile, which needs no username at all.
    // ponytail: a text-shaped guess at the header; corrections ride the
    // cage-patch, and the fallback is always a real destination.
    function findMe() {
      try { if (localStorage.konvoMe) return localStorage.konvoMe; } catch (e) {}
      // Instagram's mobile inbox header is not a <header>, so go by
      // position instead of tag: the account switcher is the only
      // username-shaped leaf in the top strip of the page. Runs on tap,
      // never on a frame, and the answer is cached for good.
      var els = document.querySelectorAll("span,div,h1");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.childElementCount) continue;
        var t = (el.textContent || "").trim();
        if (!/^[A-Za-z0-9._]{2,30}$/.test(t)) continue;
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.top < 0 || r.top > 130) continue;
        try { localStorage.konvoMe = t; } catch (e) {}
        return t;
      }
      return "";
    }
    var me = document.createElement("a");
    me.id = "im-me";
    me.href = "/accounts/edit/";
    me.setAttribute("aria-label", "Your profile");
    me.innerHTML =
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
      " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/>" +
      "<circle cx='12' cy='7' r='4'/></svg>";
    me.addEventListener("click", function (e) {
      var u = findMe();
      me.href = u ? "/" + u + "/" : "/accounts/edit/";
      spaGo(me.href, e);
    });
    (document.body || document.documentElement).appendChild(me);
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
    // Inbox-only: the Requests tab exists nowhere else, and this scan reads
    // textContent off every leaf - the most expensive thing the cage does.
    if (!atInbox()) return;
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
    // Start from the handful of profile-picture images, not from every
    // anchor on the page: same result, ~50x fewer nodes walked.
    var pics = document.querySelectorAll("img[alt$='profile picture']");
    for (var i = 0; i < pics.length; i++) {
      var a = pics[i].closest("a[href]");
      if (a && !a.closest("main")) a.style.display = "none";
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
    // iPhone: the in-app Safari sheet, like Instagram's own browser -
    // swipe it away and the chat is still underneath. The Mac has no
    // sheet and no konvoStore handler; it keeps the real browser.
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "open", id: 0, productId: url });
        return;
      } catch (e) {}
    }
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
  // Answered ONCE per gesture, at touchstart, and reused for every move in
  // that drag. It used to run per move event - a querySelectorAll plus a
  // getBoundingClientRect per video, sixty times a second, on every scroll
  // in the app - which is the most expensive thing a finger could trigger.
  var reeling = false, reelKnown = false;
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
  // pointermove is gone on purpose: iOS fires it alongside touchmove, so
  // it doubled the work for nothing.
  document.addEventListener("touchstart", function () {
    reeling = watchingReel();
    reelKnown = true;
  }, { capture: true, passive: true });
  document.addEventListener("touchend", function () {
    reelKnown = false;
  }, { capture: true, passive: true });
  ["wheel", "touchmove"].forEach(function (t) {
    document.addEventListener(t, function (e) {
      // A real drag always opens with touchstart, so the answer is already
      // cached; anything arriving without one (wheel, synthetic events)
      // still gets the real check rather than a stale false.
      if (!(t === "touchmove" && reelKnown ? reeling : watchingReel())) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
  document.addEventListener("keydown", function (e) {
    // Key test FIRST: watchingReel() forces layout, and this fires on
    // every character typed into a message.
    if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End)$/.test(e.key) && watchingReel()) {
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
      try {
        if (localStorage.getItem("konvoPaid")) return true;
        // Granted by a beta build and NEVER touched by the entitlement
        // sync below, which legitimately reports "not entitled" and would
        // otherwise replay the whole paywall sequence on every launch.
        return !!(window.__konvoBeta && !window.__konvoNoFree &&
          localStorage.getItem("konvoBetaFree"));
      } catch (e) { return false; }
    }
    function grantBeta() {
      try { localStorage.setItem("konvoBetaFree", "1"); } catch (e) {}
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

    // ---- v3 paywall (grilled Aug 3): S12 connected -> S12b loader -> perks
    // -> S13 three-package paywall (annual/monthly/lifetime) -> S14
    // activation. There is no dismissal unpaid: the x concedes into the
    // Monthly story. Money truth lives in RevenueCat behind the bridge.
    // Every visible word is Matthew's - do not edit copy here.
    //
    // Message text weight only. SIZE is handled natively by page zoom in
    // KonvoStore (mobile web renders smaller than the native app across
    // the board - bubbles, avatars, rows - and zoom scales all of it
    // together instead of one guessed selector at a time).
    style.textContent +=
      "div[role='row'] div[dir='auto']{font-weight:500;}";
    // Friends' stories are kept, and the inbox story rings are the only way
    // in - three testers asked for a feature that was already there. Louder
    // rings, no new UI: Instagram draws them as a canvas behind the avatar.
    // ponytail: a selector guess like the rest; corrections ride cage-patch.
    // Scoped to the inbox route: an unscoped div:has(...) makes the engine
    // test every div in the document on every DOM change.
    // Scale only, no filter: a filter on every ring is a repaint through
    // the filter pipeline on each frame of an inbox scroll, and scrolling
    // is exactly where "less smooth than Instagram" gets noticed.
    // Plain selector, no :has(): the subject there was bare `div`, so the
    // engine re-tested every div in the document on each mutation. The
    // only canvases on the inbox ARE the story rings.
    style.textContent += "html.im-inbox canvas{transform:scale(1.06)}";
    style.textContent +=
      '#im-pay{--bg:#fff;--ink:#141d33;--mut:#5d6478;--line:#d9d9de;' +
      '--chip:#f2f2f4;--icbg:#eef3ff;--accent:#0a5cf0}' +
      '#im-pay{position:fixed;inset:0;z-index:2147483645;background:var(--bg);color:var(--ink);' +
      'display:flex;flex-direction:column;font-family:-apple-system,system-ui,sans-serif;' +
      '-webkit-font-smoothing:antialiased}' +
      '#im-pay .imp-page{flex:1;display:flex;flex-direction:column;min-height:0;' +
      'animation:im-payfade .45s ease}' +
      '@keyframes im-payfade{from{opacity:0}}' +
      '#im-pay h2{margin:0;font-weight:700;letter-spacing:-0.035em;line-height:1.2}' +
      '#im-pay p{margin:0}' +
      '#im-pay .imp-mid{flex:1;display:flex;flex-direction:column;justify-content:center;' +
      'padding:0 24px;overflow-y:auto;overscroll-behavior:none}' +
      '#im-pay .imp-foot{flex:none;padding:0 20px 34px}' +
      '#im-pay .imp-btn{width:100%;min-height:54px;border:0;border-radius:13px;' +
      'background:var(--accent);color:#fff;font-family:inherit;font-size:17px;font-weight:600;' +
      'letter-spacing:-0.012em;box-shadow:0 8px 18px rgba(10,92,240,.24)}' +
      '#im-pay .imp-btn[disabled]{opacity:.5}' +
      '#im-pay .imp-ghost{text-align:center;font-size:15px;color:var(--mut);padding:16px 0 2px}' +
      '#im-pay .imp-links{display:flex;justify-content:center;gap:18px;margin-top:10px;' +
      'font-size:13.5px;color:var(--mut)}' +
      '#im-pay .imp-links span{text-decoration:underline}' +
      '#im-pay .imp-row{display:flex;align-items:center;gap:12px;font-size:17px;' +
      'opacity:.35;transition:opacity .5s ease}' +
      '#im-pay .imp-row.done{opacity:1}' +
      '#im-pay .imp-ck{width:20px;height:20px;flex:none;border-radius:50%;' +
      'background:rgba(20,29,51,.1);display:inline-flex;align-items:center;' +
      'justify-content:center}' +
      '#im-pay .imp-row.done .imp-ck{background:var(--accent)}' +
      '#im-pay .imp-row .imp-ck svg{display:none}' +
      '#im-pay .imp-row.done .imp-ck svg{display:block}' +
      '#im-pay .imp-spin{width:20px;height:20px;border:2px solid var(--line);' +
      'border-top-color:var(--accent);border-radius:50%;' +
      'animation:im-spin .8s linear infinite}' +
      '#im-pay .imp-head{flex:none;height:130px;position:relative;' +
      'background:linear-gradient(180deg,#1a6bf2 0%,#0a5cf0 100%)}' +
      '@keyframes im-pop{from{transform:scale(.4);opacity:0}}' +
      '#im-pay .imp-pk{flex:1;border-radius:14px;box-shadow:inset 0 0 0 1.2px var(--line);' +
      'padding:13px 6px 11px;text-align:center;position:relative}' +
      '#im-pay .imp-pk.on{box-shadow:inset 0 0 0 2px var(--accent);background:#f6f9ff}' +
      '#im-pay .imp-pk b{display:block;font-size:13.5px;letter-spacing:-0.01em}' +
      '#im-pay .imp-pk i{display:block;font-style:normal;font-size:15px;font-weight:700;' +
      'margin-top:4px}' +
      '#im-pay .imp-pk u{display:block;text-decoration:none;font-size:10.5px;' +
      'color:var(--mut);margin-top:3px;line-height:1.3}' +
      '#im-pay .imp-rec{position:absolute;top:-9px;left:50%;transform:translateX(-50%);' +
      'white-space:nowrap;background:var(--accent);color:#fff;font-size:9px;' +
      'font-weight:700;letter-spacing:0.05em;padding:3px 8px;border-radius:999px}' +
      '#im-pay .imp-tl{display:flex;gap:16px}' +
      '#im-pay .imp-tl h4{margin:0;font-size:17px;font-weight:700}' +
      '#im-pay .imp-tl p{font-size:15px;line-height:1.45;color:var(--mut);margin-top:4px}' +
      '#im-pay .imp-tl p b{color:var(--ink);font-weight:600}' +
      '#im-pay .imp-dot{flex:none;width:44px;display:flex;flex-direction:column;' +
      'align-items:center}' +
      '#im-pay .imp-dot i{flex:none;width:44px;height:44px;border-radius:50%;' +
      'background:var(--accent);display:inline-flex;align-items:center;' +
      'justify-content:center}' +
      '#im-pay .imp-stem{flex:1;width:8px;border-radius:999px;' +
      'background:rgba(10,92,240,.15);margin-top:0}';

    // Funnel events, fire-and-forget through the bridge (Instagram's CSP
    // blocks page-side analytics). Lean payloads by decision: names and
    // screen ids only. Silent no-op without the bridge (tests, Mac).
    function track(event, props) {
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "track", id: 0, event: event, props: props || {} });
      } catch (e) {}
    }

    var CHECK =
      "<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20 6 9 17l-5-5'/></svg>";
    function loaderRow(label) {
      return "<div class='imp-row'><span class='imp-ck'>" + CHECK + "</span>" +
        "<span>" + label + "</span></div>";
    }
    var PAGES = {
      connected:
        "<div class='imp-mid' style='align-items:center;text-align:center'>" +
        "<span style='width:56px;height:56px;border-radius:50%;background:var(--icbg);" +
        "display:inline-flex;align-items:center;justify-content:center;color:var(--accent);" +
        "margin-bottom:24px;animation:im-pop .7s cubic-bezier(0.34,1.56,0.64,1) both'>" +
        "<svg width='26' height='26' viewBox='0 0 24 24' fill='none'" +
        " stroke='currentColor' stroke-width='2.4' stroke-linecap='round'" +
        " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg></span>" +
        "<h2 style='font-size:28px'>Instagram connected.</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:12px'>" +
        "Your DMs and Stories are ready.</p></div>"
    };

    // Being at /direct/inbox/ is not proof of a session: Instagram renders
    // that route for a beat before bouncing a signed-out visitor to the
    // login page, and a wall raised in that window is a trap - login looks
    // skipped, the user pays, and dismissing reveals no messages. Proof is
    // the ds_user_id cookie: set at login, cleared at logout, readable from
    // this origin (verified on device). The current_user endpoint cannot
    // gate here - it answers 400 "useragent mismatch" to this webview's UA
    // with every app id, desktop, mobile, or none (measured Aug 3, 2026) -
    // so the loader greeting goes without a username until a reliable
    // source shows up; igUser stays for that day.
    // ponytail: a session revoked server-side leaves the cookie behind and
    // the wall could rise over a dying page; Instagram bounces it to login
    // moments later and the flow recovers there.
    var igUser = "", authed = false;
    function checkAuth() {
      if (/(?:^|; )ds_user_id=\d/.test(document.cookie)) authed = true;
    }
    function loaderPage() {
      return "<div class='imp-mid' style='padding:0 24px'>" +
        "<span class='imp-spin'></span>" +
        "<h2 style='font-size:26px;margin:24px 0 26px'>Setting up your Konvo" +
        (igUser ? ", " + igUser : "") + "</h2>" +
        "<div style='display:flex;flex-direction:column;gap:14px'>" +
        loaderRow("Feed hidden") + loaderRow("Reels hidden") +
        loaderRow("Explore hidden") + loaderRow("Messages kept") +
        loaderRow("Friends' stories kept") + "</div></div>";
    }

    // The perks comparison, between the loader and the paywall: five rows,
    // Konvo's column all check, without it all cross. Every row is a true
    // structural claim, not marketing.
    var XMARK =
      "<svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='#c2c8d2'" +
      " stroke-width='2.8' stroke-linecap='round'>" +
      "<path d='M18 6 6 18'/><path d='m6 6 12 12'/></svg>";
    // The comparison table: label | without | Konvo, the Konvo column a
    // continuous tinted strip so the eye reads it as one plan. Row one is
    // checked on BOTH sides on purpose - Instagram does give you DMs and
    // Stories; the difference is everything else.
    var CKBLUE = "<span style='width:22px;height:22px;border-radius:50%;" +
      "background:var(--accent);display:inline-flex;align-items:center;" +
      "justify-content:center'>" + CHECK + "</span>";
    var CKGREY = "<span style='width:22px;height:22px;border-radius:50%;" +
      "background:#dfe3ea;display:inline-flex;align-items:center;" +
      "justify-content:center'><svg width='11' height='11' viewBox='0 0 24 24'" +
      " fill='none' stroke='#8a92a2' stroke-width='3.4' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg></span>";
    function perkRow(label, free, last) {
      return "<div style='display:flex;align-items:stretch;border-top:1px solid #eeeef1'>" +
        "<span style='flex:1;display:flex;align-items:center;padding:12px 8px 12px 0;" +
        "font-size:15px;line-height:1.3'>" + label + "</span>" +
        "<span style='width:74px;flex:none;display:flex;align-items:center;" +
        "justify-content:center'>" + (free ? CKGREY : XMARK) + "</span>" +
        "<span style='width:74px;flex:none;display:flex;align-items:center;" +
        "justify-content:center;background:#eef3ff" +
        (last ? ";border-radius:0 0 12px 12px" : "") + "'>" + CKBLUE + "</span></div>";
    }
    function perksPage() {
      return "<div class='imp-mid' style='padding:24px 20px'>" +
        "<h2 style='font-size:26px'>Why this one works</h2>" +
        "<div style='display:flex;align-items:flex-end;margin-top:28px'>" +
        "<span style='flex:1;font-size:13px;font-weight:600;color:var(--mut)'>" +
        "What you get</span>" +
        "<span style='width:74px;flex:none;text-align:center;font-size:10.5px;" +
        "font-weight:700;letter-spacing:0.03em;white-space:nowrap;" +
        "color:var(--mut);padding-bottom:10px'>LIMIT APPS</span>" +
        "<span style='width:74px;flex:none;display:flex;justify-content:center;" +
        "padding:9px 0;background:#eef3ff;border-radius:12px 12px 0 0'>" +
        "<span style='background:var(--accent);color:#fff;font-size:10px;" +
        "font-weight:700;letter-spacing:0.06em;padding:4px 9px;border-radius:999px'>" +
        "KONVO</span></span></div>" +
        perkRow("Feed and Reels are gone, not blocked", false, false) +
        perkRow("No limit to snooze or switch off", false, false) +
        perkRow("Instagram comes off your phone", false, false) +
        perkRow("Going back takes a decision", false, false) +
        perkRow("Full DMs, Stories and notifications", false, true) +
        "</div>" +
        "<div class='imp-foot' style='padding:14px 24px 30px'>" +
        "<div style='display:flex;align-items:center;justify-content:center;gap:8px;" +
        "padding-bottom:12px;font-size:14px;color:var(--mut)'>" +
        "<span style='width:18px;height:18px;border-radius:50%;background:var(--accent);" +
        "display:inline-flex;align-items:center;justify-content:center'>" + CHECK +
        "</span>No commitment. Cancel anytime.</div>" +
        "<button class='imp-btn' data-act='goodbye'>Continue</button></div>";
    }

    // TODO: RELEASE BLOCKER - PROOF must stay empty until real TestFlight
    // quotes exist (locked rule: no invented social proof). Fill with
    // entries like { q: "[TESTIMONIAL_1 - replace with real TestFlight " +
    // "quote]", name: "[FIRST NAME]" }. Quotes only - no stars, because no
    // rating exists to depict. The strip and the dist screen both collapse
    // to nothing while this is empty.
    var PROOF = [];
    function proofStrip() {
      if (!PROOF.length) return "";
      var t = PROOF[0];
      return "<div style='margin:0 0 14px;padding:11px 14px;border-radius:12px;" +
        "background:var(--chip);font-size:14px;line-height:1.45;color:var(--ink);" +
        "text-align:center'>&ldquo;" + t.q + "&rdquo;" +
        "<span style='color:var(--mut)'> &mdash; " + t.name + "</span></div>";
    }

    // Live localized RevenueCat values (locked decision: never hardcode
    // money in shipping paths). These stand-ins render only when the bridge
    // is absent (tests, builds without the Swift class).
    var FALLBACK = { yearly: { price: '$29.99', perWeek: '$0.58',
                               perMonth: '$2.50', savePct: 50, trialDays: 14 },
                     monthly: { price: '$4.99' },
                     lifetime: { price: '$79.99' } };
    var P = null;
    function prod() {
      return P && P.yearly && P.monthly && P.lifetime ? P : FALLBACK;
    }

    // The S2 motive + computed weekly hours, carried across origins in the
    // #konvo= fragment persisted at document-start above. Missing or
    // malformed: the paywall simply omits the line.
    function motiveLine() {
      var q;
      try { q = (localStorage.getItem("konvoQuiz") || "").split("."); }
      catch (e) { return ""; }
      var MAP = {
        schoolOrWork: "for school or work",
        ownProjects: "for projects you care about",
        presentWithPeople: "with friends and family",
        sleepOnTime: "to wind down and sleep on time",
        lessDistracted: "without getting pulled into Instagram"
      };
      if (!MAP[q[0]] || !(+q[1] > 0)) return "";
      return "About " + q[1] + (+q[1] === 1 ? " hour" : " hours") +
        " a week " + MAP[q[0]] + ".";
    }

    var LOCK = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<rect x='4' y='10.5' width='16' height='10.5' rx='3'/>" +
      "<path d='M8.5 10.5V8a3.5 3.5 0 0 1 7 0'/></svg>";
    var GLASS = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M6 3h12M6 21h12M8 3v3l4 4 4-4V3M8 21v-3l4-4 4 4v3'/></svg>";
    var BELL = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M18 8.5a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7'/>" +
      "<path d='M10.4 20.5a2 2 0 0 0 3.2 0'/></svg>";
    var STAR = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='m12 3 2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.9l1.2-6.5-4.8-4.6 " +
      "6.6-.9Z'/></svg>";
    function node(icon, title, body, stem) {
      return "<div class='imp-tl'><div class='imp-dot'><i>" + icon + "</i>" +
        (stem ? "<span class='imp-stem'></span>" : "") +
        "</div><div style='padding:4px 0 " + (stem ? "13px" : "0") + "'>" +
        "<h4>" + title + "</h4><p>" + body + "</p></div></div>";
    }
    function dateIn(days) {
      var d = new Date(Date.now() + days * 86400000);
      try {
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      } catch (e) { return ""; }
    }
    function pkCard(act, on, badge, name, price, sub) {
      return "<div class='imp-pk" + (on ? " on" : "") + "' data-act='" + act + "'>" +
        (badge ? "<span class='imp-rec'>" + badge + "</span>" : "") +
        "<b>" + name + "</b><i>" + price + "</i><u>" + sub + "</u></div>";
    }
    // S13. plan: 'y' | 'm' | 'l'. The Annual state renders the trial only
    // when RevenueCat says this user is eligible - the timeline never
    // describes a trial that will not happen. Lifetime is a one-time
    // purchase: one-step story, "Lifetime access", never "forever".
    function pay(plan) {
      var pr = prod(), y = pr.yearly, m = pr.monthly, l = pr.lifetime;
      var td = plan === "y" ? (y.trialDays || 0) : 0;
      var sp = y.savePct || 0;
      var head, cta, act, tl, reassure;
      if (plan === "m") {
        head = m.price + " a month, cancel anytime.";
        cta = "Continue with Monthly";
        act = "buy-m";
        reassure = "No commitment, cancel anytime";
        tl = node(LOCK, "Today", "Unlock your DMs and Stories in Konvo. Pay " +
               m.price + ".", true) +
             node(STAR, "Every month", "Renews at " + m.price +
               ", <b>cancel anytime</b>.", false);
      } else if (plan === "l") {
        head = l.price + " once. Lifetime access.";
        cta = "Get Lifetime access";
        act = "buy-l";
        reassure = "Pay once. No subscription.";
        tl = node(LOCK, "Today", "Pay " + l.price + " once. That's it.", false);
      } else if (td) {
        head = "First " + td + " days free, then " + y.price + " a year.";
        // ponytail: literal dollars; localize the zero through Swift if
        // non-USD storefronts ever matter.
        cta = "Try for $0.00";
        act = "buy-y";
        reassure = "No commitment, cancel anytime";
        // Three nodes, not four: the page must fit one screen. The reminder
        // promise rides the halfway node, which stays honest - it says we
        // will remind you, not that the reminder lands that day (it fires
        // two days before the charge; see the notify command).
        tl = node(LOCK, "Today", "Unlock your DMs and Stories in Konvo. Pay $0.", true) +
             node(BELL, "In " + Math.round(td / 2) + " days",
               "Halfway through. We'll remind you before anything is " +
               "charged.", true) +
             node(STAR, "In " + td + " days", "You'll be charged on <b>" +
               dateIn(td) + "</b>, <b>cancel anytime</b> before.", false);
      } else {
        head = y.price + " a year (" + (y.perMonth || y.perWeek) + "/month).";
        cta = "Continue with Annual";
        act = "buy-y";
        reassure = "No commitment, cancel anytime";
        tl = node(LOCK, "Today", "Unlock your DMs and Stories in Konvo.", true) +
             node(STAR, "In 12 months", "Renews at " + y.price +
               ", <b>cancel anytime</b> before.", false);
      }
      var mot = motiveLine();
      return "<div class='imp-head'>" +
        "<div style='position:absolute;inset:0;background:radial-gradient(circle at 50% 30%," +
        "rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 60%)'></div>" +
        "<button data-act='notready' aria-label='Close' style='position:absolute;top:10px;" +
        "right:10px;background:none;border:0;padding:8px;color:#fff;opacity:.9;z-index:2'>" +
        "<svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='2.8' stroke-linecap='round'><path d='M18 6 6 18'/>" +
        "<path d='m6 6 12 12'/></svg></button>" +
        "<div style='position:absolute;left:34px;top:26px;width:74px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.16);transform:rotate(-8deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.55)'>FEED</div>" +
        "<div style='position:absolute;right:30px;top:64px;width:62px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.14);transform:rotate(7deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.5)'>REELS</div>" +
        "<div style='position:absolute;left:50%;top:33px;transform:translateX(-50%);" +
        "width:64px;height:64px;border-radius:18px;background:#fff;display:flex;" +
        "align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(4,30,80,.35)'>" +
        "<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0'" +
        " stroke-width='2.2' stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 " +
        "0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/>" +
        "</svg></div></div>" +
        "<div class='imp-mid' style='justify-content:flex-start;padding:18px 24px 0'>" +
        "<div style='text-align:center'>" +
        "<h2 style='font-size:24px'>" +
        (td ? "How your free trial works" : "How your plan works") + "</h2>" +
        "<p style='font-size:15px;color:var(--mut);margin-top:8px'>" + head + "</p>" +
        (mot ? "<p style='font-size:14px;font-weight:600;color:var(--accent);" +
          "margin-top:8px'>" + mot + "</p>" : "") + "</div>" +
        proofStrip() +
        "<div style='display:flex;gap:8px;margin:16px 0 16px'>" +
        // The card prices annual by the month - the number a shopper
        // compares against the monthly plan. The full yearly charge is
        // stated in the line above and in the timeline. The unit label
        // follows whichever number actually rendered: pairing the yearly
        // price with "per month" would be a straight lie.
        pkCard("pk-y", plan === "y", "RECOMMENDED", "Annual",
          y.perMonth || y.price,
          (y.perMonth ? "per month" : "per year") +
          (sp ? " &middot; SAVE " + sp + "%" : "")) +
        pkCard("pk-m", plan === "m", "", "Monthly", m.price, "per month") +
        pkCard("pk-l", plan === "l", "", "Lifetime", l.price, "Pay once, keep it") +
        "</div>" +
        (notReady ? "<div style='margin:0 0 14px;padding:11px 14px;border-radius:12px;" +
          "background:var(--chip);font-size:14px;line-height:1.4;color:var(--mut);" +
          "text-align:center'>Not ready to commit for a year? Monthly is " + m.price +
          ", cancel anytime.</div>" : "") +
        tl + "</div>" +
        "<div class='imp-foot' style='padding:10px 24px 24px'>" +
        "<div style='display:flex;align-items:center;justify-content:center;gap:8px;" +
        "padding-bottom:10px;font-size:14px;color:var(--mut)'>" +
        "<span style='width:18px;height:18px;border-radius:50%;background:var(--accent);" +
        "display:inline-flex;align-items:center;justify-content:center'>" + CHECK +
        "</span>" + reassure + "</div>" +
        "<button class='imp-btn' data-act='" + act + "'>" + cta + "</button>" +
        // Restore lives in the footer row: the four-node trial timeline
        // pushed a centered one below the fold, and App Review needs it
        // findable without scrolling.
        betaFreeRow() +
        "<div class='imp-links'><span data-act='terms'>Terms of Use</span>" +
        "<span data-act='privacy'>Privacy Policy</span>" +
        "<span data-act='restore'>Restore</span></div></div>";
    }

    // Beta testers see the real price and the real screen, then take this
    // way past it. Present only in builds compiled with konvo-beta, and
    // withdrawable remotely; a store build has neither the markup nor the
    // handler.
    function betaFreeRow() {
      if (!window.__konvoBeta || window.__konvoNoFree) return "";
      return "<div class='imp-ghost' data-act='betafree' " +
        "style='padding-top:14px;font-weight:600;color:var(--accent)'>" +
        "Free during beta</div>";
    }

    // S12c: delete Instagram. Konvo does not sit alongside Instagram, it
    // takes its place - and a phone with both installed just relapses to the
    // feed. Instructions only: no app can delete another, and pretending
    // otherwise would be a button that lies.
    function goodbyePage() {
      return "<div class='imp-mid' style='padding:24px 24px;text-align:center'>" +
        "<span style='width:78px;height:78px;border-radius:20px;align-self:center;" +
        "background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);display:inline-flex;" +
        "align-items:center;justify-content:center;position:relative;" +
        "box-shadow:0 12px 30px rgba(180,40,80,.28)'>" +
        "<svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='#fff' " +
        "stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='5.5'/>" +
        "<circle cx='12' cy='12' r='4'/>" +
        "<circle cx='17.2' cy='6.8' r='1.1' fill='#fff' stroke='none'/></svg>" +
        "<span style='position:absolute;top:-7px;right:-7px;width:28px;height:28px;" +
        "border-radius:50%;background:#ff3b30;border:3px solid var(--bg);" +
        "display:inline-flex;align-items:center;justify-content:center'>" +
        "<span style='width:12px;height:2.5px;background:#fff;border-radius:2px'>" +
        "</span></span></span>" +
        "<h2 style='font-size:28px;margin-top:28px'>Delete Instagram</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:12px'>" +
        "Konvo is where your messages live now. Leave Instagram on your phone " +
        "and you will open it.</p>" +
        "<p style='font-size:15px;line-height:1.5;color:var(--mut);margin-top:18px'>" +
        "Your account does not change. Reinstall whenever you want.</p>" +
        "</div><div class='imp-foot'>" +
        "<button class='imp-btn' data-act='pay'>I deleted it</button>" +
        "<div class='imp-ghost' data-act='pay'>Not yet</div></div>";
    }

    // S14: post-purchase activation. Trial buyers get the recap and the
    // notification ask (permission requested only on the button tap, and
    // the day-12 reminder is scheduled only on grant). Lifetime gets its
    // own line and no ask - there is nothing to remind about.
    function successPage(pid) {
      var pr = prod(), td = pr.yearly.trialDays || 0;
      var trial = pid === "konvo.pro.yearly" && td;
      var recap = "";
      if (pid === "konvo.pro.lifetime") recap = "Lifetime access active.";
      else if (trial) recap = "Free until " + dateIn(td) + ".";
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        "<svg width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'" +
        " style='margin-bottom:34px;color:var(--accent)'><path d='M20 6 9 17l-5-5'/></svg>" +
        "<div style='font-size:44px;font-weight:700;letter-spacing:-0.05em;line-height:1;" +
        "text-align:center'>You're in.</div>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:16px;" +
        "text-align:center'>Your DMs and Stories are ready. Feed, Reels, " +
        "Explore: gone.</p>" +
        (recap ? "<p style='font-size:15px;font-weight:600;margin-top:14px;" +
          "text-align:center'>" + recap + "</p>" : "") +
        (trial ? "<div id='imp-notif' style='margin-top:30px;text-align:center'>" +
          "<p style='font-size:14px;line-height:1.5;color:var(--mut)'>Turn on " +
          "notifications so we can remind you before your trial ends.</p>" +
          "<button data-act='notify' style='background:none;border:0;padding:10px;" +
          "font-family:inherit;font-size:15px;font-weight:600;color:var(--accent)'>" +
          "Turn on notifications</button></div>" : "") +
        "</div>" +
        "<div class='imp-foot' style='padding:0 28px 40px'>" +
        "<button class='imp-btn' data-act='done'>Open Konvo</button></div>";
    }

    var wall = null;
    var notReady = false;
    var lastBuy = "";
    // The whole funnel up to and including the paywall is the light design;
    // the phone's appearance takes over only when the wall is out of the
    // way. Native launched pinned Light (lib.rs) - this asks KonvoStore to
    // unpin, flipping the letterbox, the status bar, and Instagram's own
    // prefers-color-scheme in one move. No reply comes back, and without
    // the bridge (tests, old builds) it is a silent no-op.
    var lastAppearance = "light";
    function appearance(mode) {
      if (mode === lastAppearance) return;
      lastAppearance = mode;
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "appearance", id: 0, productId: mode });
      } catch (e) {}
    }
    function goAuto() { appearance("auto"); }
    // The wall leaves slowly: appearance flips to the phone first, then the
    // wall fades off the now-correct chat over .8s. The reveal IS the
    // payoff moment - an instant removal read as a glitch.
    function dismiss() {
      if (!wall) return;
      var w = wall;
      wall = null;
      goAuto();
      w.style.transition = "opacity .8s ease";
      w.style.opacity = "0";
      setTimeout(function () {
        if (w.parentNode) w.parentNode.removeChild(w);
      }, 850);
    }
    function buy(btn, productId) {
      // Beta builds cannot complete a purchase - App Store products do not
      // load until the Paid Apps agreement is active - so the main CTA
      // would spin and strand the tester on the wall. Let it through to
      // the inbox instead, and record WHICH plan they chose: that tap is
      // the pricing signal the whole exercise exists for.
      if (window.__konvoBeta && !window.__konvoNoFree) {
        track("beta_free_taken", {
          plan: productId.indexOf("yearly") > 0 ? "annual"
            : productId.indexOf("monthly") > 0 ? "monthly" : "lifetime",
          via: "cta",
          screen_id: "s13_paywall",
        });
        grantBeta();
        dismiss();
        return;
      }
      btn.disabled = true;
      storekit("purchase", productId, function (res) {
        btn.disabled = false;
        if (res && res.ok && res.entitled) {
          setCache(true);
          lastBuy = productId;
          swap(successPage(productId));
        }
      });
    }
    function tickRows() {
      var rows = wall.querySelectorAll(".imp-row");
      for (var i = 0; i < rows.length; i++) {
        (function (el, delay) { setTimeout(function () {
          if (wall) el.classList.add("done");
        }, delay); })(rows[i], 400 + i * 650);
      }
    }
    // Page changes inside the wall crossfade instead of cutting. The fade
    // lives on an INNER page wrapper: the wall itself keeps its opaque
    // background the whole time, or the live inbox behind it peeks through
    // for the length of the fade.
    function setPage(html, still) {
      // still: repaint without the entrance fade - the package cards
      // replace the same page and must not flash.
      wall.innerHTML = "<div class='imp-page'" +
        (still ? " style='animation:none'" : "") + ">" + html + "</div>";
    }
    function swap(html, then) {
      if (!wall) return;
      var pg = wall.firstChild;
      if (pg) { pg.style.transition = "opacity .28s ease"; pg.style.opacity = "0"; }
      setTimeout(function () {
        if (!wall) return;
        setPage(html);
        if (then) then();
      }, 300);
    }
    var swPending = false, swTried = false;
    function ensure() {
      if (wall || cached() || !atInbox()) return;
      // Verified session first, always. The check is synchronous, so the
      // wall rises in the same tick the cookie appears.
      if (!authed) { checkAuth(); if (!authed) return; }
      // Superwall experiment layer, on only when the cage-patch says
      // {"superwall": true}: the native placement presents Superwall's
      // remotely-designed paywall over the webview instead of the injected
      // wall below. The injected wall stays the enforcement floor - it
      // rises the moment Superwall's sheet ends without an entitlement, so
      // a closed sheet never leaves the inbox open. One attempt per
      // session; after that the floor rules.
      if (window.__konvoSW && !swTried) {
        if (!swPending) {
          swPending = true;
          storekit("paywall", null, function (res) {
            swPending = false;
            swTried = true;
            if (res && res.entitled) { setCache(true); dismiss(); }
            else ensure();
          });
        }
        return;
      }
      // The wall is light-only design: re-pin Light for the rare case of a
      // lapsed subscription raising it over an already-dark app.
      appearance("light");
      try {
        if (!localStorage.konvoLoginTracked) {
          localStorage.konvoLoginTracked = "1";
          track("login_succeeded", { screen_id: "s12_connected" });
        }
      } catch (e) {}
      wall = document.createElement("div");
      wall.id = "im-pay";
      setPage(PAGES.connected);
      wall.addEventListener("click", function (e) {
        var t = e.target.closest("[data-act]");
        if (!t || !wall) return;
        var act = t.getAttribute("data-act");
        if (act === "pk-y" || act === "pk-m" || act === "pk-l") {
          var plan = act.slice(3);
          track("plan_selected", { plan: plan === "y" ? "annual"
            : plan === "m" ? "monthly" : "lifetime", screen_id: "s13_paywall" });
          setPage(pay(plan), true);
        } else if (act === "goodbye") {
          track("delete_prompt_viewed", { screen_id: "s12c_delete" });
          swap(goodbyePage());
        } else if (act === "pay") {
          track("paywall_viewed", { variant: "default", screen_id: "s13_paywall" });
          swap(pay("y"));
        } else if (act === "betafree") {
          // Beta only: unlock without charging, and record that the price
          // was seen and declined - which is the whole point of showing it.
          track("beta_free_taken", { via: "escape", screen_id: "s13_paywall" });
          grantBeta();
          dismiss();
        } else if (act === "notready") {
          // The x does not dismiss - it concedes: reveal the softer path
          // and flip to the Monthly story.
          notReady = true;
          track("plan_selected", { plan: "monthly", screen_id: "s13_paywall" });
          setPage(pay("m"), true);
        } else if (act === "buy-y") {
          buy(t, "konvo.pro.yearly");
        } else if (act === "buy-m") {
          buy(t, "konvo.pro.monthly");
        } else if (act === "buy-l") {
          buy(t, "konvo.pro.lifetime");
        } else if (act === "notify") {
          t.disabled = true;
          storekit("notify", null, function (res) {
            var g = !!(res && res.granted);
            track("notification_permission_result",
              { granted: g, screen_id: "s14_success" });
            var n = wall && wall.querySelector('#imp-notif');
            if (n) n.innerHTML = "<p style='font-size:14px;color:var(--mut)'>" +
              (g ? "Reminder set for " +
                   dateIn((prod().yearly.trialDays || 14) - 2) + "."
                 : "You can turn notifications on in Settings anytime.") + "</p>";
          });
        } else if (act === "restore") {
          // Sync then re-read entitlements; unlocking straight to the
          // inbox - a restorer is returning, not starting a trial.
          storekit("restore", null, function (res) {
            if (res && res.entitled) { setCache(true); dismiss(); }
          });
        } else if (act === "done") {
          track("onboarding_completed", { screen_id: "s14_success" });
          // Land in messages, never wherever the page happened to drift to.
          if (!atInbox()) location.assign("/direct/inbox/");
          dismiss();
        } else if (act === "terms") {
          openExternal("https://konvoinstall.com/terms");
        } else if (act === "privacy") {
          openExternal("https://konvoinstall.com/privacy");
        }
      });
      // The wall eases on rather than slamming over the fresh login: a
      // short fade so "Instagram connected." arrives, not appears.
      wall.style.opacity = "0";
      (document.body || document.documentElement).appendChild(wall);
      requestAnimationFrame(function () {
        var w = wall;
        if (!w) return;
        w.style.transition = "opacity .35s ease";
        w.style.opacity = "1";
      });
      // Live prices arrive while the connected/loader beat plays; the S13
      // render reads whatever answered by then. The cadence is deliberately
      // slow: ~1.8s on connected, ~4.4s of rows ticking, crossfades between.
      storekit("products", null, function (res) {
        if (res && res.ok) P = res;
      });
      setTimeout(function () {
        swap(loaderPage(), tickRows);
      }, 1800);
      setTimeout(function () {
        swap(perksPage());
      }, 6200);
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
    // Retention: fired once per launch, never per navigation.
    // sessionStorage dies with the webview session, so a relaunch counts and
    // moving between screens does not.
    try {
      if (!sessionStorage.konvoOpened) {
        sessionStorage.konvoOpened = "1";
        track("app_opened");
      }
    } catch (e) {}

    // A paying user never sees a wall, so the phone rules immediately.
    if (cached()) goAuto();
    // Same belt-and-braces cadence as enforce(): the inbox is reached by SPA
    // navigation after login, which fires no event this script can hook.
    setInterval(ensure, 800);
    ensure();
  })();

  // Both sweeps are whole-document scans (one of them reads textContent off
  // every span/div/a), and Instagram mutates the DOM on every keystroke,
  // scroll tick and presence ping. Running them per mutation was free on a
  // fast phone and visible jank on an older one, so mutations only ever
  // SCHEDULE a sweep: at most one per frame, and never more than one per
  // 400ms. The CSS rules hide the same doorways instantly anyway; these
  // scans are the fallback for markup the selectors miss.
  var sweepPending = false, sweptAt = 0;
  function sweep() { hideRequests(); hideProfileLink(); }
  function scheduleSweep() {
    if (sweepPending) return;
    sweepPending = true;
    var wait = Math.max(0, 400 - (Date.now() - sweptAt));
    setTimeout(function () {
      // Idle time when the engine offers it: a scan that lands mid-scroll
      // or mid-keystroke is exactly the frame the user feels. The timeout
      // guarantees it still runs on a busy page.
      var run = function () {
        sweepPending = false;
        sweptAt = Date.now();
        sweep();
      };
      if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1200 });
      else requestAnimationFrame(run);
    }, wait);
  }
  new MutationObserver(scheduleSweep)
    .observe(document.documentElement, { childList: true, subtree: true });
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
    // WebKit kills the webview's content process under memory pressure while
    // the app is backgrounded (routinely on iOS, rarely on macOS). Nobody
    // recovers from that by default: reopening the app found a webview with
    // no renderer behind it and showed a permanent black void - no splash,
    // no logo, nothing to tap. Intermittent by nature, because it needs iOS
    // to have evicted the process while suspended. reload() relaunches the
    // content process at the current URL, so a signed-in user lands straight
    // back in the inbox; CAGE_SCRIPT re-injects on the new document.
    #[cfg(any(target_os = "macos", target_os = "ios"))]
    let tauri_builder = tauri_builder.on_web_content_process_terminate(|webview| {
        let _ = webview.reload();
    });
    tauri_builder
        .setup(|app| {
            // Start on the bundled splash, not on instagram.com directly.
            // instagram.com begins with a network round-trip, and until its
            // response arrives there is no document for CAGE_SCRIPT to paint
            // into — which showed as a dead black window on every cold
            // launch. The splash paints from disk on the first frame, then
            // navigates; the in-page boot overlay takes over seamlessly at
            // instagram's document-start.
            // The konvo-beta cargo feature marks a tester build. Testers now
            // walk the REAL funnel and see the REAL paywall - skipping both
            // taught us nothing: 18 testers produced zero onboarding and zero
            // pricing data. What the flag buys them is a "Free during beta"
            // button on the wall, so nobody is charged.
            //
            // The safety is structural, not a switch someone has to remember:
            // the bypass is compiled in ONLY under this feature, so a store
            // build does not contain it and no remote config can conjure it.
            // The cage-patch can still switch it OFF mid-beta
            // ({"betaFree": false}) if a build ever leaks.
            // A feature, not an env var: xcodebuild rebuilds the script
            // phase env from build settings, so an env var dies before
            // cargo; --features rides the tauri CLI all the way through.
            let cage: std::borrow::Cow<str> = if cfg!(feature = "konvo-beta") {
                format!("window.__konvoBeta=true;\n{CAGE_SCRIPT}").into()
            } else {
                CAGE_SCRIPT.into()
            };
            let builder = WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::App("index.html".into()),
            )
            .initialization_script(cage.as_ref())
            // Sets both the window and the webview. On the Mac this is what
            // stopped the white -> black launch flash. On iOS this color is
            // what shows between documents - the splash hands off to
            // instagram.com and the webview has nothing to paint until the
            // response arrives - so it must match the light funnel around
            // it, or every relaunch flashes a black hole inside the white
            // letterbox. The letterbox itself is the root view, painted
            // with dynamic systemBackground in the block below.
            .background_color(if cfg!(target_os = "ios") {
                Color(255, 255, 255, 255)
            } else {
                Color(0, 0, 0, 255)
            })
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

                    // The letterbox above and below the pinned webview is
                    // this root view. systemBackground is dynamic, so it
                    // tracks whatever appearance the view controller is in.
                    let sysbg: *mut AnyObject =
                        msg_send![objc2::class!(UIColor), systemBackgroundColor];
                    let _: () = msg_send![root, setBackgroundColor: sysbg];

                    // Launch pinned Light while the funnel is unfinished:
                    // everything Konvo owns - splash, onboarding, login,
                    // paywall - is the approved light design regardless of
                    // the phone's appearance. KonvoStore records the last
                    // appearance request in NSUserDefaults; once the paywall
                    // has cleared ("auto"), later launches skip the pin so a
                    // returning user's first frame is already the phone's
                    // appearance - no light flash before the dark chat.
                    // UIUserInterfaceStyle: 1 = light.
                    let defaults: *mut AnyObject =
                        msg_send![objc2::class!(NSUserDefaults), standardUserDefaults];
                    let done_key: *mut AnyObject = msg_send![
                        objc2::class!(NSString),
                        stringWithUTF8String: c"konvoFunnelDone".as_ptr()
                    ];
                    let funnel_done: Bool = msg_send![defaults, boolForKey: done_key];
                    if !funnel_done.as_bool() {
                        let _: () = msg_send![vc, setOverrideUserInterfaceStyle: 1i64];
                    }

                    // The webview's own background (visible between
                    // documents, e.g. splash -> instagram.com) follows the
                    // same dynamic color as the letterbox, so neither path
                    // ever flashes the wrong shade.
                    let _: () = msg_send![wk, setOpaque: Bool::NO];
                    let _: () = msg_send![wk, setBackgroundColor: sysbg];
                    let _: () = msg_send![wk, setUnderPageBackgroundColor: sysbg];

                    // Long-press never pops Safari's link preview sheet.
                    // Back-swipe and tap-to-dismiss are native gestures in
                    // KonvoStore.swift: WebKit's own back-forward swipe
                    // animates a stale snapshot over Instagram's SPA and
                    // glitches on handoff, so it stays off. Dragging the
                    // chat down also slides the keyboard away, like the
                    // native app.
                    let _: () = msg_send![wk, setAllowsLinkPreview: Bool::NO];
                    let sv: *mut AnyObject = msg_send![wk, scrollView];
                    // UIScrollViewKeyboardDismissMode.interactive = 2
                    let _: () = msg_send![sv, setKeyboardDismissMode: 2i64];

                    // The paywall's StoreKit bridge. KonvoStore.swift (in
                    // gen/apple/Sources) implements WKScriptMessageHandler;
                    // registering it here exposes it to CAGE_SCRIPT as
                    // window.webkit.messageHandlers.konvoStore. Looked up by
                    // name, not linked: a binary built without the Swift
                    // file simply has no bridge, and the paywall's
                    // entitlement check no-ops instead of crashing.
                    if let Some(cls) = objc2::runtime::AnyClass::get(c"KonvoStore") {
                        let config: *mut AnyObject = msg_send![wk, configuration];
                        let ucc: *mut AnyObject = msg_send![config, userContentController];
                        let handler: *mut AnyObject = msg_send![cls, new];
                        let name: *mut AnyObject = msg_send![
                            objc2::class!(NSString),
                            stringWithUTF8String: c"konvoStore".as_ptr()
                        ];
                        let _: () = msg_send![ucc, addScriptMessageHandler: handler, name: name];
                    }
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
