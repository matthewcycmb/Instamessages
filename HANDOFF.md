# Konvo handoff (Aug 6, 2026)

Repo: `/Users/matthewchan/Instamessages`. Matthew runs `/ponytail:ponytail
ultra` on coding tasks. Hard rules: **never commit or push without his
explicit word**, never use em dashes in user-facing copy, never invent social
proof. His memory files in `~/.claude/projects/-Users-matthewchan-Instamessages/memory/`
carry the standing decisions - read `MEMORY.md` first.

## What Konvo is

An iOS app that wraps instagram.com in a WKWebView and deletes everything
except messages. The pitch, in his words: every screen time app gives you a
switch you own, and a switch you own is one you flip at 11pm. Konvo has no
setting to negotiate with, and it **replaces** Instagram rather than
restricting it - Instagram comes off the phone.

## Where things stand right now

**Branch `konvo-onboarding-v2`, 6 commits, nothing pushed.** Working tree has
uncommitted changes (the `konvo-free` mode and version bump, below).

- **TestFlight: build 41 is live and APPROVED** for both groups. Build 42 was
  built but never uploaded - the session pivoted to the App Store.
- **App Store: v1.0 was REJECTED** (guideline 2.1). The reviewer could not
  sign in: Instagram challenged the login and asked for a code they had no way
  to retrieve. The rejected binary was 1.0 (6), months old.
- **A free v1.0.0 (42) store build was compiling when the session ended.**
  Verify the artifact before uploading: `CFBundleShortVersionString` 1.0.0,
  `CFBundleVersion` 42, `konvoBeta=true` absent, `__konvoFree` present.

## The decision that shapes everything

**v1.0 ships FREE, no paywall. Money comes at v1.1.** At zero users the
bottleneck is distribution, not revenue, and every IAP surface is another
rejection vector on a version that has already been rejected once. Details and
reasoning: memory file `konvo-monetisation-timing`.

Three build modes, all cargo features in `wrapper/src-tauri`:

| Mode | Behaviour | Used for |
|---|---|---|
| default | Onboarding + paywall enforced | v1.1 |
| `konvo-beta` | Paywall shown + "Free during beta" bypass | TestFlight |
| `konvo-free` | Onboarding + post-login sequence, **no price, no wall** | App Store v1.0 |

