# Konvo handoff (Aug 13, 2026)

Repo: `/Users/matthewchan/Instamessages`. Matthew runs `/ponytail:ponytail
ultra` on coding tasks. Hard rules: **never commit or push without his
explicit word** (pushes deploy to production), never use em dashes in
user-facing copy, never invent social proof or a claim the app cannot back.
Do the things you can do yourself; only ask him for what only he can do. His
memory files in `~/.claude/projects/-Users-matthewchan-Instamessages/memory/`
carry the standing decisions - read `MEMORY.md` first.

## What Konvo is

An iOS app that wraps instagram.com in a WKWebView and deletes everything
except messages. The pitch, in his words: every screen time app gives you a
switch you own, and a switch you own is one you flip at 11pm. Konvo has no
setting to negotiate with, and it **replaces** Instagram rather than
restricting it.

## Where things stand

**Branch `konvo-onboarding-v2`**, HEAD `3d1eee4`, one commit ahead of
`origin/main`. Uncommitted: `tauri.conf.json` + `Info.plist`, build number 50
only.

| Track | State |
|---|---|
| App Store 1.0.0 | **build 50 attached, NOT submitted.** State READY_FOR_REVIEW. Matthew presses Resubmit himself. |
| TestFlight | build 49 (`konvo-beta`) live for External Friends |
| His iPhone (Matty16E) | build 50, dev-signed `konvo-free`, sideloaded |
| Website | live on konvoinstall.com; `main` is `707d21c` |
| macOS | signed and universal, **blocked on Apple enabling notarization** |

**Build numbers are burned up to 50. The next upload of anything is 51.**

## The three build variants (cargo features in `wrapper/src-tauri`)

| Mode | Behaviour | Used for |
|---|---|---|
| default | Onboarding + paywall enforced, no escape | nothing ships this |
| `konvo-beta` | Paywall shown + "Free during beta" bypass | TestFlight |
| `konvo-free` | No paywall at all; the sequence ends at the delete step | App Store v1.0 |

**The paywall, the pre-paywall impact screen and every price string exist ONLY
where the paywall does.** A `konvo-free` build cannot show them. This has
already burned two rounds of testing: when someone says "I don't see the
paywall", check which variant they installed before debugging anything.

In `konvo-beta`, `buy()` never touches StoreKit - it records
`beta_free_taken`, grants beta access and dismisses. There is no way to be
charged in a beta build.

## v1.0 ships free; money comes at v1.1

At zero users the bottleneck is distribution, not revenue, and every IAP
surface is another rejection vector on a version already rejected twice.
`konvo-free` is what flips it. Reasoning lives in memory file
`konvo-monetisation-timing`.

## App Store: the live situation

1.0.0 was rejected twice under **Guideline 2.1 App Completeness**, both times
because the reviewer could not get past Instagram's verification code.
Instagram challenges any login from unfamiliar hardware and mails the code to
the demo account's inbox.

- Demo account `konvo1613` / `testing123`; inbox `konvo1613@gmail.com` /
  `testing1235!1`. Both live in **App Review Information**, which travels with
  the version. Matthew rewrote the notes so they open with the Gmail
  instruction in capitals.
- **Resolution Center messages do NOT survive a resubmission.** The thread
  belongs to the submission object; a new submission starts empty and the old
  messages stay on the old submission's page. That is exactly why the
  credentials must live in App Review Information and not only in a reply.
- **Resubmitting is not one API call.** The rejected submission still owns the
  version, so `PATCH submitted=true` 409s with a misleading "Version is not
  ready to be submitted yet"; the real error is
  `ITEM_PART_OF_ANOTHER_SUBMISSION`. Working sequence: PATCH the old item
  `removed: true`, POST a new `reviewSubmissions`, POST a
  `reviewSubmissionItem` pointing at the version, then PATCH `submitted: true`.
- A **stray empty submission `13dfa998`** sits in READY_FOR_REVIEW. It has no
  items and Apple refuses to delete or cancel it (403 / 409). If ASC offers a
  choice of submissions, take the one containing iOS App 1.0.0 (50).
- **There is no App Privacy API.** It is UI-only; an earlier "Data Not
  Collected" report here came from a swallowed 404.

## Build and release mechanics (traps that cost real time)

