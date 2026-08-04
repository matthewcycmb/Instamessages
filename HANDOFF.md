# Konvo handoff (from the Aug 3, 2026 session)

Repo: `/Users/matthewchan/Instamessages`. Matthew runs `/ponytail:ponytail ultra`
on coding tasks and `/grill-me` when he pastes big specs. Hard rules: never
commit or push without his explicit word (pushes deploy the site to prod),
never use em dashes in user-facing copy, never invent social proof or any
claim the app cannot back up.

## Where things stand

The v2 onboarding + paywall is **implemented and running on his iPhone**
(Matty16E), rebuilt many times today. Everything is **uncommitted** in the
working tree, deliberately. All tests pass:

```
cd wrapper/test && python3 extract.py && node --check cage.js \
  && node test_cage.js && node test_onboarding.js
```

`extract.py` also guards the raw-string trap: the two-char sequence `"#`
inside CAGE_SCRIPT closes the Rust raw string. Injected HTML/CSS uses
single-quoted attributes; a `querySelector("#id")` will break the build.

## The two halves of the flow

**Pre-login — `wrapper/dist/index.html`** (bundled, paints from disk):
S1 intro > S2 motive > S3 screen-time slider > S4 messaging ranges >
S4b "Adding it up" > **[blue-pinned dark stretch]** S5 years lost > S6
With-Konvo columns > S7 years back > S8a/S8b hero slides > **S9 the pact
(full-bleed blue)** > (s9t testimonials, collapsed) > S10 privacy > S11
handoff to Instagram login.

**Post-login — CAGE_SCRIPT in `wrapper/src-tauri/src/lib.rs`** (injected on
instagram.com): S12 connected > S12b "Setting up your Konvo, {username}" >
perks comparison table > S13 three-package paywall > S14 activation.

Quiz answers cross the origin boundary in a `#konvo=<motive>.<weeklyHours>`
fragment that the cage persists into instagram.com localStorage and strips.

## Load-bearing mechanics (do not regress these)

- **Auth gate (rebuilt Aug 3, was a money bug twice).** The paywall may
  only rise over a real session. Gating on the `/direct/inbox/` URL alone
  let the wall appear over a logged-out page: login looked "skipped", the
  user paid, and dismissing revealed a login screen. The session-endpoint
  check that replaced it never worked on device - Instagram answers 400
  "useragent mismatch" to this webview's UA with every app id, so the wall
  never rose at all. The gate is now the `ds_user_id` cookie (set at
  login, cleared at logout, verified readable on device). `authed` must
  stay a precondition in `ensure()`; the loader greeting lost its username
  until a reliable source exists.
- **Tap lock.** Every navigation arms `busy` (1000ms default; 2400 on S5,
  1400 S6, 1800 S7, 3500 S4b). Automated walks must wait it out.
- **Appearance modes** over the bridge: `light` / `dark` / `blue` / `auto`.
  `blue` paints the native letterbox for the pact screen (CSS cannot reach
  it). Only `auto` sets `konvoFunnelDone`, which lib.rs reads at launch to
  skip the Light pin.
- **`.screen.t-rise:not(.on)`** — the `:not(.on)` is load-bearing; without
  it the whole screen sits 36px low (that was the S10 button "bug").
- **Wall fades:** the fade lives on an inner `.imp-page` wrapper, never the
  wall itself, or the live inbox shows through during transitions.
- **Paywall must fit one screen** (measured: zero overflow in all four
  states). Adding a timeline node broke this once already.

## Money

- **RevenueCat** (`appl_ghuOElWpSeJyXhbJcOKQpQoRSsQ`) is the purchase layer
  behind the unchanged JS bridge: entitlement `Pro` (capital P - the
  dashboard identifier; the Swift checks match it exactly, RC keys are
  case-sensitive), offering `default`,
  products `konvo.pro.yearly` ($29.99, 14-day trial), `konvo.pro.monthly`
  ($4.99), `konvo.pro.lifetime` ($79.99 non-consumable). Prices, per-month
  and per-week math, SAVE %, and trial length are all computed live in
  `KonvoStore.swift` - never hardcode money in a shipping path.
- **Superwall** is configured with RC as its purchase controller but
  presents nothing: the `paywall` bridge command only fires when
  `https://konvoinstall.com/cage-patch.json` returns `{"superwall": true}`.
  It is currently `{}`. The injected wall is always the enforcement floor.
- The sim store (`Konvo.storekit`) only applies to Xcode-launched runs and
  must stay in sync with ASC (it carries lifetime + the 14-day trial now).
  Purchase sheet must say **[Environment: Xcode]**; un-buy via Xcode >
  Debug > StoreKit > Manage Transactions.
