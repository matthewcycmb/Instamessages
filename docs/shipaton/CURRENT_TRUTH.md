# Current truth (verified 2026-09-03)

Every number here was pulled live in this session. Provenance block per figure. Timezone UTC unless noted. Internal and test users: Apple review machines excluded by the project test-account filter (app events with a build number, country US, city Cupertino or empty state), replicated as a NOT IN subquery in SQL; Matthew's own device is not excluded (no marker exists).

## 1. Product state

- App Store: iOS versions 1.0.0 (live 2026-08-21), 1.1.0, 1.2.0, 1.3.0, 1.4.0, 1.5.0 (live 2026-09-02), all READY_FOR_SALE; Mac 1.2.0 and 1.3.0. Source: ASC API appStoreVersions, 2026-09-03 02:20 UTC. Name "Konvo: DMs Only", subtitle "Reduce Screen Time".
- Products: konvo.pro.yearly ($19.99, 7-day trial) APPROVED, konvo.pro.monthly ($6.99, 3-day trial per handoff) APPROVED, konvo.pro.lifetime MISSING_METADATA (never sold). Source: ASC subscriptionGroups and inAppPurchasesV2.
- Build in tree: 1.5.1 build 102, built and verified, not uploaded. Git branch konvo-onboarding-v2, 137 commits, first commit 2026-07-21.
- Repo: github.com/matthewcycmb/Instamessages is PUBLIC, no LICENSE, README stale (describes the cage in lib.rs and a /testers page).

## 2. Architecture (file references)

- Tauri 2 host, one WKWebView on instagram.com. `wrapper/src-tauri/src/lib.rs:19` embeds `cage.js` as the initialization script (document start, line 142). `lib.rs:27` `allowed()` permits all http, https, about, data, blob and tauri navigation: the Rust layer gates nothing on the feed; the cage is enforced in the page. User agent is Safari for the platform (`lib.rs:55` onward; iPhone UA on iOS).
- Blocking policy is a URL block-list, `cage.js:550`: `/^\/$/`, `/^\/reels(\/|$)/`, `/^\/reel\/?$/`, `/^\/explore(\/|$)/`, `/^\/[A-Za-z0-9._]+\/(reels|tagged|saved)(\/|$)/`. Anything matching is sent to `/direct/inbox/` (`cage.js:1075`, `1111`). The remote patch (`public/cage-patch.json`, read at `cage.js:1424`, cached in `localStorage.konvoPatch`) may add `hide` selectors, raw `css`, and `block` regexes (`cage.js:1395`, `1402`); remote JavaScript is not supported.
- Deliberately open, by design and documented in code comments (`cage.js:531` to `547`): stories viewing (`/stories/`), profiles, single posts (`/p/<code>`), the single-reel permalink (`/reel/<code>/`), notifications heart. In-app copy says "Feed, Reels and Explore are now hidden. Stories, profiles and notifications still work." (`cage.js:106`). Hidden by CSS (`cage.js:1536` to `1568`): the inbox back chevron, Message Requests link, the "New post" and "Create" entries, plus language-proof selectors.
- Screen Time: FamilyControls, ManagedSettings, DeviceActivity in `KonvoStore.swift` plus the ShieldConfig, ShieldAction and ActivityMonitor extensions; the shield is opt-in from the inbox lock button (decision 2026-09-01), two passes per day.
- Native bridge: `window.webkit.messageHandlers.konvoStore` (`cage.js:29`), commands include entitlements, products, purchase, restore, rcPaywall, notify, invite, claim, cookieSave, track.
- Site (Next.js on Vercel): invite API (Upstash Redis, RevenueCat REST with a server-only secret), push heartbeat (`.github/workflows/push-tick.yml`, APNs), `cage-patch.json`.

## 3. Login and session (what the events mean)