In `konvo-free` the sequence still runs (connected, loader, "Why this one
works", delete Instagram) and ends at the delete step, once, remembered in
`localStorage.konvoWelcomed`.

## To get v1.0 approved (Matthew's steps, not code)

1. **Demo account.** The rejection cause. Turn 2FA off on `mctestkonvo`, and
   give the reviewer the account's **email inbox credentials** so they can
   fetch Instagram's verification code themselves. A reply is drafted in the
   session transcript.
2. **Set the ASC version record to 1.0.0** (editable while rejected) so the
   new build attaches.
3. Attach the free build, resubmit. Products do NOT need submitting for a free
   build - leave the "Konvo Pro" subscription group in Prepare for Submission.

## Build and release mechanics (traps that cost real time)

- Sideload to his phone: `cd wrapper && KONVO_BETA=1 ./sideload.sh`. It refuses
  to install when the binary's beta-ness does not match the flag.
- **The build number lives in `tauri.conf.json` > `bundle.iOS.bundleVersion`.**
  `Info.plist` and `project.yml` are regenerated from it mid-build, so editing
  those silently reverts. `--build-number` APPENDS (35 becomes "35.42") which
  sorts LOWER than 41 - do not use it.
- `tauri.conf.json > version` must be semver: "1.0" is rejected, "1.0.0" works.
- **Always verify the exported IPA, never the source**, with `unzip -p` +
  `plutil` + `strings`. That check caught three bad builds in one evening.
- TestFlight pipeline (all scriptable with the ASC key at
  `~/.appstoreconnect/private_keys/AuthKey_F9Z3VFTX73.p8`, issuer
  `fadfc58a-8c12-4d69-8483-600d0aaec371`, app id 6794756261): upload with
  `altool`, poll builds until VALID, PATCH the beta notes, POST the build to
  group `1673c812-...` (External Friends), POST a betaAppReviewSubmission.
  Internal group `6c78a556-...` (Friends) picks it up automatically.
- Tests, always before a build: `cd wrapper/test && python3 extract.py &&
  node --check cage.js && node test_cage.js && node test_onboarding.js`.
  `extract.py` guards the raw-string trap: `"#` inside CAGE_SCRIPT closes the
  Rust raw string, so injected HTML uses single-quoted attributes.

## Hard-won facts about the app

- **Signing in must be handed to NATIVE code.** A page-driven cross-origin
  navigation to instagram.com is a universal link on iOS: with Instagram
  installed, the system opens THEIR app and the user never signs into Konvo.
- **Instagram answers `/api/v1/accounts/current_user/` with 400 "useragent
  mismatch"** for this webview under every app id. The auth gate is the
  `ds_user_id` cookie.
- **Notifications are `/notifications/` on phones**, not `/accounts/activity/`
  (desktop). Both floating buttons drive Instagram's own router via
  pushState + a synthetic popstate; an anchor would be a full page reload.
- **Instagram pushes profiles as BOTH `/name/` and `/name`.** Requiring the
  trailing slash silently drops half of them.
- **Its thread header puts the back arrow and the friend's name in one
  control**, so "does this contain a back arrow" counts opening a profile as
  pressing back.
- **Never re-layout on keyboard frame notifications.** Growing the safe-area
  inset fixed the emoji keyboard covering the compose bar and caused
  distortion mid-swipe, black flashes and chat lag, because iOS fires that
  notification continuously. It was reverted; the emoji keyboard covering the
  compose bar is a known, accepted, cosmetic issue.
- **Xcode-local StoreKit purchases can never unlock the app** - RevenueCat
  cannot validate those receipts. The paid path has still never completed
  once, in any environment. That is the biggest untested risk for v1.1.

## Analytics

PostHog project **543571** ("KONVO" org, key `phc_oNC3DTPBj8vt52...`). Both the
app (native posts, because Instagram's CSP blocks page-side calls) and the
website report there now; they used to be split across two projects.

Dashboard "Konvo beta": https://us.posthog.com/project/543571/dashboard/1962118
- Onboarding, screen by screen (every screen as a funnel step)
- Retention from `app_opened` (day 3, 5, 7, 10, 14, 21, 30 are columns)
- Beta funnel: onboarding to price

Events: `onboarding_screen_viewed`, `quiz_answered`, `login_started`,
`login_succeeded`, `paywall_viewed`, `plan_selected`, `beta_free_taken`,
`delete_prompt_viewed`, `onboarding_completed`, `app_opened`. Lean payloads by
decision: event plus screen id, never quiz answer values.

## The website

`konvoinstall.com` (Next.js, this repo). The front door is now the beta funnel
(`components/beta-funnel.tsx`): headline, one email field, then the TestFlight
handoff, with an install guide underneath and a banner telling Instagram
in-app-browser visitors to open in Safari. Emails go to PostHog as a person
property. **The old marketing landing page is intact at `/classic`** and comes
back by swapping one component in `app/page.tsx`. NOT deployed yet - the
production `NEXT_PUBLIC_POSTHOG_KEY` on Vercel needs the KONVO key.

## Open threads

1. Upload and submit the free v1.0.0 build once verified.
2. TestFlight build 42 for testers (all of today's fixes) - never uploaded.
3. If v1.1 charges, grandfather the free v1.0 users. Nothing implements this.
4. `PROOF = []` in lib.rs and `QUOTES = []` in dist/index.html are release
   blockers only if he wants testimonials; empty renders nothing, which is
   safe and honest.
5. Two QA findings left unfixed on purpose (narrow, and the build was about to
   ship): the blank-snapshot guard checks nil rather than emptiness, and
   `webView.frame` is read while a transform is in flight.
