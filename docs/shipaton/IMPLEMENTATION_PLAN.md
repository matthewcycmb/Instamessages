# Implementation plan (2026-09-03)

Gate for every item: improves the core outcome, strengthens a Next Gen criterion, testable before Sep 30, explainable in two minutes, no new privacy or App Store risk, stronger evidence than the work it displaces.

## P0 (blocking or near-certain score movement)

| Item | User impact | Judge impact | Effort | Risk | Demo | Depends on | Why first |
|---|---|---|---|---|---|---|---|
| Guardian consent form and school email confirmed on Devpost | none | eligibility | minutes (M) | none | n/a | none | disqualification otherwise |
| License file (decision D3) and GitHub About shows it | none | C2 intake rule | minutes | license choice | README | D3 | rule text is explicit |
| README rewrite: what it is, architecture, build, run, test, privacy, known limits; remove internal handoffs and plans from HEAD | none | C2 0.5 to 2, C4 | 2 to 3 hours | none | repo | D3 | judges read the repo instead of the store |
| Demo video per DEMO_SHOTLIST.md | none | all four | half a day (M) with a fresh sandbox tester | trademark (D4) | is the demo | D4, demo account | screeners watch two minutes |
| Replace or remove the "1000+" laurel before recording (decision D6) | trust | credibility | minutes plus a build | none | visible in onboarding | D6 | unsupported claim on screen |
| Privacy disclosure matching code: privacy page and App Privacy label list the Instagram user id and username, RevenueCat id, UserJot, PostHog (decision D5) | trust | C4 | 1 hour | none | README section | D5 | claim versus code gap |

## P1 (evidence strengtheners)

| Item | User impact | Judge impact | Effort | Risk | Demo | Why |
|---|---|---|---|---|---|---|
| Cookie snapshot written with `.completeUntilFirstUserAuthentication` | security | C4 | 30 min plus build, verify on device | none | README line | closes an obvious question |
| Fix login_submitted so attempts are countable; add `login_started` to `login_succeeded` per-build tile | observability | C2 | 1 to 2 hours, cage.js and test | none | PostHog tile | attempt and failure counting is inferred today |
| Re-run the block-versus-cancel and 0 to 10 minute cancel queries with timestamps; write them into EVIDENCE_LEDGER | none | C3 | 30 min | none | n/a | quoted numbers must be fresh |
| Cite the lifetime regression test by file and line in README | none | C2, C3 | 10 min | none | repo | the failure story needs a pointer |
| Screen Time screenshots from Matthew (before if it exists, after) | none | C1 | minutes (M) | none | video card | only device-measured personal proof available |
| Devpost screenshots at 1179 x 2556 without frames (inbox, paywall, chat, unlock sheet) | none | intake | 1 hour (M) | none | gallery | current store shots are framed |

## P2 (only if time remains after P0 and P1)

| Item | Why it is P2 |
|---|---|
| Land the buyer in the latest chat after "You're in" | good product idea, no time to measure before Sep 30; projected only |
| Apple win-back offer via the RevenueCat SDK | needs ASC config and a build; effect unmeasurable before the deadline |
| RevenueCat Paywalls test through the patch switch | needs dashboard design work and days of traffic |
| Lifetime product metadata (decision D2) | a pricing decision first |

## Rejected as unnecessary for Next Gen

Referral rewards for senders, student sponsorship model, gamification, a weekly plan, freemium, Customer Center (cancels happen in iOS Settings), a web purchase flow, a crash SDK (adds a third party for a number no judge will see), any new permission or data collection.