- **xcodebuild's export now fails with a bare `code 70`.** The real reason is
  in the xcdistributionlogs: *"Failed to find an account with App Store
  Connect access for team JBTFJ7JD4R"* - automatic signing wants an Apple ID
  signed into Xcode and there is none. The real fix is Xcode > Settings >
  Accounts. Today's workaround:
  ```
  xcrun xcodebuild -exportArchive \
    -archivePath src-tauri/gen/apple/build/instamessages-wrapper_iOS.xcarchive \
    -exportOptionsPlist src-tauri/gen/apple/build/ExportOptions.plist \
    -exportPath /tmp/konvo-export -allowProvisioningUpdates \
    -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_F9Z3VFTX73.p8 \
    -authenticationKeyID F9Z3VFTX73 \
    -authenticationKeyIssuerID fadfc58a-8c12-4d69-8483-600d0aaec371
  ```
- **A failed export leaves the PREVIOUS ipa on disk.** Twice this session a
  build "succeeded" and the artifact was the older build. **Always read
  `CFBundleVersion` out of the IPA** plus `strings` for `konvoFree=true` /
  `konvoBeta=true` before uploading or installing. That check caught it both
  times.
- Sideloading `konvo-free` to a phone: `sideload.sh` only understands beta vs
  default, so build by hand with
  `npx @tauri-apps/cli ios build --export-method debugging --ci --features konvo-free`
  then `xcrun devicectl device install app --device <id> <ipa>`. Matty16E is
  UDID `00008140-001E290E2EBA801C`, devicectl id
  `B8D54F25-B2AC-5550-BF9D-E86453EAFA13`. An App Store IPA can never be
  installed on a device: distribution profiles carry no devices.
- **The build number lives in `tauri.conf.json > bundle.iOS.bundleVersion`.**
  `Info.plist` and `project.yml` are regenerated from it mid-build.
  `--build-number` APPENDS (35 becomes "35.42") and sorts lower - never use it.
- `tauri.conf.json > version` must be semver: "1.0" is rejected, "1.0.0" works.
- Changing the cargo feature forces a full Rust rebuild: ~25 minutes, mostly
  silent output. It is not hung.
- ASC write-lag: a freshly VALID build 404s on group-attach POSTs for up to
  ~30 min while GETs see it fine. The betaAppReviewSubmission POST works
  immediately.
- **Debugging on device: NSLog is invisible.** Append to a file in Documents
  from Swift, then `xcrun devicectl device copy from --domain-type
  appDataContainer --domain-identifier com.matthewchan.konvo --source
  Documents/<f> --destination <f>`.
- Tests, always before a build: `cd wrapper/test && python3 extract.py &&
  node --check cage.js && node test_cage.js && node test_onboarding.js`.
  **`extract.py` must be re-run after every `lib.rs` edit** or the tests
  silently check stale code. It also guards the raw-string trap: `"#` inside
  CAGE_SCRIPT closes the Rust raw string, so injected HTML uses single-quoted
  attributes.

## Hard-won facts about the app

- **The welcome sequence is once per INSTALL, not once per variant.** Three
  markers mean "seen it": `konvoWelcomed` (free), `konvoBetaFree` (beta),
  `konvoPaid`. `seenSequence()` in lib.rs reads all three. Reading them
  per-variant is what made the 47 -> 48 update replay "Instagram connected"
  and the loader. This bug has now been fixed twice, in both directions - do
  not reintroduce a variant-specific read.
- **The sequence waits for the entitlement verdict** (`entitlementKnown`, 2.5s
  timeout) so a subscriber on a fresh install never sees a frame of it.
- **Updates preserve everything; delete + reinstall preserves nothing** except
  the subscription, which rides the App Store receipt on the Apple ID. A
  reinstalling user redoes onboarding and re-signs into Instagram but is never
  charged twice. Sideloading over an existing install also keeps the data
  container, so a fresh walk needs the app deleted first.
- **Signing in must be handed to NATIVE code.** A page-driven cross-origin
  navigation to instagram.com is a universal link: with Instagram installed,
  iOS opens THEIR app.
- **Instagram answers `/api/v1/accounts/current_user/` with 400** for this
  webview under every app id. The auth gate is the `ds_user_id` cookie.
- **Notifications are `/notifications/` on phones**, not
  `/accounts/activity/`. Both floating buttons drive Instagram's own router
  via pushState plus a synthetic popstate; an anchor would full-reload.
- **Instagram pushes profiles as BOTH `/name/` and `/name`.** Requiring the
  trailing slash drops half of them.
- **Never re-layout on keyboard frame notifications.** Reverted once already;
  the emoji keyboard covering the compose bar is an accepted cosmetic issue.
