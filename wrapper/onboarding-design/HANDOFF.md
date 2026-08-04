# Handoff: integrate Konvo's onboarding + paywall into the iOS app

For a fresh Claude session working in `/Users/matthewchan/Instamessages`. The design phase is done; this session wires it into the real app. Do the build work now, but **do not ship it into the pending App Store review build** — Matthew wants integration ready for after the current review is accepted.

## What exists (read these first, in order)

1. `wrapper/onboarding-design/konvo-onboarding-brief.md` — the locked design brief: flow order, copy, tokens, engineering notes (two-origin problem, cage flags, paywall trigger). The source of truth for intent.
2. `wrapper/onboarding-design/index.html` — the approved visual mockup, phone frames (S1 welcome, S1b sign-up sheet, S1c email form, S2–S4 quiz, S4b calculating, S5 reframe with dot grid, S7 commitment, S8 building, S9 bar-chart reveal, S9b login-privacy, S10 handoff, S11 what-you-get value page, S12 price, S13 counter-offer, S14 hard stop, S15 unlocked). Strip the mockup chrome (phone frames, fake status bars, screen labels) during integration.
3. `wrapper/onboarding-design/NOTES.md` — hardcoded values to wire and known deviations (light theme vs dark brief, accent #0a5cf0 vs app #0a84ff — Matthew has been iterating on the light mockup and likes it; treat the mockup as the visual truth now).
4. `wrapper/src-tauri/src/lib.rs` — the app: bundled splash (`wrapper/dist/index.html`) → instagram.com with injected `CAGE_SCRIPT`. Onboarding S1–S9b replace/extend the splash page; the paywall (S11–S15) is injected by CAGE_SCRIPT after login on first `/direct/inbox/` load.
5. `wrapper/test/test_cage.js` — existing cage test suite (9 cases); new cage flags must get cases.
6. Memory file `konvo-onboarding-decisions.md` (auto-memory dir) — locked product decisions.

## Key architecture constraints (from the brief, verified against lib.rs)

- **Two origins.** The onboarding page runs on the bundled `tauri://` origin; the paywall runs on instagram.com. localStorage does not cross. The only state that must cross is "onboarding done" (and later "paid") — pass it in the URL fragment when navigating to Instagram login; CAGE_SCRIPT reads `location.hash` at document-start, persists to instagram.com-origin localStorage, strips the hash.
- **No cage flags.** The S6 strictness question was REMOVED (Jul 31) — the app has one behavior for everyone. Ignore the brief's `konvo.stories`/`konvo.heart`/`konvo.reels` flags section; the quiz answers feed copy only.
- **Raw-string trap:** CAGE_SCRIPT lives in a Rust raw string — the two-character sequence `"#` closes it. Single-quote attributes in any injected HTML/CSS (established convention in lib.rs).
- **Everything self-contained** — no CDNs, no external fonts; the splash must paint from disk frame one.

## Decision changes this session must know

- **The fake purchase gate is superseded.** Matthew now wants a real StoreKit purchase testable in the Apple sandbox. Products: auto-renewable subscriptions — yearly $29.99 with 7-day free trial (the trial lives on yearly only), weekly $1.99 no trial (S13 counter-offer), and if the S12 Monthly tab is kept, monthly $4.99 no trial.
- **Account screens (S1b/S1c) are designed but should NOT be functional in v1 — recommended: don't ship them yet** (see Q1 below). If Matthew overrides, Sign in with Apple is mandatory alongside Google (App Review guideline 4.8) and a backend is required.
- **S12's headline is "Cure your scrolling addiction for 8¢ a day."** — the 8¢ is only true for the yearly plan. Either swap the headline number when the Monthly tab is selected, or (simpler, recommended) treat yearly as the only trial plan and let the headline belong to it. Don't ship a headline that's false for the visible tab.

## Q1: Is Google/Apple auth setup needed for the Get started / signup pages?

**No — recommend shipping v1 without S1b/S1c entirely.** Reasoning to present to Matthew before building:
- Premium persistence needs zero accounts: StoreKit 2 ties the subscription to the Apple ID. `Transaction.currentEntitlements` survives app deletion, reinstall, and new devices; the Restore Purchases button covers edge cases. No backend.
- Konvo's only real identity is the Instagram login; a second login before the quiz is the highest-friction placement possible.
- If the signup screens ship visibly, App Review will tap them and they must actually work — which forces: OAuth setup for Google (Cloud Console client ID), Sign in with Apple capability + entitlement, AND a backend to map accounts→subscriptions. That entire stack exists only to serve future Mac-app sync, which has no deadline.
- So: S1 "Get started" → straight to S2 quiz. Keep S1b/S1c in the mockup for the future Mac-sync milestone. If accounts do ship someday: Apple + Google both (4.8 requires Apple wherever Google exists).

## Q2: Testing purchases with the Apple sandbox

Setup (one-time):
1. App Store Connect: sign the **Paid Applications agreement** (Agreements, Tax, and Banking) — nothing works without it.
2. ASC → the app → Subscriptions: create one subscription group ("Konvo Pro"), add the yearly ($29.99, 7-day introductory free trial) and weekly ($1.99) products. Localized display names/descriptions filled so they're "Ready to Submit".
3. ASC → Users and Access → **Sandbox** → Testers: create a sandbox Apple ID (use a fresh plus-addressed email; never a real Apple ID).
4. On the iPhone: Settings → App Store → scroll to **Sandbox Account** → sign in with the sandbox tester. The personal Apple ID stays signed in normally.
5. Build and sideload the dev build (`wrapper/sideload.sh` handles device install). Developer-signed builds hit the sandbox automatically — the purchase sheet shows "[Environment: Sandbox]".

Sandbox behaviors to expect:
- Time compression: 7-day trial ≈ 3 minutes; 1 week ≈ 3 min; 1 month ≈ 5 min; 1 year ≈ 1 hour. Auto-renewals repeat a limited number of times then lapse — useful for testing expiry.
- Cancel/manage: Settings → App Store → Sandbox Account → Manage, or clear the tester's purchase history in ASC (Sandbox → Testers → Edit → Clear Purchase History) to re-test the intro trial from scratch.
- Faster inner loop: an Xcode **StoreKit Configuration file** in the generated project (`wrapper/src-tauri/gen/apple`) simulates products, refunds, and interrupted purchases with no ASC or network at all. Use it for development; do the final pass against the real sandbox.
- TestFlight builds use a sandbox-like environment automatically (testers aren't charged) — that's where the tester scripts below run.

StoreKit integration approach (Tauri has no official IAP plugin): a small Swift StoreKit 2 helper in the generated Xcode project exposed to JS via a Tauri plugin/command (`purchase(productId)`, `restore()`, `entitlements()`). The paywall overlay calls it through `window.__TAURI_INTERNALS__.invoke`, same pattern the cage already uses for notifications (`lib.rs` line ~157). Check entitlements at every launch and cache the result in instagram-origin localStorage so premium works offline; never trust the cache alone longer than a session without a re-check.

## One-time onboarding (hard requirement)

The onboarding must show exactly once per install:
- `wrapper/dist/index.html` (the `tauri://` origin) checks `localStorage.konvoOnboarded` at load. If set: behave exactly like today's splash (immediately `location.replace` to the inbox). If not: run the onboarding flow, and set the flag at the moment of the login handoff (S9b's button), not at S15, so a killed app mid-login never replays the quiz.
- WKWebView localStorage persists across launches and TestFlight updates; it is wiped only by app deletion. Fresh install → onboarding again → Restore Purchases covers premium. That's correct behavior, not a bug.
- Existing testers updating via TestFlight keep their Instagram session (cookies survive updates), so after their one pass through onboarding, the login step will fall straight through to the inbox.

## Acceptance: the three tester scripts

Build until all three pass on TestFlight:
1. **Tester 1 (usability):** fresh install; completes onboarding through to the inbox with no help. Anything they hesitate on gets logged. Instrument furthest-screen-reached per session (the funnel metric that matters is quiz completion).
2. **Tester 2 (persistence):** completes purchase (sandbox/TestFlight), force-quits Konvo, relaunches → premium still unlocked, no paywall flash, works with airplane mode on (cached entitlement).
3. **Tester 3 (restore):** cancels the subscription (sandbox Manage screen), purchases again, deletes the app, reinstalls, taps **Restore Purchases** on the paywall → premium unlocks. This exercises `AppStore.sync()`/restore and proves the no-account architecture holds.

## Suggested skills for the next session

- `ponytail:ponytail` (Matthew runs it at `ultra` — minimal diffs, challenge scope)
- `superpowers:writing-plans` before touching code (this is a multi-step change: dist page, CAGE_SCRIPT, Swift bridge, tests)
- `run` / `webapp-testing` for visually verifying the flow in the built app
- Existing test suite: extend `wrapper/test/test_cage.js` (cases for onboarding/paywall gating)

## Hard rules carried over

- Never commit/push without Matthew's explicit say-so (pushes deploy to prod).
- Don't ship into the currently-in-review build.
- No em dashes in any user-facing copy (Matthew removed them all deliberately).
- The mockup's copy is final — Matthew hand-tuned every line; don't "improve" it.
