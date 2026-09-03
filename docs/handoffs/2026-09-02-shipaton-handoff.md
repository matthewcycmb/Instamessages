# Konvo handoff for the RevenueCat Shipaton 2026 submission

Written 2026-09-02 (evening PDT) at the end of a long session. Audience: a fresh Claude Code session in this repo whose only job is to make Matthew's Shipaton submission as strong as possible. Everything below is verified in that session unless marked "unverified".

## Standing rules from Matthew (non-negotiable)

- Never commit or push unless he says so. `main` deploys the public site (konvoinstall.com) on push.
- No em dashes in anything a user reads. Every visible word is his: propose copy, get approval, use it verbatim.
- Never invent social proof, counts, ratings or quotes. Every number in the submission must trace to PostHog, App Store Connect or RevenueCat.
- Use the absolute path `/Users/matthewchan/Instamessages/wrapper` for every wrapper command. Builds and the cage suite run under `nohup` with a log you poll. Long builds finish in about 10 minutes.
- Verify the built IPA, never the source or the log. Never ship a cage selector that was not checked on Instagram's live DOM on a device.
- Do everything you can with your own tools (PostHog MCP, ASC API, curl) before asking him.
- Persistent memory for this project lives in `/Users/matthewchan/.claude/projects/-Users-matthewchan-Instamessages/memory/` (index in `MEMORY.md`). Read it first.

## What Konvo is

Konvo is an iOS app (also Mac App Store and a Chrome extension) that shows only your Instagram DMs and blocks the feed, Explore and Reels. Positioning on the store: "Konvo: DMs Only", subtitle "Reduce Screen Time", category Productivity. App Store id 6794756261, bundle `com.matthewchan.konvo`, seller shown as Yi Hyun Park. Store link: https://apps.apple.com/app/id6794756261. Site: https://konvoinstall.com.

How it works: a Tauri 2 app whose only screen is a WKWebView on instagram.com. An injected script (`wrapper/src-tauri/src/cage.js`, "the cage") runs at document start on every page and hides or bounces everything that is not `/direct/*` or login, draws the onboarding "wall" over the inbox, and talks to native Swift through a message bridge. A Screen Time extension set (ShieldConfig, ShieldAction, ActivityMonitor) can block the real Instagram app with a lock button from the inbox. The person signs in with their real Instagram password on Instagram's own login page, framed by a drawn Safari-style sheet. Konvo never sees the DMs or the password; everything stays on Instagram's servers.

Story: Matthew built it for himself (repo started 2026-07-21, pivoted from an official-API DM client on 2026-07-23 to the wrapper), shipped iOS 1.0.0 on 2026-08-21, relaunched 1.5.0 on 2026-09-02 and started promoting on Instagram, TikTok and X that day.

## Shipaton 2026 facts (from the Devpost page, fetched 2026-09-02)

- Window: apps first released between Aug 1 and Sep 30, 2026. Submission deadline Sep 30, 2026, 11:45 PM PDT.
- Eligibility check done: App Store version history shows 1.0.0 released Aug 21, 2026 (1.1.0 Aug 24, 1.2.0 to 1.5.0 Aug 30 to Sep 2). Mac App Store versions 1.2.0 and 1.3.0 were created Aug 24. Nothing was live before Aug 1. Eligible.
- Required deliverables: text description; demo video max 2 minutes, on a device, public on YouTube or Vimeo, must show the paywall or purchase; store URL; 1024 by 1024 icon; screenshot at least 1179 by 2556 with no device frame; judge access to the purchase (the 7-day trial covers this, an App Store offer code is the alternative); the app must use the RevenueCat SDK for at least one purchase (it does).
- Categories where Konvo fits: Grand Prize ("most user traction and growth momentum during the event", judges want the post-release growth story), HAMM ("smartest use of RevenueCat to drive real revenue"), RevenueCat Design Award (craft, animation), #BuildInPublic (the development journey shared on social media), Peace Prize (social good, screen time). Pick the one where it stands out most; the codelab says single-purpose apps with monetization from day one win.
- Sources: https://revenuecat-shipaton-2026.devpost.com/ and https://revenuecat.github.io/codelabs/shipaton-2026-prep.html

