
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

  // Analytics go native: Instagram's CSP blocks a page-side call to
  // PostHog. Defined here rather than inside the paywall block because the
  // route watcher needs it too. Event names and screen ids only, never
  // content, never a thread id.
  function track(event, props) {
    try {
      var p = props || {};
      // The variant rides on every event (the native side adds the build
      // number): konvo-free has no paywall to see, and funnels that could
      // not tell variants apart have already lied twice.
      p.variant = window.__konvoBeta ? "beta"
        : window.__konvoFree ? "free" : "default";
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: "track", id: 0, event: event, props: p });
    } catch (e) {}
  }

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

  // Bridge to KonvoStore.swift. Fire-and-forget postMessage with a numbered
  // callback; Swift replies through __konvoStoreReply. A build without the
  // Swift class (or the tests) has no handler - the catch answers null and
  // everything degrades to "no verdict, keep the cache". Hoisted to the
  // top level Aug 17: the session rescue in enforce() needs it too, not
  // just the wall.
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

  // One settle for every "report when the page finishes rendering" need.
  // Owns its observer, its tick, and a completion latch; the latch, not
  // clearInterval, is what guarantees one report - a field device fired a
  // completion branch every 92ms for 17 seconds with clearInterval doing
  // nothing (Aug 17, TestFlight 52). Starting a settle cancels the one
  // before it, so a crossing mid-settle reports nothing for the abandoned
  // page. `ready` gates completion (a quiet skeleton is not ready); the
  // cap reports regardless so a stuck page is visible, not silent.
  var activeSettle = null;
  function settle(ready, capMs, done) {
    if (activeSettle) activeSettle();
    if (!window.MutationObserver) return;
    var mo = null, tick = null, finished = false;
    var last = Date.now(), t0 = last;
    var stop = activeSettle = function () {
      finished = true;
      if (tick) clearInterval(tick);
      if (mo) { mo.disconnect(); mo = null; }
    };
    try {
      mo = new MutationObserver(function () { last = Date.now(); });
      mo.observe(document.body || document.documentElement,
        { childList: true, subtree: true });
      tick = setInterval(function () {
        if (finished) return;
        var now = Date.now();
        if ((ready() && now - last > 180) || now - t0 > capMs) {
          stop();
          done(now - t0);
        }
      }, 90);
    } catch (e) { stop(); }
  }

  // Login drop-off detail (Aug 23): what people DO on Instagram's own
  // pages before they vanish. Taps by button label, submits, the error
  // Instagram shows (classified into an enum, never quoted), and the
  // moment the app goes to the background with a login page up. Stage
  // names and enums only; nothing typed is ever read, and a "Continue as
  // <name>" button loses its name.
  var loginWatched = false, loginSubmits = 0, loginT0 = Date.now();
  var loginErrorsSeen = {};
  function loginStage() {
    return location.pathname.indexOf("/challenge") !== -1 ? "challenge"
      : location.pathname.indexOf("two_factor") !== -1 ? "two_factor"
      : location.pathname.indexOf("/accounts/login") === 0 ? "login" : null;
  }
  function classifyLoginError(t) {
    t = t.toLowerCase();
    if (/password was incorrect|incorrect password/.test(t)) return "wrong_password";
    if (/doesn.t belong to an account|username you entered|can.t find an account/.test(t)) return "no_account";
    if (/security code|check the code|code you entered|code is incorrect/.test(t)) return "two_factor_code";
    if (/wait a few minutes|try again later|too many|limit/.test(t)) return "rate_limited";
    if (/suspicious|confirm it.s you|unusual|verify/.test(t)) return "challenge";
    if (/went wrong|error occurred|try again/.test(t)) return "generic";
    return "other";
  }
  function watchLogin() {
    if (loginWatched) return;
    loginWatched = true;
    document.addEventListener("click", function (e) {
      var st = loginStage();
      var b = e.target && e.target.closest && e.target.closest("button,[role=button],a");
      if (!st || !b) return;
      var label = (b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!label) return;
      label = label.replace(/^(continue|log in) as .*$/, "$1 as").slice(0, 24);
      track("login_tap", { stage: st, label: label });
    }, true);
    // The keyboard's Passwords key is the whole trick and nobody looks
    // for it: say so once, the first time a login field takes focus, and
    // take it down on submit. Plain words, no promise the phone may not
    // keep (a phone with nothing saved still sees the key).
    // The fields must be named BEFORE iOS reads them, which happens at
    // focus: the 800ms sweep alone lost the race to a quick tap (build
    // 61 showed the key, 62 did not). So: the moment inputs appear, and
    // once more inside the focus event, which runs before WebKit reports
    // the focused field to the keyboard.
    try {
      new MutationObserver(function () {
        var st = loginStage();
        if (st) hintLoginFields(st);
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    document.addEventListener("focusin", function () {
      var st = loginStage();
      if (st) hintLoginFields(st);
    }, true);
    document.addEventListener("submit", function () {
      var st = loginStage();
      if (!st) return;
      loginSubmits++;
      dropKeyTip();
      track("login_submitted", { stage: st, attempt: loginSubmits });
    }, true);
    document.addEventListener("visibilitychange", function () {
      var st = loginStage();
      if (document.visibilityState !== "hidden" || !st) return;
      track("login_left", { stage: st, submits: loginSubmits,
        seconds: Math.round((Date.now() - loginT0) / 1000) });
    });
  }
  // Keychain AutoFill (Aug 23): Instagram's phone login page marks its
  // fields autocomplete="on" and keeps them outside any form, which tells
  // iOS nothing. WebKit in a third-party webview hands the keyboard a
  // content type only from the autocomplete token (Safari has its own
  // form analysis), so the saved password never surfaced. Naming the
  // fields makes the suggestion appear: one tap, Face ID, both filled.
  // The two-factor code field gets one-time-code, so the SMS code is
  // offered above the keyboard as well. Reapplied every sweep because a
  // React re-render can put the old attribute back.
  function hintLoginFields(st) {
    var i, els;
    if (st === "two_factor") {
      els = document.querySelectorAll("input[name*=code i],input[name*=verification i],input[inputmode=numeric]");
      for (i = 0; i < els.length; i++) {
        if (els[i].getAttribute("autocomplete") !== "one-time-code")
          els[i].setAttribute("autocomplete", "one-time-code");
      }
      return;
    }
    els = document.querySelectorAll("input[name=username],input[name=email]");
    for (i = 0; i < els.length; i++) {
      if (els[i].getAttribute("autocomplete") !== "username")
        els[i].setAttribute("autocomplete", "username");
    }
    els = document.querySelectorAll("input[type=password]");
    for (i = 0; i < els.length; i++) {
      if (els[i].getAttribute("autocomplete") !== "current-password")
        els[i].setAttribute("autocomplete", "current-password");
    }
  }
  // The hint shows the moment the sign-in form is on screen (Aug 23), not
  // on the first tap: the sweep calls this until the form exists.
  var hintShown = false, hintTries = 0;
  function showKeyTip(st) {
    // The Passwords key is an iOS keyboard affordance; a Mac has no key
    // bar above the keyboard, so the tip is iPhone-only (1.3.0 pulled it
    // from the Mac build, where it read as nonsense over the login form).
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
    if (hintShown || st !== "login") return;
    if (!document.querySelector("input[name=username],input[name=email],input[type=password]")) return;
    // Under Instagram's logo. The logo image lays out a beat after the
    // inputs, so wait for it to have a size (TestFlight 66 pinned the tip
    // to the top edge by racing it); after ~4s of sweeps, top edge it is.
    var top = 14, pinned = false;
    var logo = document.querySelector("img[alt*='Instagram' i],[aria-label='Instagram'],svg[aria-label*='Instagram' i]");
    if (logo && logo.getBoundingClientRect) {
      var r = logo.getBoundingClientRect();
      if (r.height > 0 && r.bottom < window.innerHeight / 2) {
        top = Math.round(r.bottom + 14);
        pinned = true;
      }
    }
    if (!pinned && hintTries++ < 5) return;
    hintShown = true;
    var tip = document.createElement("div");
    tip.id = "im-keytip";
    tip.setAttribute("style", "position:fixed;top:" + top + "px;left:16px;right:16px;" +
      "z-index:2147483646;padding:12px 18px;border-radius:18px;" +
      "background:rgba(18,22,30,.94);color:#f2f3f7;font:600 14px/1.35 -apple-system,system-ui,sans-serif;" +
      "box-shadow:0 4px 18px rgba(0,0,0,.3);text-align:center;pointer-events:none");
    tip.textContent = "Press \u201CPasswords\u201D above your keyboard and search Instagram to find your account.";
    (document.body || document.documentElement).appendChild(tip);
    track("login_keytip_shown", { stage: st });
  }
  function dropKeyTip() {
    var t = document.getElementById("im-keytip");
    if (t && t.parentNode) t.parentNode.removeChild(t);
  }
  function pollLoginErrors(st) {
    var els = document.querySelectorAll("[role=alert],[id$=ErrorAlert],[data-testid*=error]");
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || "").trim();
      if (t.length < 8 || loginErrorsSeen[t]) continue;
      loginErrorsSeen[t] = 1;
      track("login_error", { stage: st, error: classifyLoginError(t), submits: loginSubmits });
    }
  }

  // The rating ask (moved here Aug 27, App Review 5.6.3): asked once, on
  // the third distinct day the inbox settles - by then the person has
  // signed in, come back twice, and knows what the app is. Never while
  // the wall is up (rating a paywall is not a moment), and iOS still
  // decides whether a sheet actually appears.
  function maybeAskReview() {
    try {
      if (localStorage.konvoReviewAsked) return;
      var today = new Date().toDateString();
      if (localStorage.konvoLastDay !== today) {
        localStorage.konvoLastDay = today;
        localStorage.konvoUseDays =
          (parseInt(localStorage.konvoUseDays, 10) || 0) + 1;
      }
      if ((parseInt(localStorage.konvoUseDays, 10) || 0) < 3) return;
      if (document.getElementById("im-pay")) return;
      localStorage.konvoReviewAsked = "1";
      track("review_asked", {});
      storekit("review", null, function () {});
    } catch (e) {}
  }

  function enforce() {
    if (!location.hostname.endsWith("instagram.com")) return;
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) sizeViewport();
    if (atInbox()) sweepKeepBack();
    if (blocked(location.pathname)) {
      try { window.stop(); } catch (e) {}
      location.replace("/direct/inbox/");
    }
    // The 35% who start login and never arrive die somewhere in here, and
    // these routes are the only witnesses. The challenge page is the
    // emailed verification code - the wall that stopped App Review twice.
    // Stage names only, never anything from the page.
    var ls = location.pathname.indexOf("/challenge") !== -1 ? "challenge"
      : location.pathname.indexOf("two_factor") !== -1 ? "two_factor"
      : location.pathname.indexOf("/accounts/login") === 0 ? "login" : null;
    if (ls && ls !== lastLoginStage) {
      lastLoginStage = ls;
      // A signed-in visit to these routes is not login friction.
      if (!/(?:^|; )ds_user_id=\d/.test(document.cookie))
        track("login_step", { stage: ls });
    }
    if (ls && !/(?:^|; )ds_user_id=\d/.test(document.cookie)) {
      watchLogin();
      hintLoginFields(ls);
      showKeyTip(ls);
      pollLoginErrors(ls);
    }
    // Session rescue: landing on the login page with no session cookie
    // means WebKit lost the cookies (lazy disk flush plus a force-quit;
    // a tester relogged every launch, Aug 17). Native keeps a snapshot
    // from the last settled inbox; restore it once and go back. A real
    // logout restores cookies Instagram already killed server-side,
    // lands here again, and the once-flag stops the loop. Challenge and
    // 2FA pages are mid-flow and must not be interrupted.
    if (ls === "login" && !cookieRestoreTried &&
        !/(?:^|; )ds_user_id=\d/.test(document.cookie)) {
      cookieRestoreTried = true;
      storekit("cookieRestore", null, function (res) {
        if (res && res.restored) {
          track("session_restored");
          location.replace("/direct/inbox/");
        }
      });
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
    // Instagram ships the DM composer (a role=textbox contenteditable)
    // without autocorrect, so typing gets no correction bar. In a
    // messaging app that is a bug, not a preference. Re-asserted on the
    // tick because Instagram rebuilds the composer per thread and per
    // send; the attribute guard keeps the tick from touching a composer
    // that is already fixed. Set before focus on purpose: iOS reads
    // keyboard traits at focus time and ignores changes made after.
    if (r === "thread") {
      var tb = document.querySelector('div[role="textbox"]');
      if (tb && tb.getAttribute("autocorrect") !== "on") {
        tb.setAttribute("autocorrect", "on");
        tb.setAttribute("autocapitalize", "sentences");
        tb.setAttribute("spellcheck", "true");
      }
    }
    if (r !== lastRoute) {
      lastRoute = r;
      // Reading a conversation is the product working. Launch counts alone
      // cannot tell an open that led to a chat from one that bounced.
      // The route watcher crosses once per navigation, so no extra guard:
      // the app always loads the inbox, so the first crossing is never a
      // thread, and if it ever were, that would be a thread open too.
      if (r === "thread") {
        track("thread_opened");
        // How slow switching into a chat FEELS ("way slower to text and
        // switch between ppl", Aug 17). Ready means real message rows:
        // the placeholder renders instantly, goes quiet, and fills only
        // when the fetch lands - quiet alone once reported 181ms "ready"
        // on a stuck skeleton. rows 0 at the cap IS the stuck-chat signal.
        var threadRows = function () {
          return document.querySelectorAll("div[role='row']").length;
        };
        settle(function () { return threadRows() > 0; }, 10000, function (ms) {
          track("thread_ready", { ms: ms, rows: threadRows() });
        });
      }
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
        if (r === "inbox") {
          settle(function () { return true; }, 2000, function (ms) {
            sizeInboxTitle();
            // What a connected user actually finds: 20 of the first 28
            // sign-ins never opened a thread. Thread count and time to
            // a settled inbox are the two numbers that can say why.
            var rp = {
              threads: document.querySelectorAll(
                'a[href^="/direct/t/"]').length,
              ms: ms };
            // Identity for the roster, decided Aug 14: ds_user_id is
            // the stable Instagram id, titleEl (found by
            // sizeInboxTitle above) is the handle. Retries each settle
            // until a handle is captured, then never again. Threads
            // and message content stay untouched.
            try {
              var idm = document.cookie.match(/(?:^|; )ds_user_id=(\d+)/);
              if (idm && !localStorage.konvoIdentified) {
                rp.$set = { ig_user_id: idm[1] };
                var un = titleEl && (titleEl.textContent || "").trim();
                if (un) {
                  rp.$set.ig_username = un;
                  localStorage.konvoIdentified = "1";
                }
              }
            } catch (e) {}
            track("inbox_ready", rp);
            maybeAskReview();
            // A settled inbox is proof these cookies are the good
            // ones: snapshot them natively so a force-quit cannot
            // lose the session (see the login rescue above).
            storekit("cookieSave", null, function () {});
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
          });
        }
      }
    }
  }
  var lastRoute = null, lastLoginStage = null;
  var cookieRestoreTried = false;
  // Every screen change gets the same push, wherever it goes - a DM, a
  // profile from a DM, a profile from search. pushState is Instagram's
  // forward navigation and popstate is a back; the native side owns the
  // animation, so this only has to say which way. Full page loads (not
  // SPA) fire neither and simply do not animate.
  // Search mode is a route the URL never changes for, so the class carries
  // it: focusing a search box unhides Instagram's own way back out.
  // Search mode outlives the keyboard, and the arrow is display:none by
  // the time we look (our own back-button CSS hides it), so its bounding
  // box is zeros and no geometry can find it - which is why the tag never
  // landed (Aug 24, device). Structure instead of geometry: the arrow that
  // belongs to search lives in the same small subtree as the search
  // input, so walk up a few levels from every text input and tag any Back
  // arrow found there. The header's escape arrow sits in another subtree
  // and stays hidden. Re-tagged every sweep because re-renders replace
  // the node; a tagged node that leaves the DOM needs no untagging.
  function sweepKeepBack() {
    var inputs = document.querySelectorAll("input[type=text],input:not([type])");
    for (var i = 0; i < inputs.length; i++) {
      var node = inputs[i];
      for (var up = 0; up < 4 && node; up++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        var arrows = node.querySelectorAll(
          "a:has(svg[aria-label='Back']),[role='button']:has(svg[aria-label='Back'])");
        if (arrows.length) {
          for (var j = 0; j < arrows.length; j++) arrows[j].classList.add("im-keep-back");
          break;
        }
      }
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
      setTimeout(sweepKeepBack, ms);
    });
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

  var navSuppress = 0, navPath = "";
  function nav(dir) {
    if (!isPhone) return;
    // One tap, one animation: spaGo raises both events - for the SAME
    // destination. A different path inside the window is a fresh tap
    // (swipe back, then straight into the next chat) and must report.
    if (navSuppress && Date.now() - navSuppress < 400 &&
        location.pathname === navPath) return;
    navSuppress = Date.now();
    navPath = location.pathname;
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
    // Has this install already been through the welcome sequence? Any of
    // the three markers counts, whichever build wrote it. They used to be
    // read per-variant, so updating between build modes replayed the whole
    // sequence: konvoWelcomed was invisible to a beta build and
    // konvoBetaFree was invisible to a free one. The sequence is a
    // once-per-install thing, not a once-per-variant thing.
    function seenSequence() {
      try {
        return !!(localStorage.getItem("konvoWelcomed") ||
          localStorage.getItem("konvoBetaFree") ||
          localStorage.getItem("konvoPaid"));
      } catch (e) { return false; }
    }
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
      '--chip:#f2f2f4;--icbg:#eef3ff;--accent:#0a5cf0;--sheet:rgba(242,242,244,.9)}' +
      // System appearance (Aug 16): the wall follows the phone like the
      // rest of onboarding. Same palette as dist/index.html's dark block;
      // pure black --bg meets the native letterbox with no seam. The
      // doubled id outranks every later light rule regardless of source
      // order (the first cut lost the cascade and the annual card stayed
      // white with dark-scheme text).
      '@media (prefers-color-scheme: dark){' +
      '#im-pay#im-pay{--bg:#000;--ink:#f2f3f7;--mut:#9aa0ae;--line:#2a2d36;--sheet:rgba(24,27,35,.82);' +
      '--chip:#1c1f27;--icbg:#101c33;--accent:#0a84ff}' +
      '#im-pay#im-pay .imp-pk.on{background:#101c33}' +
      // The timeline stem was near-black on black; a visible blue.
      '#im-pay#im-pay .imp-stem{background:rgba(10,132,255,.45)}}' +
      '#im-pay{position:fixed;inset:0;z-index:2147483645;background:var(--bg);color:var(--ink);' +
      'display:flex;flex-direction:column;font-family:-apple-system,system-ui,sans-serif;' +
      '-webkit-font-smoothing:antialiased}' +
      '#im-pay .imp-page{flex:1;display:flex;flex-direction:column;min-height:0;' +
      'animation:im-payfade .45s ease}' +
      '@keyframes im-payfade{from{opacity:0}}' +
      '#im-pay h2{margin:0;font-weight:700;letter-spacing:-0.035em;line-height:1.2;' +
      'color:inherit}' +
      // The wall lives inside Instagram's document, and their global
      // element rules beat inheritance - headings silently took THEIR
      // text color. Invisible on the light wall (their ink matched ours),
      // exposed by dark mode as charcoal-on-black (device, Aug 16).
      '#im-pay h1,#im-pay h3,#im-pay h4,#im-pay h5,#im-pay h6,' +
      '#im-pay b,#im-pay u,#im-pay i{color:inherit}' +
      '#im-pay p{margin:0}' +
      '#im-pay .imp-mid{flex:1;display:flex;flex-direction:column;justify-content:center;' +
      'padding:0 24px;overflow-y:auto;overscroll-behavior:none}' +
      '#im-pay .imp-foot{flex:none;padding:0 20px 34px}' +
      // The reveal (Aug 22): the wall goes clear over the real inbox, a
      // pill up top, a sheet at the foot. The button inverts the scheme
      // so it reads against whatever the inbox is showing.
      '#im-pay{transition:background .5s ease}' +
      '#im-pay.im-reveal{background:transparent}' +
      // The reveal's choreography (Aug 23): the pill drops in with a
      // spring as the wall clears, its check draws itself, a green ring
      // breathes out once; the sheet slides up a beat later, translucent
      // over the inbox and a third shorter than the first cut, so the
      // inbox is the picture and the sheet the caption.
      '#im-pay .imp-pill{position:absolute;top:14px;left:50%;transform:translateX(-50%);' +
      'display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:999px;' +
      'background:rgba(18,22,30,.92);color:#5ee0a5;font-size:14px;font-weight:600;' +
      'white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.3);z-index:2;' +
      'animation:im-pilldrop .7s cubic-bezier(.34,1.56,.64,1) .15s both,' +
      'im-pillring 1.3s ease-out .7s both}' +
      '@keyframes im-pilldrop{from{transform:translate(-50%,-36px) scale(.8);opacity:0}}' +
      '@keyframes im-pillring{0%{box-shadow:0 4px 18px rgba(0,0,0,.3),0 0 0 0 rgba(94,224,165,.6)}' +
      '100%{box-shadow:0 4px 18px rgba(0,0,0,.3),0 0 0 22px rgba(94,224,165,0)}}' +
      '#im-pay .imp-pill path{stroke-dasharray:24;stroke-dashoffset:24;' +
      'animation:im-draw .45s ease-out .55s forwards}' +
      '#im-pay .imp-sheet{position:absolute;left:0;right:0;bottom:0;padding:8px 22px 22px;' +
      'border-radius:24px 24px 0 0;background:var(--sheet);text-align:center;' +
      '-webkit-backdrop-filter:saturate(1.4) blur(22px);backdrop-filter:saturate(1.4) blur(22px);' +
      'box-shadow:0 -10px 36px rgba(0,0,0,.3);' +
      'animation:im-sheetup .65s cubic-bezier(.32,.72,0,1) .45s both}' +
      '@keyframes im-sheetup{from{transform:translateY(110%)}}' +
      '#im-pay .imp-sheet h2{font-size:22px}' +
      '#im-pay .imp-sheet p{font-size:13.5px;line-height:1.45;color:var(--mut);margin-top:6px}' +
      '#im-pay .imp-grab{width:34px;height:4px;border-radius:999px;background:var(--line);' +
      'margin:0 auto 12px}' +
      '#im-pay .imp-sheet .imp-btn{background:var(--ink);color:var(--bg);box-shadow:none;' +
      'margin-top:14px;min-height:48px;font-size:16px}' +
      '#im-pay .imp-sheet .imp-next{font-size:13px;color:var(--mut);margin-top:10px}' +
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
      // The keyframes were simply missing since day one: the ring
      // rendered but never turned. Caught on device Aug 16.
      '@keyframes im-spin{to{transform:rotate(360deg)}}' +
      // The S14 checkmark draws itself: dashoffset runs the stroke tip
      // along the path while im-pop scales the whole mark in.
      '@keyframes im-draw{to{stroke-dashoffset:0}}' +
      '#im-pay .imp-head{flex:none;height:120px;position:relative;' +
      'background:linear-gradient(180deg,#1a6bf2 0%,#0a5cf0 100%)}' +
      '@keyframes im-pop{from{transform:scale(.4);opacity:0}}' +
      '#im-pay .imp-pk{flex:1;border-radius:14px;box-shadow:inset 0 0 0 1.2px var(--line);' +
      'padding:18px 6px 12px;text-align:center;position:relative}' +
      '#im-pay .imp-pk.on{box-shadow:inset 0 0 0 2px var(--accent);background:#f6f9ff}' +
      '#im-pay .imp-pk b{display:block;font-size:13.5px;letter-spacing:-0.01em}' +
      '#im-pay .imp-pk i{display:block;font-style:normal;font-size:15px;font-weight:700;' +
      'margin-top:4px}' +
      '#im-pay .imp-pk u{display:block;text-decoration:none;font-size:10.5px;' +
      'color:var(--mut);margin-top:3px;line-height:1.3}' +
      // The badge sits on the card's top edge with a ring of page colour
      // around it, so it reads as a tag on the card, not a line in it.
      '#im-pay .imp-rec{position:absolute;top:-11px;left:50%;transform:translateX(-50%);' +
      'white-space:nowrap;background:var(--accent);color:#fff;font-size:10px;' +
      'font-weight:700;letter-spacing:0.06em;padding:4px 10px;border-radius:999px;' +
      'box-shadow:0 0 0 3px var(--bg)}' +
      '#im-pay .imp-tl{display:flex;gap:16px}' +
      '#im-pay .imp-tl h4{margin:0;font-size:17px;font-weight:700}' +
      '#im-pay .imp-tl p{font-size:15px;line-height:1.45;color:var(--mut);margin-top:4px}' +
      '#im-pay .imp-tl p b{color:var(--ink);font-weight:600}' +
      '#im-pay .imp-dot{flex:none;width:44px;display:flex;flex-direction:column;' +
      'align-items:center}' +
      '#im-pay .imp-dot i{flex:none;width:44px;height:44px;border-radius:50%;' +
      'background:var(--accent);display:inline-flex;align-items:center;' +
      'justify-content:center}' +
      '#im-pay .imp-pk u.imp-save{margin-top:5px;font-size:11.5px;font-weight:700;' +
      'letter-spacing:.02em;color:var(--accent)}' +
      '#im-pay .imp-stem{flex:1;width:8px;border-radius:999px;' +
      'background:rgba(10,92,240,.15);margin-top:0}';

    // Funnel events, fire-and-forget through the bridge (Instagram's CSP
    // blocks page-side analytics). Lean payloads by decision: names and
    // screen ids only. Silent no-op without the bridge (tests, Mac).
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
      return "<div style='display:flex;align-items:stretch;border-top:1px solid var(--line)'>" +
        "<span style='flex:1;display:flex;align-items:center;padding:12px 8px 12px 0;" +
        "font-size:15px;line-height:1.3'>" + label + "</span>" +
        "<span style='width:74px;flex:none;display:flex;align-items:center;" +
        "justify-content:center'>" + (free ? CKGREY : XMARK) + "</span>" +
        "<span style='width:74px;flex:none;display:flex;align-items:center;" +
        "justify-content:center;background:var(--icbg)" +
        (last ? ";border-radius:0 0 12px 12px" : "") + "'>" + CKBLUE + "</span></div>";
    }
    function perksPage() {
      return "<div class='imp-mid' style='padding:24px 20px'>" +
        "<h2 style='font-size:26px'>Why Konvo works</h2>" +
        "<div style='display:flex;align-items:flex-end;margin-top:28px'>" +
        "<span style='flex:1;font-size:13px;font-weight:600;color:var(--mut)'>" +
        "What you get</span>" +
        "<span style='width:74px;flex:none;text-align:center;font-size:10.5px;" +
        "font-weight:700;letter-spacing:0.03em;white-space:nowrap;" +
        "color:var(--mut);padding-bottom:10px'>LIMIT APPS</span>" +
        "<span style='width:74px;flex:none;display:flex;justify-content:center;" +
        "padding:9px 0;background:var(--icbg);border-radius:12px 12px 0 0'>" +
        "<span style='background:var(--accent);color:#fff;font-size:10px;" +
        "font-weight:700;letter-spacing:0.06em;padding:4px 9px;border-radius:999px'>" +
        "KONVO</span></span></div>" +
        // Every row a true claim, in plain words (rewritten Aug 21: the
        // old rows described the deleted delete-Instagram flow and
        // promised notifications Konvo does not send).
        perkRow("No feed, no Reels, no Explore", false, false) +
        perkRow("The Instagram app stays locked", false, false) +
        perkRow("Two 5 minute passes a day, then it locks itself", false, false) +
        perkRow("No snooze button to cave to", false, false) +
        perkRow("Every DM and Story, nothing missing", false, true) +
        "</div>" +
        "<div class='imp-foot' style='padding:14px 24px 30px'>" +
        "<div style='display:flex;align-items:center;justify-content:center;gap:8px;" +
        "padding-bottom:12px;font-size:14px;color:var(--mut)'>" +
        "<span style='width:18px;height:18px;border-radius:50%;background:var(--accent);" +
        "display:inline-flex;align-items:center;justify-content:center'>" + CHECK +
        "</span>" + (window.__konvoFree
          ? "Free. Nothing to cancel."
          : "No commitment. Cancel anytime.") + "</div>" +
        "<button class='imp-btn' data-act='" +
        (window.__konvoFree ? "welcomed" : "impact") +
        "'>Continue</button></div>";
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
    var FALLBACK = { yearly: { price: '$19.99', perWeek: '$0.38',
                               perMonth: '$1.67', savePct: 76, trialDays: 7 },
                     monthly: { price: '$6.99' },
                     lifetime: { price: '$19.99' } };
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

    var MOON = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M20 14.5A8.5 8.5 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5Z'/></svg>";
    var SHIELD = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z'/></svg>";
    var CHAT = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'>" +
      "<path d='M12 4c-4.4 0-8 3-8 6.8 0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/></svg>";

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
        "</div><div style='padding:4px 0 " + (stem ? "22px" : "0") + "'>" +
        "<h4>" + title + "</h4><p>" + body + "</p></div></div>";
    }
    function dateIn(days) {
      var d = new Date(Date.now() + days * 86400000);
      try {
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      } catch (e) { return ""; }
    }
    function pkCard(act, on, badge, name, price, sub, save) {
      // `save` is the accent line below the price. The trial is not on
      // the card: the headline and the CTA state it for the chosen plan.
      return "<div class='imp-pk" + (on ? " on" : "") + "' data-act='" + act + "'>" +
        (badge ? "<span class='imp-rec'>" + badge + "</span>" : "") +
        "<b>" + name + "</b>" +
        "<i>" + price + "</i><u>" + sub + "</u>" +
        (save ? "<u class='imp-save'>" + save + "</u>" : "") + "</div>";
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
      var mtd = plan === "m" ? (m.trialDays || 0) : 0;
      if (plan === "m" && mtd) {
        head = "First " + mtd + " days free, then " + m.price + " a month.";
        cta = "Start your free " + mtd + " days";
        act = "buy-m";
        reassure = "No commitment, cancel anytime";
        tl = node(LOCK, "Today", "Unlock your DMs and Stories in Konvo. Pay $0.", true) +
             node(STAR, "In " + mtd + " days", "You'll be charged " + m.price +
               " on <b>" + dateIn(mtd) + "</b>, <b>cancel anytime</b> before.", false);
      } else if (plan === "m") {
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
        cta = "Start your free " + td + " days";
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
        cta = "Continue with Yearly";
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
        "<div style='position:absolute;left:34px;top:26px;width:74px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.16);transform:rotate(-8deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.55)'>FEED</div>" +
        "<div style='position:absolute;right:30px;top:64px;width:62px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.14);transform:rotate(7deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.5)'>REELS</div>" +
        "<div style='position:absolute;left:50%;top:28px;transform:translateX(-50%);" +
        "width:64px;height:64px;border-radius:18px;background:#fff;display:flex;" +
        "align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(4,30,80,.35)'>" +
        "<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0'" +
        " stroke-width='2.2' stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 " +
        "0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/>" +
        "</svg></div></div>" +
        "<div class='imp-mid' style='justify-content:flex-start;padding:24px 24px 0'>" +
        "<div style='text-align:center'>" +
        "<h2 style='font-size:24px'>" +
        (lapsedWall ? "Your plan ended."
          : td || mtd ? "How your free trial works" : "How your plan works") + "</h2>" +
        "<p style='font-size:15px;color:var(--ink);margin-top:10px'>" +
        (lapsedWall ? "Instagram is unblocked until you pick a plan. " : "") + head + "</p>" +
        (mot ? "<p style='font-size:14px;font-weight:600;color:var(--accent);" +
          "margin-top:8px'>" + mot + "</p>" : "") + "</div>" +
        proofStrip() +
        "<div style='display:flex;gap:8px;margin:22px 0 24px'>" +
        // The card prices annual by the month - the number a shopper
        // compares against the monthly plan. The full yearly charge is
        // stated in the line above and in the timeline. The unit label
        // follows whichever number actually rendered: pairing the yearly
        // price with "per month" would be a straight lie.
        // The card states the yearly charge outright, the monthly
        // equivalent in brackets, and the trial on its own line (Aug 21).
        // Yearly leads with its monthly equivalent (the number shoppers
        // compare), the yearly charge underneath, and the live saving as
        // its badge (Aug 21).
        pkCard("pk-y", plan === "y", sp ? "SAVE " + sp + "%" : "POPULAR", "Yearly Plan",
          (y.perMonth || y.price) + "/month",
          y.perMonth ? y.price + "/year" : "", "") +
        pkCard("pk-m", plan === "m", "", "Monthly Plan", m.price + "/month", "", "") +
        "</div>" +
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
    // ── The block (Aug 16, v2) ──────────────────────────────────────────
    // Screen Time setup is the onboarding's main road, BEFORE the paywall:
    // permission first, sell second, the order Opal proved. The old
    // delete-Instagram ask is gone; blocking while keeping the app
    // installed IS the product now. konvo-free, iOS 15, and macOS skip
    // from the loader straight to perks and never see any of it.
    // The Screen Time connect page, modeled on the pattern Opal proved
    // (Aug 16): a replica of Apple's dialog shown BEFORE the real one, so
    // nothing arrives cold, plus a trust list of what Konvo cannot see.
    // Every claim in that list is structural fact, not copy: the tokens
    // are opaque, there is no DeviceActivity monitor, and there is no
    // Konvo server. The real chain starts only on the button.
    function cageIntroPage() {
      // The Opal pattern, replicated Aug 16: the page is an exact echo of
      // the system dialog about to appear, ringed in accent with an arrow
      // at its Continue, so when the real one lands over this page it
      // reads as expected rather than alarming. The footer claim is
      // structural fact: the selection never leaves the device.
      return "<div class='imp-mid' style='padding:24px'>" +
        "<h2 style='font-size:26px;text-align:center'>One last step: Connect " +
        "Konvo to Screen Time, securely.</h2>" +
        "<p style='font-size:15px;line-height:1.5;color:var(--mut);margin-top:8px;" +
        "text-align:center'>To block Instagram on this iPhone, Konvo will " +
        "need your permission.</p>" +
        "<div style='border:2px solid var(--accent);border-radius:20px;padding:7px;" +
        "margin:22px auto 0;max-width:300px;width:100%'>" +
        "<div style='background:var(--icbg);border-radius:14px;padding:14px 12px 0;" +
        "text-align:center'>" +
        "<b style='font-size:14px;display:block'>&ldquo;Konvo&rdquo; Would Like to " +
        "Access Screen Time</b>" +
        "<p style='font-size:11.5px;line-height:1.4;color:var(--mut);margin-top:5px'>" +
        "Providing &ldquo;Konvo&rdquo; access to Screen Time may allow it to see " +
        "your activity data, restrict content, and limit the usage of apps " +
        "and websites.</p>" +
        "<div style='display:flex;border-top:1px solid rgba(120,120,128,.25);" +
        "margin-top:12px'>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-weight:700;" +
        "font-size:15.5px;border-right:1px solid rgba(120,120,128,.25)'>Continue</span>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-size:15.5px'>" +
        "Don&rsquo;t Allow</span></div></div></div>" +
        "<svg width='34' height='40' viewBox='0 0 34 40' fill='none' " +
        "stroke='var(--accent)' stroke-width='3' stroke-linecap='round' " +
        "stroke-linejoin='round' style='margin:10px 0 0 22%'>" +
        "<path d='M10 36 C 8 22, 12 12, 20 5'/>" +
        "<path d='M12 7 L20 5 L21 13'/></svg>" +
        "<p style='text-align:center;font-size:13.5px;line-height:1.5;" +
        "color:var(--mut);margin-top:14px'>Your information is protected by " +
        "Apple and stays 100% on your phone.</p>" +
        "</div><div class='imp-foot'>" +
        // No "Not now" since Aug 25: everyone who reaches this page has
        // paid (or holds a grant), and the shield is what they paid for.
        // The only way past is the system dialog itself - denying it still
        // proceeds, because an app cannot trap someone on an OS permission.
        "<button class='imp-btn' data-act='cage-setup-go'>Give permission</button></div>";
    }
    // S12d (Aug 22): between "Ready to block" and the perks, the wall
    // clears and the user's own inbox shows through - the thing they came
    // for, recognisable, no mockup. The copy states only what the cage
    // already does in this webview, shield or not.
    function revealPage() {
      return "<div class='imp-pill'><svg width='14' height='14' viewBox='0 0 24 24'" +
        " fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round'" +
        " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg>Instagram connected</div>" +
        "<div class='imp-sheet'><div class='imp-grab'></div>" +
        "<h2>Your DMs are still here.</h2>" +
        "<p>Feed, Reels and Explore are now hidden. Stories, profiles and " +
        "notifications still work.</p>" +
        "<button class='imp-btn' data-act='keep'>Keep Instagram like this</button>" +
        (window.__konvoFree ? "" : "<p class='imp-next'>Choose a plan next</p>") +
        "</div>";
    }
    // S12e: what the trial is FOR, immediately before the price. Three
    // claims, each one a thing the app actually does - no ratings, no user
    // count, no "heal your brain". The hours are the user's own answer,
    // carried across the origin boundary in the #konvo= fragment.
    function reclaimHours() {
      var n = 0;
      try { n = parseInt(localStorage.getItem("konvoQuiz"), 10) || 0; } catch (e) {}
      return n > 0 ? n : 0;
    }
    function impactRow(icon, title, body) {
      return "<div style='display:flex;gap:14px;align-items:flex-start;" +
        "padding:15px 0'>" +
        "<span style='flex:none;width:26px;height:26px;border-radius:9px;" +
        "background:var(--icbg);color:var(--accent);display:inline-flex;" +
        "align-items:center;justify-content:center;margin-top:1px'>" + icon +
        "</span><span style='flex:1'>" +
        "<b style='display:block;font-size:16.5px;letter-spacing:-0.015em'>" +
        title + "</b>" +
        "<span style='display:block;font-size:14.5px;line-height:1.45;" +
        "color:var(--mut);margin-top:3px'>" + body + "</span></span></div>";
    }
    function impactPage() {
      var h = reclaimHours(), td = prod().yearly.trialDays || 0;
      // Someone who is trial-ineligible must not be promised a free week.
      var head = td ? "Start your Free Week" : "Start using Konvo";
      var sub = h
        ? "reclaim " + h + " hour" + (h === 1 ? "" : "s") + " back"
        : "get your evenings back";
      return "<div class='imp-head' style='height:112px'>" +
        "<div style='position:absolute;inset:0;background:radial-gradient(circle at 50% 30%," +
        "rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 60%)'></div>" +
        "<div style='position:absolute;left:50%;top:24px;transform:translateX(-50%);" +
        "width:64px;height:64px;border-radius:18px;background:#fff;display:flex;" +
        "align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(4,30,80,.35)'>" +
        "<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' " +
        "stroke-width='2.2' stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 " +
        "0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/>" +
        "</svg></div></div>" +
        "<div class='imp-mid' style='justify-content:flex-start;padding:18px 26px 0'>" +
        "<h2 style='font-size:26px;text-align:center;line-height:1.2'>" + head +
        " and<br>" + sub + "</h2>" +
        "<div style='margin-top:14px'>" +
        impactRow(CHAT, "Stay connected",
          "Messages, requests and friends' Stories all still work.") +
        impactRow(MOON, "Reclaim your focus",
          "No feed, no Reels, no Explore. Nothing to fall into.") +
        impactRow(SHIELD, "Never get distracted",
          "There is no setting to switch off at 11pm.") +
        "</div>" + reviewCard() + "</div>" +
        "<div class='imp-foot'>" +
        "<button class='imp-btn' data-act='pay'>Continue</button></div>";
    }
    // The one review Konvo has (Aug 23): App Store, Canada, Aug 20 2026,
    // five stars, quoted word for word. The rule stands: nothing invented,
    // no claim the reviewer did not make. Replace or add only from real
    // App Store reviews.
    function reviewCard() {
      var star = "<svg width='15' height='15' viewBox='0 0 24 24' fill='#f5a623'>" +
        "<path d='M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z'/></svg>";
      return "<div style='margin:12px 0 8px;padding:14px 16px;border-radius:16px;" +
        "background:var(--chip);text-align:left'>" +
        "<div style='display:flex;gap:2px'>" + star + star + star + star + star + "</div>" +
        "<p style='font-size:15px;font-weight:700;margin-top:8px'>Best screen time app</p>" +
        "<p style='font-size:14px;line-height:1.45;color:var(--mut);margin-top:4px'>" +
        "\u201CI\u2019ve tried so many other screentime apps in the past but they never " +
        "actually worked. But using Konvo to only access my instagram messages is a " +
        "game changer trust me\u201D</p>" +
        "<p style='font-size:12px;color:var(--mut);margin-top:8px'>App Store review</p></div>";
    }

    // S14: post-purchase activation. Trial buyers get the recap and the
    // notification ask (permission requested only on the button tap, and
    // the day-12 reminder is scheduled only on grant). Lifetime gets its
    // own line and no ask - there is nothing to remind about.
    // The drawn check: scales in (im-pop) while the stroke runs tip to
    // tail (im-draw). Shared by the paid confirmation and the free
    // build's reveal.
    function drawnCheck(head, sub) {
      return "<svg width='118' height='118' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'" +
        " style='margin-bottom:38px;color:var(--accent);" +
        "animation:im-pop .5s ease-out both'>" +
        "<path d='M20 6 9 17l-5-5' stroke-dasharray='24' stroke-dashoffset='24'" +
        " style='animation:im-draw .6s ease-out .3s forwards'/></svg>" +
        "<div style='font-size:44px;font-weight:700;letter-spacing:-0.05em;line-height:1;" +
        "text-align:center'>" + head + "</div>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:16px;" +
        "text-align:center'>" + (sub || "Your messages are waiting.") + "</p>";
    }

    // The last page (Aug 22): shown only once the shield is up. The check
    // draws, a beat, then the wall fades into the inbox on its own.
    function protectedPage() {
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        drawnCheck("You're protected.",
          "Instagram is blocked. Your DMs remain available through Konvo.") +
        "</div>";
    }

    function successPage(pid) {
      var pr = prod();
      var td = pid === "konvo.pro.yearly" ? (pr.yearly.trialDays || 0)
             : pid === "konvo.pro.monthly" ? (pr.monthly.trialDays || 0) : 0;
      var recap = "";
      if (pid === "konvo.pro.lifetime") recap = "Lifetime access active.";
      else if (td) recap = "Free until " + dateIn(td) + ".";
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        drawnCheck("You're in.") +
        (recap ? "<p style='font-size:15px;font-weight:600;margin-top:14px;" +
          "text-align:center'>" + recap + "</p>" : "") +
        "</div>" +
        "<div class='imp-foot' style='padding:0 28px 40px'>" +
        "<button class='imp-btn' data-act='done'>Open my messages</button></div>";
    }

    // The shield is armed only at a successful end of the sequence: a
    // purchase or trial on paid builds, the beta grant, the free build's
    // end. A user who connects Screen Time and then declines the price
    // must walk away with Instagram exactly as it was (Aug 21; before
    // this, the block went up at the connect page, before the paywall).
    var cagePending = false;
    // Setup-only mode (Aug 21): a paying user with no shield - a reinstall
    // or a new phone - gets the Screen Time step alone, then "You're all
    // set", then the inbox. Before this the inbox opened unblocked.
    var setupOnly = false;
    // How the Screen Time step ends, wherever it ran: done arms the shield
    // and shows "You're protected"; skipped, denied or nothing picked goes
    // to the inbox as it is.
    function cageExit(done) {
      setupOnly = false;
      if (!done) { dismiss(); return; }
      armCage(function () {
        swap(protectedPage());
        setTimeout(dismiss, 2400);
      });
    }
    // The tail of every successful sequence (Aug 22): purchase, trial,
    // restore, beta grant or the free build's end lead HERE, and only now
    // does the Screen Time step run - the shield goes up after the money,
    // never before. A shield already authorised and picked (a lapsed
    // subscriber coming back) is simply re-armed. Without iOS 16 there is
    // no shield to set up, so the plain confirmation stands in.
    // A lapsed subscriber's wall says why it is there (Aug 23): the plan
    // ended and the shield is down until they pick one. Cleared by finish.
    var lapsedWall = false;
    function finish(screen) {
      lapsedWall = false;
      track("onboarding_completed", { screen_id: screen });
      try { localStorage.konvoDone = "1"; } catch (e) {}
      var td = lastBuy === "konvo.pro.yearly" ? (prod().yearly.trialDays || 0)
             : lastBuy === "konvo.pro.monthly" ? (prod().monthly.trialDays || 0) : 0;
      // The timeline promised a reminder before the charge: scheduled now
      // that the trial length is known. iOS prompts only if never asked.
      if (td) storekit("notify", String(td), function () {});
      var moved = false;
      var fallback = setTimeout(function () {
        moved = true;
        swap(successPage(lastBuy));
      }, 900);
      storekit("cageStatus", null, function (s) {
        if (moved) return;
        clearTimeout(fallback);
        if (!s || !s.supported) { swap(successPage(lastBuy)); return; }
        if (s.authorized && s.picked) { cagePending = true; cageExit(true); return; }
        try { localStorage.konvoCageAsked = "1"; } catch (e) {}
        track("cage_pitch_viewed", { screen_id: "s12f_cage" });
        swap(cageIntroPage());
      });
    }
    function armCage(then) {
      if (!cagePending) { if (then) then(); return; }
      cagePending = false;
      storekit("cageOn", null, function () {
        track("cage_enabled", {});
        markCaged();
        if (then) then();
      });
    }

    var wall = null;
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
        finish("s13_paywall");
        return;
      }
      btn.disabled = true;
      storekit("purchase", productId, function (res) {
        btn.disabled = false;
        if (res && res.ok && res.entitled) {
          setCache(true);
          lastBuy = productId;
          finish("s13_paywall");
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
    var swPending = false, swTried = false, entitlementKnown = false;
    var skipTracked = false;
    function ensure() {
      if (wall || !atInbox()) return;
      if (!setupOnly && (cached() || seenSequence())) {
        // Returning users (paid cache, or a finished/granted sequence) fire
        // login and inbox events but never remount the wall. Say so once
        // per session, or funnels read them as a post-login drop-off - the
        // Aug 25 analysis lost a day to exactly that.
        if (!skipTracked) {
          skipTracked = true;
          track("sequence_skipped", { reason: cached() ? "entitled" : "seen" });
        }
        return;
      }
      // A paying customer must never see a frame of this. On a fresh
      // install there is no cache yet, so without waiting for the receipt
      // the sequence starts underneath them and only vanishes once
      // RevenueCat answers. Hold until the verdict lands, or until the
      // timeout gives up on it.
      if (!entitlementKnown) return;
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
      if (!setupOnly && window.__konvoSW && !swTried) {
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
      // The wall follows the system now (Aug 16); the pin only matters
      // for the lapsed-subscription case where it rises over a live app.
      appearance("auto");
      try {
        if (!localStorage.konvoLoginTracked) {
          localStorage.konvoLoginTracked = "1";
          track("login_succeeded", { screen_id: "s12_connected" });
        }
      } catch (e) {}
      wall = document.createElement("div");
      wall.id = "im-pay";
      // A lapsed subscriber on an install that already finished the
      // sequence sees the price and nothing else (Aug 22): the pitch is
      // not replayed at someone who has heard it.
      var lapsed = false;
      try { lapsed = !!localStorage.konvoDone; } catch (e) {}
      lapsedWall = lapsed && !setupOnly;
      if (setupOnly) {
        try { localStorage.konvoCageAsked = "1"; } catch (e) {}
        track("cage_pitch_viewed", { screen_id: "s12f_cage", via: "reinstall" });
      }
      setPage(setupOnly ? cageIntroPage() : lapsed ? "" : PAGES.connected);
      wall.addEventListener("click", function (e) {
        var t = e.target.closest("[data-act]");
        if (!t || !wall) return;
        var act = t.getAttribute("data-act");
        if (act === "pk-y" || act === "pk-m" || act === "pk-l") {
          var plan = act.slice(3);
          track("plan_selected", { plan: plan === "y" ? "annual"
            : plan === "m" ? "monthly" : "lifetime", screen_id: "s13_paywall" });
          setPage(pay(plan), true);
        } else if (act === "welcomed") {
          // Free build: the sequence is done, and it does not come back.
          try { localStorage.setItem("konvoWelcomed", "1"); } catch (e) {}
          finish("s12c_delete");
        } else if (act === "keep") {
          wall.classList.remove("im-reveal");
          swap(perksPage());
        } else if (act === "cage-setup-go") {
          // One flight at a time: Apple's consent dialog sits over the
          // page and a user who keeps tapping the button underneath
          // fired this chain eleven times in a row (field report,
          // Aug 17). Re-armed when the chain resolves either way.
          if (window.__konvoCageBusy) return;
          window.__konvoCageBusy = true;
          // Apple's Screen Time sheet takes its time to appear; the tap is
          // acknowledged at once so nobody taps twice or wonders.
          t.disabled = true;
          storekit("cageAuthorize", null, function (a) {
            track("cage_authorized", { granted: !!(a && a.authorized) });
            window.__konvoCageBusy = false;
            if (!a || !a.authorized) { cageExit(false); return; }
            storekit("cagePick", null, function (p) {
              var n = (p && p.count) || 0;
              track("cage_picked", { count: n });
              if (!n) { cageExit(false); return; }
              // Picked, not armed: the shield waits for the sequence to
              // end well (see armCage). The selection is stored natively.
              cagePending = true;
              storekit("notify", null, function () { cageExit(true); });
            });
          });
        } else if (act === "impact") {
          track("impact_viewed", { screen_id: "s12e_impact" });
          swap(impactPage());
        } else if (act === "pay") {
          track("paywall_viewed", { variant: "default", screen_id: "s13_paywall" });
          swap(pay("y"));
        } else if (act === "betafree") {
          // Beta only: unlock without charging, and record that the price
          // was seen and declined - which is the whole point of showing it.
          track("beta_free_taken", { via: "escape", screen_id: "s13_paywall" });
          grantBeta();
          finish("s13_paywall");
        } else if (act === "buy-y") {
          buy(t, "konvo.pro.yearly");
        } else if (act === "buy-m") {
          buy(t, "konvo.pro.monthly");
        } else if (act === "buy-l") {
          buy(t, "konvo.pro.lifetime");
        } else if (act === "restore") {
          // Sync then re-read entitlements; unlocking straight to the
          // inbox - a restorer is returning, not starting a trial.
          // A restorer is returning, not starting a trial - but on this
          // phone the shield may not exist yet, so the tail still runs.
          storekit("restore", null, function (res) {
            if (res && res.entitled) { setCache(true); finish("s13_paywall"); }
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
      var payShown = false;
      var showPay = function () {
        if (payShown || !wall) return;
        payShown = true;
        track("paywall_viewed", { variant: "default", screen_id: "s13_paywall", via: "lapsed" });
        setPage(pay("y"));
      };
      storekit("products", null, function (res) {
        if (res && res.ok) P = res;
        if (lapsed) showPay();
      });
      if (setupOnly) return;
      // Live prices first when they arrive in time; the stand-ins after.
      if (lapsed) { setTimeout(showPay, 1500); return; }
      setTimeout(function () {
        swap(loaderPage(), tickRows);
      }, 1800);
      setTimeout(function () {
        // Screen Time setup before the sell (Aug 16): a supported build
        // goes loader -> connect -> perks. konvo-free included since
        // Aug 17 - the block ships free in v1.0 (pricing deferred, so a
        // free TestFlight and App Store build still carries the
        // centerpiece). iOS 15 and a bridge that never answers land on
        // perks; the timeout is the hung-bridge fallback, and a MISSING
        // bridge (macOS) answers null instantly through storekit's catch.
        // The reveal (Aug 22): straight from the loader, the wall clears
        // over the user's own inbox. The Screen Time step moved to the
        // tail of the sequence (finish), after the money.
        track("inbox_reveal_viewed", { screen_id: "s12d_reveal" });
        swap(revealPage(), function () { if (wall) wall.classList.add("im-reveal"); });
      }, 6200);
    }

    // ── The five-minute pass (locked Aug 16) ────────────────────────────
    // Once a day, reason first, and it relocks itself: DeviceActivity
    // counts five minutes of Instagram use and the monitor extension
    // re-raises the shield with Konvo dead. Bounded autonomy is what
    // keeps the block installed past the first story someone needs to
    // post. The reason is a category enum and never free text; it is the
    // only payload the event carries.
    // markCaged flips the button on: called at boot when the cage is
    // already active, and directly after setup succeeds - the first
    // session bug (Aug 16) was relying on boot alone, which had already
    // answered "no cage" before onboarding enabled it, and the SPA never
    // loads another document to ask again.
    var passAvail = false;
    // What the sheet shows comes from cageStatus (PassPolicy is the one
    // source of truth); these are only the bridge-absent defaults.
    var passMins = 5, passLeft = 2;
    var markCaged = function () {};
    if (isPhone) {
      var passStyle = document.createElement("style");
      // Light by default, dark under the media query: the sheet shipped
      // hardcoded dark and looked wrong on a light-mode phone (field
      // report, Aug 17). Blue button and the grays read fine on both.
      passStyle.textContent =
        '#im-pass{display:none;position:fixed;right:16px;bottom:136px;width:44px;' +
        'height:44px;border-radius:50%;background:rgba(255,255,255,.94);color:#1c1c1e;' +
        'z-index:2147483000;align-items:center;justify-content:center;border:0;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.18)}' +
        'html.im-inbox.im-caged #im-pass{display:flex}' +
        '#im-pass-sheet{position:fixed;inset:0;z-index:2147483200;display:flex;' +
        'align-items:flex-end;background:rgba(0,0,0,.45)}' +
        '#im-pass-card{width:100%;background:rgba(242,242,247,.98);color:#1c1c1e;' +
        'border-radius:20px 20px 0 0;padding:22px 20px 34px;' +
        'font-family:-apple-system,system-ui,sans-serif}' +
        '#im-pass-card h3{margin:0;font-size:19px;font-weight:700;' +
        'line-height:1.35;letter-spacing:-0.01em;color:inherit}' +
        '#im-pass-card .im-pr{display:block;width:100%;text-align:left;margin-top:10px;' +
        'padding:14px 16px;border:0;border-radius:14px;background:rgba(120,120,128,.12);' +
        'color:#1c1c1e;font-size:16px;font-family:inherit}' +
        '#im-pass-card .im-pr.on{box-shadow:inset 0 0 0 2px rgba(10,132,255,1)}' +
        '#im-pass-card .im-go{display:block;width:100%;margin-top:16px;padding:15px 0;' +
        'border:0;border-radius:999px;background:rgba(10,132,255,1);color:#fff;' +
        'font-size:16.5px;font-weight:700;font-family:inherit}' +
        '#im-pass-card .im-go[disabled]{opacity:.4}' +
        '#im-pass-card .im-x{display:block;width:100%;margin-top:10px;padding:10px 0;' +
        'border:0;background:none;color:rgba(142,142,147,1);font-size:15px;' +
        'font-family:inherit}' +
        '#im-pass-card p{margin:8px 0 0;font-size:13.5px;' +
        'color:rgba(142,142,147,1);line-height:1.4}' +
        '@media (prefers-color-scheme: dark){' +
        '#im-pass{background:rgba(38,38,38,.92);color:#f5f5f7;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
        '#im-pass-card{background:rgba(28,28,30,.98);color:#f5f5f7}' +
        '#im-pass-card .im-pr{background:rgba(255,255,255,.08);color:#f5f5f7}' +
        '}';
      (document.head || document.documentElement).appendChild(passStyle);
      var passBtn = document.createElement("button");
      passBtn.id = "im-pass";
      passBtn.setAttribute("aria-label", "Five minute pass");
      passBtn.innerHTML =
        "<svg width='22' height='22' viewBox='0 0 24 24' fill='none'" +
        " stroke='currentColor' stroke-width='2' stroke-linecap='round'" +
        " stroke-linejoin='round'>" +
        "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 3'/></svg>";
      (document.body || document.documentElement).appendChild(passBtn);
      markCaged = function () {
        document.documentElement.classList.add("im-caged");
        passAvail = true;
        passLeft = 2;
      };
      storekit("cageStatus", null, function (s) {
        if (s && s.active) {
          markCaged();
          passAvail = !!s.passAvailable;
          passMins = s.passMins || 5;
          passLeft = s.passesLeft != null ? s.passesLeft : (passAvail ? 2 : 0);
        }
      });
      passBtn.addEventListener("click", function () {
        // "Reply to someone" was a reason in the first cut and made no
        // sense - replies live in Konvo. Calls do not (documented trade),
        // so calling is exactly what the pass is for.
        var REASONS = [["story", "Post a story"], ["call", "Call someone"],
          ["post", "Post a picture or Reel"], ["other", "Something else"]];
        var opts = "";
        for (var i = 0; i < REASONS.length; i++) {
          opts += "<button class='im-pr' data-r='" + REASONS[i][0] + "'>" +
            REASONS[i][1] + "</button>";
        }
        var sheet = document.createElement("div");
        sheet.id = "im-pass-sheet";
        sheet.innerHTML = "<div id='im-pass-card'>" + (passAvail
          ? "<h3>Why do you want to unlock Instagram?</h3>" + opts +
            "<button class='im-go' disabled>Unlock for " + passMins +
            " mins</button>" +
            "<p>Unlocks left: " + passLeft + " (" + passMins +
            (passLeft > 1 ? " mins each)" : " mins)") + "</p>"
          : "<h3>No pass left today</h3>" +
            "<p>They come back tomorrow.</p>") +
          "<button class='im-x'>Close</button></div>";
        var reason = "";
        sheet.addEventListener("click", function (e) {
          var r = e.target.closest(".im-pr");
          if (r) {
            reason = r.dataset.r;
            var rs = sheet.querySelectorAll(".im-pr");
            for (var j = 0; j < rs.length; j++) rs[j].classList.remove("on");
            r.classList.add("on");
            var go = sheet.querySelector(".im-go");
            if (go) go.disabled = false;
            return;
          }
          var go2 = e.target.closest(".im-go");
          if (go2 && !go2.disabled && reason) {
            storekit("cagePass", null, function (res) {
              if (res && res.granted) {
                track("pass_used", { reason: reason, mins: passMins });
                // cageStatus corrects this on the next launch either way.
                passLeft = Math.max(passLeft - 1, 0);
                passAvail = passLeft > 0;
              }
              if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
            });
            return;
          }
          if (e.target.closest(".im-x") || e.target === sheet) {
            if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
          }
        });
        (document.body || document.documentElement).appendChild(sheet);
      });
    }

    // Verify at every launch; the verdict beats the cache in both
    // directions. No reply (bridge missing, StoreKit unreachable offline)
    // changes nothing - the cache carries a paying user through airplane
    // mode, and a fresh user has no cache to be wrongly unlocked by.
    // The verdict gates the sequence (see ensure). A missing bridge answers
    // null immediately; a bridge that never replies is covered by the
    // timeout, so a hung StoreKit cannot lock a new user out of onboarding.
    storekit("entitlements", null, function (res) {
      entitlementKnown = true;
      if (!res) return;
      setCache(!!res.entitled);
      if (res.entitled) {
        dismiss();
        // Once per install: the flag lives in this origin's storage,
        // which a delete wipes along with the shield's authorization.
        var asked = false;
        try { asked = !!localStorage.konvoCageAsked; } catch (e) {}
        if (!asked) {
          storekit("cageStatus", null, function (s) {
            if (s && s.supported && !s.active) { setupOnly = true; ensure(); }
          });
        }
      } else {
        // A lapsed subscription must not hold Instagram hostage: lift the
        // cage unless beta access still covers it. cageOff is a no-op when
        // no cage was ever set.
        try {
          if (!localStorage.konvoBetaFree) storekit("cageOff", null, function () {});
        } catch (e) {}
      }
    });
    setTimeout(function () { entitlementKnown = true; }, 2500);
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
