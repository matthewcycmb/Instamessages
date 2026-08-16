# Konvo handoff (Aug 16, 2026, end of the block-feature day)

Repo: `/Users/matthewchan/Instamessages`. Matthew runs `/ponytail:ponytail
ultra` on coding tasks. Hard rules: **never commit or push without his
explicit word** (pushes to `main` deploy konvoinstall.com), never use em
dashes in user-facing copy, never invent social proof or a claim the app
cannot back. Do what you can yourself; only hand Matthew what only he can
do (ASC/portal buttons, physical phone, Apple support). His memory files in
`~/.claude/projects/-Users-matthewchan-Instamessages/memory/` carry the
standing decisions - read `MEMORY.md` first, especially
`konvo-cage-decisions` and `konvo-posthog-access`.

## The working loop (how this session operated; keep it)

Every change: edit -> `cd wrapper/test && python3 extract.py && node
--check cage.js && node test_cage.js && node test_onboarding.js` -> build
`npx @tauri-apps/cli ios build --export-method debugging --ci --features
konvo-beta` (run in background; ~4 min warm, ~25 min after a cargo feature
flip) -> **verify the IPA before installing** (a failed export leaves the
PREVIOUS IPA on disk; every sideload stamps CFBundleVersion 51, so check
file mtime + `strings` for a marker of the new code + `konvoBeta=true`) ->
`xcrun devicectl device install app --device
B8D54F25-B2AC-5550-BF9D-E86453EAFA13 <ipa>` -> Matthew walks it and sends
screenshots -> iterate. Onboarding replays only on delete + reinstall.
The phone drops off devicectl constantly; ask him to re-seat the cable.
TestFlight only after his explicit sign-off (see release recipe below).

## Where things stand

| Track | State |
|---|---|
| App Store 1.0.0 | build 50 (konvo-free) SUBMITTED, in review. DO NOT TOUCH. |
| TestFlight | build 51, ancient (Aug 15, pre-block). Next upload of anything is **52**. |
| Matthew's iPhone (Matty16E) | latest local konvo-beta build, sideloaded Aug 16 ~10:45pm, everything below included |
| Website | untouched today; `main` deploys it |
| macOS | still blocked on Apple enabling notarization |
| Branch | `konvo-onboarding-v2`, all of today committed and pushed (not merged to main) |

## The block (the day's centerpiece; locked decisions)

Konvo now shields the native Instagram app via Screen Time. Grilled and
locked: block-first onboarding (the delete-Instagram ask is DELETED from
the product), the block offer is optional ("Not now" -> perks), and every
blocked user gets **the pass**: once a day, pick a reason (story / call /
post / other), Instagram unlocks and **relocks itself after 3 minutes of
use**. Paid-vs-free decision deferred until beta data; the standing v1.1
constraint is decline-lifts-the-shield (no hostages). Feature-level
blocking of native IG is impossible for everyone (Apple shields whole apps
only), which makes Konvo's webview the only legal Reels-free Instagram -
that is the moat, use it in copy.

Mechanics: three app extensions in `gen/apple/` (ShieldConfig = the
branded shield, ShieldAction = Close + "Get my messages" notification
bounce, ActivityMonitor = the relock). App group
`group.com.matthewchan.konvo` carries the FamilyActivitySelection to the
monitor (registered in the portal BY MATTHEW; API keys cannot create app
groups). Bridge cmds in KonvoStore.swift: cageStatus / cageAuthorize /
cagePick (embedded FamilyActivityPicker, Opal-style scaffold) / cageOn /
cageOff / cagePass. The pass schedule: DeviceActivity 16-min interval
(Apple minimum is 15) + 3-min usage-threshold event; backstops = interval
end + relock-on-next-Konvo-launch (4 min check in cageStatus).

**THE #1 OPEN THREAD: the relock has never been observed to fire.** Two
field tests failed silently. The monitor extension now reports its own
lifecycle straight to PostHog (`cage_monitor_started`, `cage_relock` with
via=threshold|interval, `cage_relock_blind` = ran but could not read the
selection). Matthew's next pass (his daily pass was spent; tomorrow) gives
the verdict: no monitor_started = extension never launches (embedding /
entitlement); relock_blind = app-group read fails in the extension;
relock via=threshold = it works. Each is a different fix. Check PostHog
first thing.

## Today's other changes (all in the one big Aug 16 commit)

- Onboarding: S0 hand-mockup hero (phone-hero.png, alpha-trimmed, fade),
  attribution screen s2a (Where did you hear about Konvo, 5 options with
  icons, `attribution` event), email screen s1b DELETED, quiz progress
  bars removed, dwells trimmed a third, pass hero s8c ("One pass a day."),
  Screen Time connect page = Opal replica (dialog echo + arrow + Apple
  footer), blocked-confirmation page, loader spinner finally spins
  (@keyframes im-spin was missing since birth; a test now asserts every
  wall animation has keyframes).
