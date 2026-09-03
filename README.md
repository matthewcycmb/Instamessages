# Konvo: DMs Only

Instagram with only the messages. Konvo is an iPhone app (also on the Mac App Store) that opens straight to your Instagram inbox. The feed, Reels and Explore never load. You sign in on Instagram's own login page inside the app; Konvo never sees your password or your messages, because it is Instagram's website in a caged web view, not a client that talks to Instagram on your behalf.

App Store: https://apps.apple.com/app/id6794756261. Site: https://konvoinstall.com. Built by Matthew Chan, a high school student, July to September 2026. MIT licensed.

## Why it exists

I deleted Instagram for two weeks and the urge to scroll went away. Then I reinstalled it to answer friends and found fifteen unread messages. Deleting was no longer an option, and every screen time app I had tried failed the same way: a fifteen-minute unlock opens the whole app, so the fifteen minutes went to Reels. Konvo removes the surfaces instead of rationing them. The messages stay; the feed does not exist.

## How it works

One WKWebView on instagram.com, hosted by Tauri 2, with a script injected at document start on every page. There is no Konvo backend for anything you read or write.

- `wrapper/src-tauri/src/cage.js` is the product. It runs before Instagram's own code and does four jobs: the cage (below), the onboarding wall drawn over the inbox, the paywall, and analytics through the native bridge.
- `wrapper/src-tauri/src/lib.rs` embeds the script (`CAGE_SCRIPT`), sets a Safari user agent so Instagram's login accepts the web view, and allows all web navigation so Meta's login, two-factor and challenge pages are never cut off (`allowed()`).
- `wrapper/src-tauri/gen/apple/Sources/instamessages-wrapper/KonvoStore.swift` is the native side of the bridge (`window.webkit.messageHandlers.konvoStore`): RevenueCat purchases and entitlements, Screen Time, the cookie snapshot, notifications, the share sheet.
- `wrapper/src-tauri/gen/apple/{ShieldConfig,ShieldAction,ActivityMonitor}` are the Screen Time extensions behind the optional lock button.
- `wrapper/dist/index.html` is the pre-login onboarding (quiz, privacy pages), in English, French, Traditional Chinese and Korean.
- `app/`, `lib/`, `public/` are the Next.js site on Vercel: the landing page, the privacy policy, the invite landing page and API, the unread-message push heartbeat, and the cage patch file.
- `extension/` is a Chrome extension of static redirect rules (Manifest V3, no scripts).

### The cage

Blocking is a URL block-list, not an allow-list: an allow-list stranded people on Meta's login chain, so the rule is "bounce the feed surfaces, leave everything else alone". Five rules in `cage.js` (`var FEED`):

```
/^\/$/                                        home feed
/^\/reels(\/|$)/                              Reels tab
/^\/reel\/?$/                                 bare /reel
/^\/explore(\/|$)/                            Explore
/^\/[A-Za-z0-9._]+\/(reels|tagged|saved)(\/|$)/   a profile's scrolling tabs
```

Anything matching is sent to `/direct/inbox/`. Thirty-nine CSS selectors hide doorways that Instagram draws inside allowed pages (the inbox back chevron, Message Requests, the New post and Create entries, and language-proof variants verified on a French phone). Deliberately open, because they are conversation material and not a feed: stories viewing, profiles, a single post (`/p/<code>`), the single-reel permalink (`/reel/<code>/`), and the notifications heart. In-app copy says exactly this: "Feed, Reels and Explore are now hidden. Stories, profiles and notifications still work."

When Instagram changes its markup, `public/cage-patch.json` on the site is the repair channel: the app fetches it at every document start, caches the last good copy, and accepts three keys, `hide` (selectors), `css` (a raw string) and `block` (regex sources appended to the list). Data only; remote JavaScript is not supported. A fix is live within about a minute, with no app release. One Instagram A/B variant ships a Content Security Policy that blocks this fetch; those users get the baked-in rules until the next release.

### What broke and what changed

The paywall reads live prices from the RevenueCat offering (`products` in `KonvoStore.swift`). Until 1.4.0, `pricesReady()` in `cage.js` waited for three products, and the third, a lifetime purchase, had never been approved in App Store Connect, so the real store never returned it. Development builds read a local StoreKit file that still had it, which is why the bug never showed on my phone and hung the paywall on "Loading your plans" for every store user on the busiest day of the launch. The fix in 1.4.0 (`prod()` and `pricesReady()`, `cage.js`) requires only the products that are sold; `wrapper/test/test_cage.js` boots a wall whose products reply has no lifetime entry and asserts the prices render.

The second lesson came from data. The Screen Time block used to arm at the moment of purchase; trials were being cancelled within minutes, so the block became opt-in from the inbox. Cancels did not move. The RevenueCat webhook events land in PostHog on the same person as the app's own events, and that join showed cancels clustering in the first ten minutes regardless of the block. 1.5.0 answered that instead: a reminder promise before the trial ends, a notifications page after purchase, and a clear next step after the money.