- **Instagram has no calling on mobile web**, so Konvo cannot have it.
  Verified by Matthew in Safari. Deleting Instagram means losing incoming
  calls.
- **`landing.tsx` styles almost everything inline, and inline beats every
  selector.** Six separate CSS changes silently did nothing this session
  before the property was moved out of the inline style. Never reach for
  `!important` - move the declaration.
- **Measure, do not eyeball.** Every type size and spacing decision that stuck
  came from reading computed styles and bounding rects in a real renderer.
  Headline copy length caps the maximum font size; changing the copy changes
  the size.

## Analytics

PostHog project **543571** ("KONVO" org). Both the app (native posts, because
Instagram's CSP blocks page-side calls) and the website report there.

Dashboard "Konvo beta": https://us.posthog.com/project/543571/dashboard/1962118
- onboarding funnel, screen by screen
- retention from `app_opened`
- beta funnel
- "Who is still using Konvo" (per-person table)
- "Active users, day by day" and "How many days a week people open it"

Events: `onboarding_screen_viewed`, `quiz_answered`, `login_started`,
`login_succeeded`, `email_submitted` / `email_captured` / `email_skipped`,
`impact_viewed`, `paywall_viewed`, `plan_selected`, `beta_free_taken`,
`delete_prompt_viewed`, `onboarding_completed`, `app_opened`, `thread_opened`.
Lean payloads by decision: event plus screen id, never quiz answer values.

**The number that matters: 19 of 33 people opened Konvo on exactly one day.**
That is the product problem, not the funnel. 38 opened, 25 signed in, 5 ever
opened a conversation - which is also why there is no honest social proof to
put on the site.

**Rotate the PostHog personal API key** used from this machine.

## The website

`konvoinstall.com` (Next.js, this repo, deploys from `main`).

- **Mobile is one black screen**: dark hero, centred, "Use Instagram / only
  for messaging", one line of description, a Download beta button straight to
  TestFlight, one uncut phone mockup, then a thin legal line. Everything else
  is hidden on phones.
- **Desktop is unchanged and light**: a three-step install modal (email ->
  Chrome extension -> platform picker). The macOS and Windows rows render
  deliberately disabled, marked SOON, because `MAC_DMG` and `WINDOWS_EXE` in
  `lib/links.ts` are null until notarization clears.
- Emails go to PostHog as a person property.
- The stripped beta funnel is intact but unrouted in
  `components/beta-funnel.tsx`; swap the component in `app/page.tsx` to bring
  it back.

## macOS

Universal DMG (arm64 + x86_64), Developer ID signed, hardened runtime,
timestamped, at `~/Downloads/konvo-mac/`. **Notarization is rejected with
statusCode 7000, "Team is not yet configured for notarization"** and
`issues: null` - nothing is wrong with the binary. Only Apple can enable it.
The older Mac app was adhoc-signed (`TeamIdentifier=not set`) and could never
have been notarized at all.

**Matthew's action:** developer.apple.com support, Development and Technical >
Other Development or Technical Questions. Submission IDs
`858e7775-3d23-449e-8208-1ff7815f32b8` and
`4bf576a6-588e-49ed-b074-027ed36ca4d3`. When it clears: resubmit, then
`xcrun stapler staple`. No rebuild needed.

## Open threads

1. **Matthew presses Resubmit** on 1.0.0 (build 50) when he is ready. Nothing
   is submitted right now.
2. **The notarization support request** - the only thing blocking any desktop
   distribution.
3. **App Privacy** in ASC declares Identifiers + Usage Data. **Add Contact
   Info > Email Address before any build carrying the email screen ships**,
   which means before v1.1.
4. **If v1.1 charges, grandfather the free v1.0 users.** Nothing implements
   this and it becomes real the moment the paywall is enabled.
5. **The paid path has never completed a purchase in any environment.**
   Xcode-local StoreKit receipts can never validate against RevenueCat. This
   is the biggest untested risk in the app.
6. `PROOF = []` in lib.rs and `QUOTES = []` in dist/index.html stay empty
   until real testimonials exist. Empty renders nothing, which is safe.
7. Human Behavior SDK is wired into the site but sends nothing until its two
   `NEXT_PUBLIC_*` vars exist on Vercel. Decide whether it earns its place
   next to PostHog.
8. Two QA findings left unfixed on purpose: the blank-snapshot guard checks
   nil rather than emptiness, and `webView.frame` is read while a transform is
   in flight.
