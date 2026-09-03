# Transformation log

Status vocabulary: observed (live data after the change), technically verified (tests or device walk), projected (expected, not yet measured).

## Entry 1: paywall gate required a product Apple never approved (already shipped, recorded for the pack)
- Before: 1.2.0 painted stand-in prices; 1.3.0 hung on "Loading your plans" for every store user; PostHog build 78: 46 people at the paywall, 1 plan tap, 0 completions; about ten reports and one email during the Aug 31 spike (Matthew, Q6).
- Problem: the gate waited for yearly, monthly and lifetime; lifetime is MISSING_METADATA in ASC; dev builds read a local StoreKit file that had it.
- Change: gate requires only the sold products (1.4.0, build 82); regression test boots a wall whose products reply lacks lifetime.
- After: 1.4.0 and later store users see prices; trials on Aug 31 and Sep 1: 21 and 20 (PostHog trials by day, 02:35 UTC).
- Status: observed. Judge proof: ASC product state, the test, the PostHog tile. Limit: the exact test line to be cited in README.

## Entry 2: Screen Time block moved out of the purchase path (already shipped)
- Before: 76 percent first-hour cancels when the block went live at purchase (38-trial sample).
- Hypothesis: the block scared people off. Change: block opt-in from the inbox (1.4.0).
- After: build 84 still cancelled 11 of 19 (58 percent) versus 16 of 26 with the block; the hypothesis failed. Second finding: cancels cluster at 0 to 10 minutes. Change 2: reminder promise, notifications page, post-purchase chain (1.5.0, build 101). After 2: Sep 2, 9 trials, 2 cancelled within the hour.
- Status: observed for the failed hypothesis; projected for 1.5.0 (n = 9). Earliest valid read: 2026-09-09 (one week of build 101). Query: trials by day with cancel_min <= 60, timestamp >= 2026-09-02 07:00 UTC.

## Entries planned (P0 and P1), to be filled when done
- License, README, internal notes removed: technically verified by a fresh clone build.
- Cookie snapshot protection class: technically verified on device.
- login_submitted fix: technically verified in test; observed after one week of a released build.
- Laurel replaced: technically verified in the IPA.

## Entry 3: Instagram username no longer sent to PostHog (decision D5, 2026-09-03)
- Before: on the first settled inbox, cage.js set PostHog person properties ig_user_id and ig_username (cage.js:1202 to 1207); the store copy disclosed only "basic usage analytics".
- Problem: a username is direct personal data; the invite code needs it locally, analytics does not.
- Change: cage.js sets only ig_user_id; the handle stays in localStorage.konvoHandle. Test updated (test_cage.js, identity block) to assert ig_username is undefined.
- Instrumentation: none new. Metric expected to move: none; this is a privacy correction.
- Tests: test_bridge and test_onboarding pass; test_cage passed 2026-09-03 05:26 UTC (ALL CAGE TESTS PASS, exit 0).
- After: ships with the next build (1.5.1 build 102 is already built without this; needs 1.5.2 or a rebuild of 1.5.1 as build 103). The "Paying users by Instagram handle" PostHog tile stops filling for new people.
- Status: technically verified (all three suites pass); not yet in any IPA.
- Judge proof: the diff and the test line; the privacy page wording (copy for Matthew to approve): "Konvo sends an anonymous device id, the app's build number and which setup screens you reach to our analytics. It also records your Instagram account's numeric id once, so we can tell returning devices apart. It never sends your username, your password or any message."
- Remaining: App Privacy label in App Store Connect must list User ID (Matthew's click); ASC review submission list shows 8 COMPLETE submissions since Aug 29, no rejection count, so the "6 back to back rejections" in the LinkedIn post stays Matthew's own count, unverified by the API.

## Entry 4: public repository readiness (2026-09-03, approved by Matthew)
- Before: public repo, no license, README describing a July architecture, internal handoffs and plans in the tree, .env.example listing only the analytics key.
- Change: LICENSE (MIT) at root; README rewritten (what, why, the cage with its five rules and 39 selectors, the patch channel, what broke and what changed with the gate and its test named, RevenueCat usage, data that leaves the phone, build, tests, known limits, layout); HANDOFF.md, HANDOFF_PROMPT.md, humanbehavior-install-report.md, docs/handoffs and docs/superpowers moved to ~/Instamessages-private; .env.example lists every variable the site reads (names only); .gitignore ignores docs/shipaton for future files.
- Found while doing it: docs/shipaton was already committed in HEAD (cae6a0f) by Matthew, so the workspace is in the repo history; decision needed on removing it from the tree.
- Tests: none affected (documentation and file moves only).
- Status: technically verified locally; observed by judges only after Matthew commits and pushes.
- Judge proof: GitHub About shows MIT; README sections map to the four criteria.