### RevenueCat

- `Purchases.configure` with the public SDK key, anonymous app user id, entitlement `Pro`, offering `current`, packages `konvo.pro.yearly` (7-day trial) and `konvo.pro.monthly`.
- `products`: localized prices, per-week and per-month framing, the honest saving against twelve months of monthly, and `trialDays` only when `checkTrialOrIntroDiscountEligibility` says the person is eligible.
- `purchase`: cancelled, pending (Ask to Buy) and error branches; `restore`; `entitlements` from cached customer info so an offline launch keeps working.
- RevenueCat Paywalls (`RevenueCatUI`) can be switched on remotely through the patch file for a test, with no release.
- The invite loop: every buyer can send a link; a friend who pastes it at their paywall gets three free days through a RevenueCat promotional entitlement granted by the site (`app/api/invite`), three friends per link, then the paywall. The RevenueCat secret key lives only on the server.
- Webhooks go to PostHog and share the person with the app's events, which is how the decisions above were made.

## Data that leaves the phone

- Never: your Instagram password (the code only checks that the field is non-empty before counting a login attempt), your messages, your contacts.
- To PostHog: named events with the build number, network type, platform, phone language and onboarding variant; a random RevenueCat anonymous id as the person; and, once, your Instagram account's numeric id so returning devices can be told apart. The username is not sent.
- To RevenueCat: what its SDK needs to sell and restore a subscription.
- To UserJot: feedback you type into the feedback board, under the same anonymous id.
- To the site: your Instagram username only if you send an invite link (it is the invite code) and a device push token if you allow notifications, both keyed to the anonymous id.
- On the phone only: a snapshot of your Instagram session cookies (Application Support, protected until first unlock) so a force-quit does not sign you out and the background unread check can run. Instagram's own unread count endpoint is called with the session, with the same headers the website uses; nothing else of Instagram's is read.

Full policy: https://konvoinstall.com/privacy.

## Build and run

Requirements: macOS with Xcode, Node 24, Rust (stable), the Tauri CLI (`npx @tauri-apps/cli`), an Apple developer team for device builds (a free Apple ID works for a development-signed install on your own phone). Set your team and bundle id in `wrapper/src-tauri/gen/apple/project.yml` and the four `Info.plist` files; the committed values are mine.

```sh
# site
npm install && npm run dev

# iOS development build (about ten minutes), then verify the IPA and install
cd wrapper
PATH="$HOME/.cargo/bin:$PATH" npx @tauri-apps/cli ios build --export-method debugging --ci
python3 scripts/verify-ipa.py 0 src-tauri/gen/apple/build/arm64/Konvo.ipa
scripts/install-dev.sh <device udid> --keep

# Mac
PATH="$HOME/.cargo/bin:$PATH" npx @tauri-apps/cli build --bundles app
```

Development-signed installs talk to the real App Store sandbox: sign in to the phone with a sandbox tester to see the paywall and the trial. `scripts/ship.sh` and `scripts/store-swap.sh` drive App Store Connect through its API (`scripts/asc.sh`) and expect a key you own. Mac and Windows builds also run in `.github/workflows/`.

The site needs the variables in `.env.example` only for the invite loop and the push heartbeat; the landing page runs without them.

## Tests

```sh
cd wrapper
node test/test_bridge.js        # the bridge protocol, seconds
node test/test_onboarding.js    # screen order, language tables, no em dashes, seconds
node test/test_cage.js          # the cage in jsdom, about ten minutes
```

`test_cage.js` boots a page at each feed path ('/', '/reels/', '/explore/', a profile's reels tab, posts, stories) and asserts the bounce or the wall, then walks the onboarding, the paywall (including the missing-lifetime case), the login sheet, the identity capture and the rating prompt. Run it on an idle machine; one timing test flakes under load. Fixtures are hand-written, so a selector that only ever matched a fixture is not verified: every selector that gates behaviour was checked on a real phone before shipping.

## Known limits

- Stories, profiles, single posts and the single-reel permalink are reachable by design. Konvo removes the feed surfaces; it is not a content blocker.
- The cage depends on Instagram's markup for its hides. URL rules are stable; selectors are repaired through the patch file.
- One Instagram A/B variant blocks the patch fetch (see above).
- There is no crash reporter. The cage records a `cage_error` event for exceptions it catches.
- Login attempts are counted from taps on Instagram's Log in button while the password field is non-empty; one-tap "Continue as" logins are not counted as attempts.
- The Mac app has no Screen Time lock and sends no analytics.

## Layout

```
app/ lib/ public/ components/   Next.js site (Vercel); public/cage-patch.json is the repair channel
extension/                      Chrome extension, static redirect rules
wrapper/                        the app: Tauri 2 host, cage.js, Swift bridge, Screen Time extensions, tests, scripts
docs/agents/                    notes for coding agents working in this repo
```