## Repo map

```
/Users/matthewchan/Instamessages
  app/, lib/, public/           Next.js site on Vercel (konvoinstall.com). Deploys from main only; branch pushes are previews.
    app/i/[handle]/             Invite landing page ("<handle> sent you 3 free days of Konvo"), Get Konvo copies the link to the clipboard
    app/api/invite/*            register, sent, claim, status, tap (Upstash Redis via lib/push-store.ts; RevenueCat REST via lib/invite.ts)
    lib/invite-rules.ts         CAP=3 friends per code, 3 free days each, sender gets nothing
    lib/links.ts                APP_STORE_URL with the campaign token pt=129211722
    public/cage-patch.json      Live patch channel: edit + push, the app reads it within 60 s, no release needed ({} today)
  wrapper/                      The iOS/macOS app (Tauri 2 + wry WKWebView)
    src-tauri/src/cage.js       The whole product logic: cage, onboarding wall, paywall, login sheet, invite, notifications page, analytics
    src-tauri/gen/apple/Sources/instamessages-wrapper/KonvoStore.swift   Native bridge: RevenueCat, StoreKit, Screen Time, cookies, notifications, share sheet, invite claim
    src-tauri/gen/apple/{ShieldConfig,ShieldAction,ActivityMonitor}/     Screen Time extensions
    dist/index.html             Pre-login onboarding (quiz s1..s11, trust pages s10 and s10b) with fr / zh-Hant / ko tables
    test/test_cage.js           jsdom suite for cage.js (about 10 min; run it in the background)
    test/test_onboarding.js, test/test_bridge.js   fast suites
    scripts/                    asc.sh + asc-jwt.js (App Store Connect API), install-dev.sh, verify-ipa.py, ship.sh, store-swap.sh, ExportOptions plists
  docs/superpowers/plans/       Implementation plans (invite loop plan is annotated with the final rule)
  docs/handoffs/                This file
```

Version and build number live in six places: `wrapper/src-tauri/tauri.conf.json`, `wrapper/src-tauri/gen/apple/project.yml` (four targets), and the four `Info.plist` files. Today: 1.5.1 build 102 in the tree (uncommitted state described below).

## RevenueCat integration, exactly

- SDK: `Purchases.configure(withAPIKey: "appl_...")` in `KonvoStore.swift`. Entitlement `Pro`, offering `default`, packages $rc_annual / $rc_monthly / $rc_lifetime.
- Products: `konvo.pro.yearly` $19.99 with a 7-day free trial, `konvo.pro.monthly` $6.99 with a 3-day trial, `konvo.pro.lifetime` $79.99 exists in ASC but is MISSING_METADATA and has never been returned by the store or sold. The paywall gate only requires the sold products.
- Bridge commands the page uses: `entitlements`, `products` (prices, per-week framing, trial days), `purchase`, `restore`, `rcPaywall` (RevenueCat Paywalls presented natively when the cage patch sets `rcPaywall: true`; result tracked as `rc_paywall`), `notify` (permission plus the "trial ends in 2 days" local reminder), `invite` (share sheet), `claim` (friend pastes the invite link at the paywall).
- Promotional entitlements: the invite loop grants friends 3 days through the REST API, `POST /v1/subscribers/{id}/entitlements/Pro/promotional {duration:"three_day"}` (GET the subscriber first or it 404s). Secret key is `REVENUECAT_SECRET_KEY` on Vercel prod and preview.
- RevenueCat webhook to PostHog: events `rc_trial_started_event`, `rc_trial_cancelled_event`, `rc_trial_converted_event`, `rc_initial_purchase_event`, `rc_expiration_event`, `rc_cancellation_event`, `rc_billing_issue_event`. They share the PostHog person with the app's events. Caveats: their timestamp is `purchased_at` and can sit in the future (Apple bills renewals early); their geoip is RevenueCat's server (always US), never use it for country; one subscription can appear under two anonymous ids (alias), match cancels to starts on `expiration_at`.
- Superwall SDK is also present, configured with a RevenueCat purchase controller, not rendering paywalls.
- Sandbox: dev sideloads use the real sandbox store. Sandbox testers are in ASC; purchase history is cleared with `scripts/asc.sh POST ../v2/sandboxTestersClearPurchaseHistoryRequest`.
- Not built, discussed: Apple win-back offers for lapsed trials, a weekly plan, freemium (parked until the friend-join rate is known).

