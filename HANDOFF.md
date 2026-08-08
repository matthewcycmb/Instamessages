# Konvo handoff (Aug 7, 2026)

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

## Where things stand right now (Aug 7 evening)

**Branch `konvo-onboarding-v2`.** Working tree has uncommitted changes: the
Aug 7 nav fixes, s10 trust copy, the website security section, and
`bundleVersion` 43. `sideload.sh` is STAGED for its own commit (the
permission layer would not let the agent run `git commit`; Matthew runs it).

- **TestFlight: build 43 (1.0.0) is IN_BETA_TESTING** for External Friends
  and live for internal Friends. It carries every Aug 7 fix. Build 41 is
  obsolete; "TestFlight 42" never happened (42 became the store build).
- **App Store: 1.0.0 (42), the free `konvo-free` build, is
  WAITING_FOR_REVIEW** - resubmitted Aug 6 with the demo-account fix. The
  version record was renamed 1.0 -> 1.0.0 via the API so the build attached.
  Decision: do NOT swap in a fixed build; a missing animation is not a
  rejection risk and swapping forfeits queue position. When 42 is approved,
  cut **1.0.1 (build 44, `konvo-free`)** with the Aug 7 fixes.
- **Build numbers 42 and 43 are burned** on ASC. Next upload of any kind
  is 44.

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
- **The stale-IPA trap (fixed Aug 7, the fix is the staged commit).** The
  script used to rebuild only on profile/beta drift, so it reinstalled one
  stale IPA through seven "builds" while every source edit stayed on the
  Mac - three bug reports that day were phantoms. It now also rebuilds when
  any source is newer than the IPA. Even so: after any build, verify the
  IPA's mtime moved before believing a test.
- **Debugging on device: NSLog is invisible** (not in `devicectl --console`,
  not in idevicesyslog, and `log collect --device` needs sudo the session
  cannot type). What works: append lines to a file in Documents from Swift,
  then `xcrun devicectl device copy from --domain-type appDataContainer
  --domain-identifier com.matthewchan.konvo --source Documents/<f> --destination <f>`.
  That file log is how the slide bug was finally caught in one look.
- **ASC write-lag:** a freshly VALID build 404s on group-attach POSTs
  ("no resource of type builds") for up to ~30 min while GETs see it fine.
  Retry every minute; the betaAppReviewSubmission POST works immediately.
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

`konvoinstall.com` (Next.js, this repo). The front door is the landing page
(`components/landing.tsx`) again, and its two "Download beta" buttons open a
two-step modal: email, then the TestFlight link. Emails go to PostHog as a
person property (`beta_email_submitted`, then `beta_testflight_opened`). The
install steps and the FAQ were rewritten for the iPhone beta on Aug 8, since
they still described the Mac app and the Chrome extension. The stripped beta
funnel is intact but unrouted in `components/beta-funnel.tsx` and comes back
by swapping the component in `app/page.tsx`; `/classic` was deleted when the
landing page took the front door back. **Still not deployed** - check that the
production `NEXT_PUBLIC_POSTHOG_KEY` on Vercel is the KONVO one, or the emails
land in the old project.

## The Aug 7 nav fixes (what changed and why)

Tester-visible bugs, all fixed and verified via the device file-log:

1. **Chat taps did not slide after a back-swipe.** The 1.2s post-swipe settle
   window swallowed EVERY nav report; a real tap ~0.9s after a swipe (normal
   inbox rhythm) died there. Now one-shot: it eats exactly the swipe's own
   round-trip report (which navFor can classify as anything, even "push"
   back into a profile) and closes. Checked BEFORE the swiping guard, since
   the round-trip usually lands mid-slide.
2. **JS nav dedupe ate real taps too:** the 400ms window now only drops
   reports for the SAME pathname (one action, one destination).
3. **Back-swipe revealed a garbled headerless copy of the chat.** The stack
   picture was snapshotted ~80ms after the tap, when Instagram had already
   half-painted the thread. Now `tapDismiss` snapshots on the raw tap frame
   (pre-router) into `settledSnap` + `tapSnapAt`; pushIntoThread prefers a
   tap snapshot under 1s old over live pixels.

Instagram fires BOTH the Navigation API and pushState on this build, so the
history hooks still work; a `navigate` listener is NOT needed (probed Aug 7,
then removed).

The black-void-on-swipe-after-backgrounding bug (fallback underlay is
`.systemBackground`, pure black in dark mode, when the purge emptied the
stack) was diagnosed, fixed, then REVERTED at Matthew's request. If it comes
back: the one-liner is `wv.backgroundColor ?? .systemBackground` at the
fallback in `edgeBack .began`.

## Trust work (from tester feedback, Aug 7)

Security fear ("scary to put my IG info into the app") answered three ways,
grilled and approved: s10 copy is now blunt ("Konvo does not collect your
Instagram information"), konvoinstall.com has an "Is it safe to log in?"
section (`#security`, in beta-funnel.tsx), and a reply draft went to Matthew.
All claims checkable; the session appears in Instagram's "Where you're
logged in", which is the escape hatch the copy points at.

## Open threads

1. **When 1.0.0 (42) is approved: build 1.0.1 (44, `konvo-free`), verify
   inside the IPA, upload, attach, submit.** The Aug 7 fixes are not in the
   store build under review.
2. If v1.1 charges, grandfather the free v1.0 users. Nothing implements this.
3. `PROOF = []` in lib.rs and `QUOTES = []` in dist/index.html are release
   blockers only if he wants testimonials; empty renders nothing, which is
   safe and honest.
4. Two QA findings left unfixed on purpose (narrow): the blank-snapshot guard
   checks nil rather than emptiness, and `webView.frame` is read while a
   transform is in flight.
5. Production `NEXT_PUBLIC_POSTHOG_KEY` on Vercel still needs the KONVO key
   before the site (with the new security section) deploys.