- **[Environment: Xcode] purchases can never unlock the app.** RevenueCat's
  backend cannot validate Xcode-local test receipts: the sheet completes,
  but the RC subscriber record stays empty (verified against RC's REST API
  Aug 3), so `pro` never activates and S14 is unreachable. That is correct
  behavior, not a bug. To test the paid path end to end: Edit Scheme > Run
  > Options > StoreKit Configuration > **None**, sign the device into an
  ASC sandbox tester account, and buy against the real sandbox (requires
  the Paid Apps agreement Active - manual step 3). S14's UI alone can be
  previewed in the capture harness without any purchase.

## Analytics

PostHog funnel events go through the bridge's `track` command and are
posted natively (Instagram's CSP blocks page-side calls). **Lean payloads
by decision: event name + screen_id only, never quiz answer values.**
RevenueCat owns revenue events. `login_failed` was deliberately dropped as
unobservable; `login_started` and `login_succeeded` bracket that step.

## RELEASE BLOCKERS (placeholders in code)

- `PROOF = []` in lib.rs and `QUOTES = []` in dist/index.html, both marked
  `TODO: RELEASE BLOCKER`. Quote-only, no star rows (no rating exists).
  While empty, both social-proof surfaces render nothing, which is safe.

## Manual steps still on Matthew (none are code)

1. Verify `konvo.pro.lifetime` is in RevenueCat Products, attached to the
   `pro` entitlement, and in the **current** `default` offering.
2. ASC metadata + review screenshots for all IAPs (all "Missing Metadata");
   they must be submitted with the binary.
3. Paid Apps agreement must be **Active** or production products never load.
4. App privacy labels + privacy-policy line for RevenueCat, PostHog, and
   Superwall (Purchases, Product Interaction).
5. Demo Instagram account in App Review notes - reviewers cannot pass login.
6. Decide whether Superwall ships or gets cut before submission.

## Beta builds

The `konvo-beta` cargo feature compiles a tester build: no funnel (the
splash goes straight to Instagram, phone appearance), no paywall
(`ensure()` sees `window.__konvoBeta`). All bug fixes ride along. It is
a cargo FEATURE, not an env var: xcodebuild rebuilds the Build Rust
Code phase's env from build settings, so an env var dies before cargo
reads it - that shipped a walled "beta" once. Deliver it as
`--features konvo-beta` on the tauri CLI, or `KONVO_BETA=1 ./sideload.sh`
(the script appends the flag and then verifies the built binary's
beta-ness matches, refusing a mismatch). Off by default, so a store
build cannot ship unwalled. Never upload a beta binary to ASC as a
store submission; TestFlight beta uploads must stamp "do not submit"
in the build notes.

## Dev loop

- Xcode Run only works while `PATH="$HOME/.cargo/bin:$PATH" npm run --
  tauri ios dev Matty16E --open --host` is alive (the Build Rust Code phase
  phones the CLI). **The Mac's LAN IP moves** (was .1.3, now 192.168.1.2) -
  read it from the CLI output, never assume.
- NEVER accept Xcode's "update to recommended settings": it enables script
  sandboxing and every build fails with EPERM.
- Fresh onboarding = `xcrun devicectl device uninstall app --device
  B8D54F25-B2AC-5550-BF9D-E86453EAFA13 com.matthewchan.konvo`, then Run.
- Verify builds from the newest
  `~/Library/Developer/Xcode/DerivedData/instamessages-wrapper-*/Logs/Build/
  *.xcactivitylog`, never from a running process.
- The RevenueCat/Superwall SPM packages are hand-mirrored in BOTH
  `project.pbxproj` (live truth) and `project.yml` (future regens).

## Design sheet

`wrapper/onboarding-design/index.html` is **v7: real captures of the
implemented app**, not mockups (23 frames, dist + the cage paywall run in a
harness). The v4 art-directed mockups and the full decision log live in
`index-v4-mockup.html` next door. Regeneration recipe is in NOTES.md: serve
`wrapper/dist` on :8735, serve the harness on :8736 (it **fetches**
cage.js - never inline it, escapes break), drive both with playwright-core
at 390x844@2x, and wait out the tap locks. The harness also strips the
cage's boot overlay, which never self-clears there because `load` fires
before the fetched script registers its listener.

## Likely next steps

1. Real-device pass on the current build: pact screen fully blue, perks
   table aligned, annual paywall on one screen ($2.50/month card), and the
   post-purchase path landing in actual DMs.
2. The manual App Store list above.
3. Version bump + sideload/TestFlight, on Matthew's word only.