## The onboarding chain as of 1.5.0 build 101 (live) and 1.5.1

1. Quiz and story screens s1 to s8 in `dist/index.html` (where did you hear about Konvo, hours per day, etc.), the 1000+ proof image on s9t, two privacy pages (s10, then s10b "Before you sign in." with three caps lines: WE NEVER SEE YOUR DMS, WE DO NOT COLLECT YOUR PASSWORD, YOUR DATA STAYS ON INSTAGRAM'S SERVERS; 1.5.1 adds "Have your Instagram password ready").
2. Instagram's real login page inside the drawn sheet (lock, live host, Passwords-key tip, reset route with a way back). Events: `login_started`, `login_submitted`, `login_error` (enum only), `login_left`, `login_succeeded`.
3. After sign-in the wall shows the "Ready to block" pitch, then the wall clears to reveal the person's own inbox (`inbox_reveal_viewed`), the impact page (`impact_viewed`), then the hard paywall (`paywall_viewed`, `plan_selected`, no close button).
4. After a purchase or trial: the notifications page ("Enable notifications for messages?", holds until iOS answers, `notify_answered`), then "Send Konvo to 3 friends" as its own page (`invite_page_viewed`, `invite_sent`, `invite_link_copied`), then "You're in" (`onboarding_completed`), then the inbox.
5. Rating prompt (`review_asked`) once per install after the person is in, opened a chat, and returns to the inbox.
6. 1.5.1 adds `purchase_result` after every buy tap: plan plus result in {purchased, cancelled, pending, error, not_entitled, no_bridge}.

## Statistics (Aug 21 to Sep 2 2026, Apple review traffic excluded)

| | People |
|---|---|
| Opened Konvo | 652 |
| Reached the Instagram login | 635 |
| Signed in | 440 (68% of the login page) |
| Saw the paywall | 396 |
| Started a trial | 68 |
| Trials cancelled | 38 |
| Trials converted to paid | 6 |
| Bought outright (no trial) | 4 |
| Gross revenue reported by RevenueCat events | $164.12 |
| Opened at least one chat | 119 |

Rates: 11% of people who reached the login page start a trial or buy (RevenueCat's hard-paywall median is 10.7%). 18% of paywall viewers buy. The launch cohort cancelled 27 of 33 trials within the first hour (median 6 minutes); on Sep 2 with build 101 it was 1 of 8 (small sample). Notifications opt-in on the new page: 3 of 4 on day one. Sign-in on the drawn-sheet builds is about 75% against 62% on the old store builds (small sample). Login errors are not a factor (about 4 people lost since launch); the loss at the login page is people who never type (about a third of strangers everywhere; Canada, Matthew's own network, signs in at 81%).

Traffic: about 20 new people a day until Aug 31, when 263 arrived in one day (build 78) and 191 the next. Downloads are not in PostHog; App Store Connect App Analytics has them, and the campaign links attribute installs per channel there.

Older baseline (Sep 1, given to an advisor): 656 opens, 367 signed in, 60 trials, 5 converted, 9 paying, $144 gross; payers averaged 305 chats opened, cancellers 2.8.

## How to pull stats

- PostHog project 569146 "Konvo Launch", MCP server `posthog-konvo` (use `exec` with `info <tool>` then `call`). Dashboards: "Konvo 1.5.0 launch (from Sep 2)" https://us.posthog.com/project/569146/dashboard/2059658 (11 tiles, every one starts 2026-09-02, test accounts filtered) and the older "Konvo launch" https://us.posthog.com/project/569146/dashboard/2018084.
- A project-wide test-account filter now excludes Apple's review machines (US events from Cupertino or with no state, app events only). Keep `filterTestAccounts: true` on every query; it is the default for new insights.
- Key funnel (SQL or `query-funnel`, ordered, 1-day window): `login_started` (not `app_opened`, which can fire after it) -> `login_succeeded` -> `paywall_viewed` -> `rc_trial_started_event` OR `rc_initial_purchase_event` -> `onboarding_completed`.
- Chat health: `thread_opened` and `thread_ready` (rows 0 at the 10 s cap means a stuck skeleton). Screen funnel: `onboarding_screen_viewed` by `screen_id`. Attribution quiz: `attribution` by `source`. Invite loop: `invite_page_viewed`, `invite_sent`, `invite_link_tapped` (site), `invite_claimed`, `invite_friend_joined`, `referral_days_granted`.
- App Store Connect: `wrapper/scripts/asc.sh GET|POST|PATCH <path relative to /v1/>` (key in `~/.appstoreconnect/private_keys/AuthKey_F9Z3VFTX73.p8`; issuer id inside `asc-jwt.js`). Downloads and campaign attribution are in App Analytics in the ASC web UI (no API for them here).
- RevenueCat dashboard: log in as Matthew; the MCP has no RevenueCat tool. Revenue in PostHog is `properties.revenue` on the rc_ events.

## Growth assets already in place

- Campaign links (Apple attributes installs, downloads and revenue per campaign in App Analytics): `https://apps.apple.com/app/apple-store/id6794756261?pt=129211722&ct=instagram&mt=8`, same with `ct=tiktok` and `ct=x`. Plain short link: `https://apps.apple.com/app/id6794756261`. The appstore.com name links do not resolve for this app.
- Invite loop: every buyer sees "Send Konvo to 3 friends"; a friend who pastes the link at the paywall gets 3 free days (RevenueCat promotional entitlement), 3 friends per code, sender gets nothing. Landing page konvoinstall.com/i/<handle>. `{"invite": false}` in the cage patch hides it.
- TestFlight External Friends group link: https://testflight.apple.com/join/SH37gxDw
- Localization: fr, zh-Hant, ko (phone language, not storefront).
- The 1000+ proof image (`wrapper/dist/proof.png`) is Matthew's; confirm what it counts before quoting it anywhere in the submission.
- Build-in-public material: Matthew posts on Instagram, TikTok and X from Sep 2; ask him for the post links and the numbers, do not invent them.

## Build, test, ship (commands)

```
cd /Users/matthewchan/Instamessages/wrapper
node test/test_bridge.js && node test/test_onboarding.js          # seconds
(cd test && nohup sh -c 'node test_cage.js; echo "EXIT $?"' > /tmp/cage.log 2>&1 &)   # ~10 min, do not run while Xcode builds (a timing test flakes under load)
(PATH="$HOME/.cargo/bin:$PATH" nohup sh -c 'npx @tauri-apps/cli ios build --export-method debugging --ci; echo "EXIT $?"' > /tmp/build.log 2>&1 &)
python3 scripts/verify-ipa.py 0 src-tauri/gen/apple/build/arm64/Konvo.ipa   # 28 checks incl. version 1.5.1 build 102; bump the two literals per release
scripts/install-dev.sh <coredevice udid> [--keep]                            # 16e B8D54F25-B2AC-5550-BF9D-E86453EAFA13, 13 C6E0A92E-2CA3-533D-8C06-137F07D16746; without --keep the app is uninstalled first
scripts/ship.sh            # store export from the same archive, upload, poll VALID, beta review, External Friends group (edit the build number filters first)
scripts/store-swap.sh --pull   # cancel a pending review submission, attach the build to the version, expire old builds (edit the ids first)
```

Apple refuses a second upload of the same build number: bump before every upload. The `ios_webkit_debug_proxy` on the Mac can attach to the app's webview over USB with the legacy udid (`idevice_id -l`) when the phone is unlocked; `scripts` has no probe, the session's one lived in the scratchpad.

## Current state on 2026-09-02, end of session

- App Store: 1.5.0 build 101 approved and live today. Build 100 and 86 expired on TestFlight; 101 is on TestFlight for External Friends.
- 1.5.1 build 102 is built, verified (28 checks) and installed on both phones (data kept). NOT uploaded anywhere, by Matthew's instruction. Changes: `purchase_result` event, "Have your Instagram password ready" on s10b with three translations, tests for both.
- Git: branch `konvo-onboarding-v2`; `origin/main` has everything through the build 101 commit plus the landing-page change. Build 101 and 102 commits are local only unless Matthew has pushed since. `git status` shows the truth.
- Site: landing page copy live since this afternoon.
- PostHog: new dashboard 2059658, Apple filter on, `konvoinstall.com` pageviews are not in this project.
- Known: Matthew's own Instagram account had DM threads not loading on Sep 2 (Instagram-side, also broken in Safari), unrelated to the app.
- Open ideas, none started: land the buyer inside the latest chat after "You're in"; Apple win-back offer for lapsed trials; a hint on a chat skeleton that hits the 10 s cap; 14-day trial on annual as a later test; freemium parked.

## Where to look for decisions

`docs/superpowers/plans/2026-09-01-invite-loop.md`, and the memory files: `konvo-onboarding-decisions`, `konvo-login-sheet-decisions`, `konvo-invite-loop`, `konvo-trial-cancel-evidence`, `konvo-rc-posthog-events`, `konvo-launch-snapshot`, `konvo-storekit-lifetime-trap`, `konvo-block-optin`, `konvo-posthog-access`, `konvo-site-deploys-from-main`, `konvo-cage-patch-channel`.

## Added 2026-09-03: AI-visibility foundation (branch konvo-onboarding-v2, preview only until Matthew approves the copy)

- `app/layout.tsx`: title "Konvo: DMs Only" (was "DM's"), meta description "Instagram DMs only. Konvo shows your messages and blocks the Feed, Explore and Reels, on iPhone and Mac."
- `app/robots.ts` (allows every crawler, AI bots by name; blocks /api/ and /i/), `app/sitemap.ts`, `public/llms.txt`.
- `app/instagram-dms-only/page.tsx`: the citable comparison page "Instagram DMs without the feed: every option for iPhone (2026)". Names Only DMs, UNDOOMED, Justagram, FocusGram, ScrollFree and the free Safari plus Screen Time route, answers the password question first, lists Konvo's price and limits. Every word is a draft for Matthew.
- Still to do by hand: AlternativeTo entry (Instagram client category), Product Hunt launch, Show HN post with real numbers, answers in existing Reddit threads with the `ct=reddit` campaign link, and the weekly prompt check (ChatGPT, Gemini, Claude, Perplexity) for "what app only shows Instagram DMs on iPhone".

### App Store listing text to paste with the next version (drafts, Matthew approves)

First line of the description: "Konvo shows only your Instagram DMs and blocks the Feed, Explore and Reels."
Promotional text (editable any time, 170 chars max): "Instagram DMs only. No feed, no Explore, no Reels. Sign in on Instagram's own page; Konvo never sees your messages or your password."
Keywords (100 chars max, comma separated): instagram,dms,only,messages,dm,feed,blocker,reels,explore,screen time,focus,distraction,no feed