- Appearance: the WHOLE funnel follows the system scheme (launch light-pin
  removed from lib.rs objc block; S5-S7 stays dark by design; wall has a
  doubled-id dark block; dark --bg is pure black to meet the letterbox).
  TRAP: the wall lives in Instagram's document and their global element
  rules beat inheritance - h1-h6/b/u/i carry `color:inherit` now; any new
  wall element type may need adding.
- DM composer autocorrect/autocapitalize/spellcheck forced on (Instagram
  ships them off).
- Identity: first authed inbox settle $sets ig_user_id (ds_user_id cookie)
  + ig_username (title element) once per install. Every native track
  carries `build` (CFBundleVersion) + `variant` (free/beta/default).
  New events: login_step (login/challenge/two_factor), inbox_ready
  {threads, ms}, pass_used {reason}, cage_* funnel.
- PostHog (project 543571, use the `posthog-konvo` MCP): dashboard rebuilt
  - ONE onboarding funnel ("Onboarding, every screen to the inbox", ends
  at a "Reached the inbox" action), "The journey, in people" bar chart,
  "User growth, day by day", roster, retention, stickiness. Test-account
  filter excludes matthewchan071010@gmail.com (TRAP: person-property
  filters evaluate at ingestion time, so his device counts until the walk
  types his email; his anon devices are unfilterable until build stamps).
- Numbers that drove decisions: externals 47 started -> 38 tapped sign-in
  -> 23 connected -> 5 ever opened a thread; delete ask stalled 2/3; email
  screen killed nobody at itself but its cohort converted 1/5 (n=5).

## Build/release traps (Aug 16 vintage; the old ones in git history still hold)

- `project.yml` is the source of truth; `xcodegen generate` is safe and
  REWRITES the entitlements files (declare entitlements in project.yml
  `properties`, never hand-edit the files). pbxproj is tracked; regen then
  diff.
- The stale-artifact trap extends to `ExportOptions.plist`: a debugging
  build leaves method=debugging there, and a later manual exportArchive
  will happily dev-sign an App Store IPA (ASC rejects with 90161). Use an
  explicit plist (scratchpad has ExportOptions-appstore.plist).
- App Store export & upload recipe that works: tauri build fails at export
  (code 70, keychain) -> manual `xcodebuild -exportArchive` with
  `-allowProvisioningUpdates -authenticationKeyPath
  ~/.appstoreconnect/private_keys/AuthKey_F9Z3VFTX73.p8
  -authenticationKeyID F9Z3VFTX73 -authenticationKeyIssuerID
  fadfc58a-8c12-4d69-8483-600d0aaec371` -> verify -> `xcrun altool
  --upload-app -f <ipa> -t ios --apiKey F9Z3VFTX73 --apiIssuer <same>` ->
  scratchpad/tf_ship.py 52 (poll VALID) then `tf_ship.py 52 attach`
  (betaAppReviewSubmission + External Friends group).
- Standalone `xcodebuild archive` CANNOT run tauri's Rust phase (panics
  wanting the tauri CLI parent) - but a failed standalone archive with the
  auth flags DOES mint provisioning profiles, which then let the normal
  tauri build sign. That two-step unblocked the extensions.
- Cloud signing auto-creates bundle IDs but NOT app groups or
  group-carrying App IDs - those were portal work (done: the group +
  com.matthewchan.konvo.activitymonitor with App Groups + Family Controls).
- Swift literals under ~16 bytes are invisible to `strings` (inlined);
  verify with longer strings. dist/index.html rides compressed in the
  binary - verify page changes by tests + fresh mtime, not strings.
- Playwright headless verifies dist pages: scratchpad/shoot_onboarding.py
  (iPhone UA + viewport + colorScheme). Screenshot before installing when
  the change is visual.

## Matthew's pending buttons (unchanged unless noted)

1. App Store review verdict on 1.0.0 (build 50). If rejected for the
   description's false "no analytics" claim, the honest rewrite is drafted
   in the Aug 16 session log; App Privacy also needs Contact Info: Email
   (build 50 ships the email screen!) and User ID (ig identifiers in 51+).
2. Notarization support request (macOS).
3. Rotate the leaked PostHog personal key (phx_...; the posthog-konvo MCP
   replaced it).
4. Send the testimonial asks (drafted Aug 16) to the 3 heavy users +
   dansuke77; verbatim quotes go into PROOF (lib.rs) and QUOTES (dist).

## Next moves, in order

1. Tomorrow's pass test -> read the cage_* events in PostHog -> fix the
   relock per which diagnostic fires.
2. When Matthew signs off a full walk: bump tauri.conf bundleVersion to
   52, TestFlight upload via the recipe above.
3. Watch the new-flow funnel as TestFlight onboarders arrive (the
   connect-page conversion answers "would people block?", the s4-s7 stall
   question needs n=15).
