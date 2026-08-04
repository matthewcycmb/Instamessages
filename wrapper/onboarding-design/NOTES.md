# Onboarding design — v2 INTEGRATED Aug 2 2026 (uncommitted; not in the
# build under review). Supersedes the Aug 1 v1 integration below.
#
# The approved sheet (this folder's index.html, v4.12) is now the app:
# dist/index.html carries S1-S10 (intro w/ inbox render, motive question
# with stable values, slider to 8h+, range pills with the gating rule, the
# dark S5-S7 impact stretch via a new "dark" appearance pin, S8a/S8b hero
# duo with WebP renders, privacy, handoff). The motive + weekly hours ride
# to instagram.com in the #konvo= fragment; CAGE_SCRIPT persists and strips
# it. Post-login: S12 connected -> S12b loader -> S13 paywall (live
# StoreKit prices/trial via the new KonvoStore "products" command; trial
# only rendered when the user is eligible) -> S14 success. The weekly
# counter-offer is gone; close (x) lands on the v1 hard stop (kept as the
# default for the still-open close-destination question). ASC still has the
# yearly trial at 7 days - flip to 14 before release, the UI follows live.

Static 15-screen mockup sheet from Claude Design (open index.html in a
browser). Now wired in: S1-S9b+S10 live in `wrapper/dist/index.html`
(iPhone-only; the Mac still gets the splash redirect), S11-S15 are injected
by CAGE_SCRIPT on the instagram.com origin behind a real StoreKit 2 gate
(KonvoStore.swift in gen/apple). Deviations taken at integration: S1b/S1c
and S1's "I already have an account" link not shipped (no accounts, per
HANDOFF Q1), fragment config passing deleted (single-behavior app needs no
cross-origin quiz state). S12 keeps the Yearly/Monthly toggle (Matthew's
call, Aug 1): Monthly is $4.99 no trial, headline swaps to "16¢ a day" and
the trial timeline hides so the visible tab never lies; monthly and weekly
purchases skip S15 ("Seven days free" is yearly-only copy).

S6 strictness question REMOVED (Jul 31): the app has one behavior, so no
konvo.stories/heart/reels cage flags and no fragment config passing are needed.
Ignore those parts of the brief. S11 is now a concrete "what you get" page.

Integration TODO (when review is accepted):
- S1–S9 become the real `wrapper/dist/index.html` flow; S10–S15 are the
  post-login overlay injected by CAGE_SCRIPT (see konvo-onboarding-brief.md
  and the konvo-onboarding-decisions memory for the locked flow/pricing).
- Hardcoded mockup values to wire: slider "2 h 30 m", "~9 years", "≈ 2 h 10 m
  a day back", pre-selected cards, $29.99 / $4.99 / $1.99 prices, plan toggle.
- Mockup chrome to drop: phone frames, fake status bars, screen labels.
- S1b/S1c add Konvo account creation (Apple/Google/email) after Get started —
  contradicts the brief's "no account creation"; justified only by iOS-sub →
  Mac-app unlock sync. Needs a real auth backend before it can ship.
- Design deviations from the brief, decide at integration: light theme
  (brief said dark-only #000), accent #0a5cf0 vs app's #0a84ff, and S1's
  "I already have an account" link (no such concept — everyone signs in
  with Instagram).

## v5 sheet (Aug 3 2026)

index.html is now captures of the implemented app (20 frames, dist +
cage paywall). The v4 mockup sheet moved to index-v4-mockup.html with its
decision log intact. Regenerate: serve wrapper/dist on :8735, build the
cage harness (fake instagram location + bridge with sim-store values +
a ds_user_id cookie so the auth gate opens, pattern in test_cage.js
boot()), then drive both with playwright-core at
390x844@2x walking every screen past the tap locks.