- Signed-in state is the `ds_user_id` cookie (`cage.js:719`). `login_succeeded` fires when that cookie appears after the login chain (`cage.js:3031`). `session_restored` covers a returning session.
- `login_tap` records the button label and stage; it checks only that the password field is non-empty (`cage.js:744` to `745`, `pw && pw.value`), never the value. `login_error` classifies dialog text into wrong_password, no_account, two_factor_code, rate_limited, challenge, generic, other (`cage.js:720`). `login_left` and `login_step` carry the stage (login, reset, signup, challenge).
- `login_submitted` only exists since the Sep 1 builds (cage.js:695 to 705: Instagram's Log in is a React button, so the earlier form-submit listener recorded zero since launch; a tap with a non-empty password field is now the submit). 30 people have fired it, against about 139 sign-ins since Sep 1; one-tap "Continue as" logins and the keyboard Go key are the likely uncounted paths (unverified). Treat "attempts" as `login_started` people, and failures as `login_error` plus people with `login_started` and no `login_succeeded`.
- Cookies live in the WKWebView's default store; a snapshot of the cookies (name, value, domain, path, expiry) is written as a binary plist to Application Support (`KonvoStore.swift:786` to `806`) so a force-quit cannot lose the session and so background badge checks can run. No Keychain use. No explicit file protection attribute (iOS default applies).
- Handled: password reset (Instagram's own page, with a way back), challenge and 2FA pages (passed through; Rust allows cross-domain hops, `lib.rs:20` comment), cookie consent. Not handled explicitly: network loss during login (Instagram's page shows its own error), timeouts.

## 4. Privacy claims against code

| Claim | Verdict | Evidence |
|---|---|---|
| Konvo never sees or stores your password | Supported | Only `pw.value` truthiness is read (`cage.js:745`); no password in any track() or storage. |
| Konvo does not read, store or transmit your messages | Supported | No selector reads message bodies; `inbox_ready` counts thread links only (`cage.js:1188`). |
| Your data stays on Instagram's servers | Partly supported | Session cookies are snapshotted on device; the Instagram user id and username are sent once to PostHog as person properties (`cage.js:1202` to `1207`, `$set ig_user_id, ig_username`); the handle is stored in `localStorage.konvoHandle` and sent to the invite API as the invite code. |
| Konvo collects nothing / everything stays on device | Not supported | PostHog events (build, net, platform, lang, variant, screen ids), RevenueCat anonymous id, UserJot feedback SDK identified with the same id (`KonvoStore.swift:98` to `103`). |

Third-party SDKs in the iOS app: RevenueCat, RevenueCatUI, SuperwallKit, UserJot. Undocumented Instagram endpoints used: `/api/v1/direct_v2/get_badge_count/` (`cage.js:1466`, also natively for background refresh) and `/api/v1/accounts/current_user/`, `/api/v1/users/<id>/info/` (`cage.js:2754` to `2756`), all with the web app id header `936619743392459`.

## 5. RevenueCat implementation

- `Purchases.configure(withAPIKey: "appl_...")` (`KonvoStore.swift:92`), anonymous app user id, entitlement `Pro`, offering `current`, packages by product id.
- `products`: live localized prices, per-week and per-month framing, honest save percent, `trialDays` only when `checkTrialOrIntroDiscountEligibility` returns eligible (`KonvoStore.swift:833`). `purchase`: userCancelled, paymentPendingError (Ask to Buy) and error branches (`KonvoStore.swift:981` to `999`); `restore` (`1003`); `entitled()` via cached customerInfo (`1083`).
- RevenueCatUI `PaywallViewController` path behind the `rcPaywall` patch flag (`1038`, `1330`); Superwall configured with a RevenueCat purchase controller (`56` to `75`), not rendering paywalls. UserJot identified with the RevenueCat id.
- Promotional entitlements (`rc_promo_Pro_three_day`) granted by the site for invite claims; 4 real friends by 2026-09-03 00:25 UTC (ids 4d480925, c3f65f17, e3f12f8f, 050bc272); smoke-test ids excluded.
- Webhooks to PostHog share the person with app events. Customer Center: not present. Win-back offers: not present.
- Known past defect, fixed: the paywall gate required all three products, lifetime never returned by the store, every 1.3.0 store user saw "Loading your plans" (fixed in 1.4.0 build 82 with a regression test).

## 6. Analytics (launch to date)

Query A, execute-sql, run 2026-09-03 04:05:13 UTC, window timestamp >= 2026-08-20 (data starts 2026-08-21), unique persons, Apple excluded:

| Metric | People | Definition |
|---|---|---|
| app_opened | 658 | app foreground event, fires on every open; NOT installs or downloads |
| login_started | 641 | reached Instagram's login page |
| login_submitted | 30 | unreliable, see section 3 |
| login_succeeded | 443 | ds_user_id cookie appeared after the login chain |
| login_error | 13 | classified dialog seen |
| inbox_ready | 463 | inbox settled (includes restored sessions) |
| paywall_viewed | 399 | hard paywall shown after the inbox reveal |
| rc_trial_started_event | 68 | RevenueCat webhook, yearly trial |
| rc_initial_purchase_event | 4 | monthly bought outright |
| rc_trial_converted_event | 6 | trial billed |
| rc_trial_cancelled_event | 38 | auto-renew turned off during trial |
| rc_expiration_event | 3 | trial ended without conversion |
| thread_opened | 119 | opened a chat |
| cage_error | 1 | caught exception in the cage |
| gross USD | 164.12 | sum of revenue on converted and initial purchase events, store APP_STORE |

Ordered funnel (query-funnel, 2026-08-21 to 2026-09-03, 1-day window, ordered, test filter on, run 02:25 UTC): login_started 635, login_succeeded 432 (68.0%), paywall_viewed 392, rc_trial_started_event 67 (10.6%), onboarding_completed 63.

Trial maturity: trials started 2026-08-24 to 08-26 (8 people) are the only cohort past 7 days; 6 converted. Trials from 08-30 onward (57) are immature until 09-06 or later. D1 and D7 retention: not valid yet for the 08-31 cohort (482 of 658 arrived 08-31 to 09-02); return-day distribution among signed-in people (run 02:25 UTC): 376 one day, 44 two, 12 three, 8 four or more.

RevenueCat dashboard (read 2026-09-03 02:30 UTC, project cce508b7): Active Trials 60, Active Subscriptions 10, MRR $42, Revenue $164 (28 days), New Customers 748, Active Customers 914 (28 days). New Customers counts every SDK install including reinstalls and review devices.

App Store: 10 written reviews, all 5 stars (ASC customerReviews, 02:20 UTC); public ratings CA 8 at 5.0, HK 2, DE 1 (iTunes lookup). Downloads: UNKNOWN (ASC analytics report request 75e30231, no instances at 04:05 UTC).

Countries of signed-in people (login_succeeded, geoip on app events): CA 68, IN 52, US 46, FR 41, HK 27, AU 23, GB 17, KR 14, SG 11, DE 9.

Growth curve (first app_opened per person, Pacific dates): 10, 17, 4, 21, 26, 22, 19, 13, 12, 32 for Aug 21 to 30; 280 on Aug 31 (LinkedIn post per Matthew, link pending); 130 Sep 1; 72 Sep 2.

Crash or error monitoring: none (PostHog exception capture off; no crash SDK). Device and OS split: not queried (no property). Acquisition source: the attribution quiz was removed on Sep 1; only App Store campaign links remain (ASC web UI).

## 7. Tests

`wrapper/test/test_cage.js` boots a jsdom page at each leak path ('/', '/?variant=following', '/reels/', '/explore/', '/p/abc/', '/tv/xyz/', stories, posts) and asserts the bounce or the wall (line 85 onward); about 67 assertions, 10 minutes. `test_onboarding.js` about 33 assertions (language tables, no em dashes, screen order). `test_bridge.js` 2. Not covered: real Instagram DOM (fixtures are hand-written), login error classification against real dialog text, RevenueCat branches (Swift has no tests), background refresh.

## 8. Unknowns and unsupported claims

- Downloads and installs: unknown until the ASC report lands.
- "1000+ users love Konvo" (dist/proof.png): unsupported by any source read.
- Screen time reduction for users: only self-reports in reviews; Matthew's own before/after is self-reported until Screen Time screenshots exist.
- The LinkedIn post and the brain dump document: not yet provided.
- Whether Instagram's terms permit the wrapper: legal question, not answerable here.
