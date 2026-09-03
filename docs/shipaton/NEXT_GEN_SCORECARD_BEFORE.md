# Next Gen scorecard, BEFORE (2026-09-03)

Internal 10-point standard per criterion, mapped to the official 1 to 5. Evidence references are to CURRENT_TRUTH.md and FOUNDER_STORY_MINE.md.

## Criterion 1: clear, useful, interesting or original idea. Internal 8.0 / 10, projected official 4

- Understandable in ten seconds: 2.5 / 2.5. "Instagram with only the messages" needs no second sentence; ten reviews restate it unprompted.
- Real problem evidence: 2.0 / 2.5. 443 people signed in within 13 days, 10 five-star reviews, the founder's own two-week deletion story. Deduction: no independent measure of the problem beyond self-reports.
- Differentiation: 2.0 / 2.5. Versus timer blockers (Opal, one sec): removes surfaces instead of rationing time. Versus SocialLite: a hard cage, not a Reels hide. Deduction: wrappers of instagram.com exist; the difference is policy and care, which must be shown, not asserted.
- Compelling transformation: 1.5 / 2.5. One review with a number ("10+ hours ... 5 hours daily"), the rest generic; the founder's own change is self-reported.

## Criterion 2: meaningful progress toward a working app. Internal 5.0 / 10, projected official 3

- Reliable end-to-end core: 2.0 / 3. Live since Aug 21, 443 sign-ins, 119 people opened chats. Deductions: the Aug 27 to Sep 1 thread-hang saga (including a self-inflicted regression from service worker stubs, reverted), an Instagram A/B boot variant that blanks about 4 percent of thread opens (record), login depends on one cookie.
- Edge cases and recovery: 1.5 / 2.5. Reset route with a way back, challenge pass-through, login_error taxonomy, cookie snapshot restore, Ask to Buy pending branch. Deductions: login_submitted broken as a counter, no offline or timeout handling of its own, no crash monitoring.
- Demo proof on device: 1.0 / 2. No video exists yet; store screenshots are framed and staged.
- Repository reproducibility: 0.5 / 2.5. Public but no license, stale README, no iOS build or signing instructions for a stranger, internal handoffs and plans in the tree, tests undocumented.

## Criterion 3: thoughtful RevenueCat usage. Internal 6.5 / 10, projected official 3

- Technically correct: 2.0 / 2.5. Configure, offerings, live prices, eligibility check, cancelled and pending branches, restore, RevenueCatUI path, webhooks joined to product events. Deduction: the lifetime gate bug shipped to every store user for two versions; no Swift tests.
- Monetization fits recurring value: 1.0 / 2.5. The founder cannot state what the subscription keeps alive ("RevenueCat told me to keep the subscription"); lifetime pricing undecided.
- Lifecycle and recovery: 1.5 / 2.5. Lapsed wall, billing issue and expiration events tracked, trial reminder promised and delivered. Deductions: no win-back path, no Customer Center, cancels within ten minutes unsolved.
- Evidence-driven decisions: 2.0 / 2.5. Block made opt-in from trial data, paywall close removed after reading RevenueCat's benchmark, test-account filter, purchase_result event. Deduction: the record shows the first fix (moving the block) did not move cancels; the story must say so.

## Criterion 4: technical choices, product thinking, care. Internal 6.5 / 10, projected official 3 to 4

- Architecture and decisions: 2.0 / 2.5. One WKWebView, a tested URL block-list instead of a fragile allow-list (with the reason in code comments), a remote data-only patch channel, a cookie snapshot for background refresh, a Swift bridge with named commands. Deduction: the cage is 3,600 lines in one file.
- Privacy, security, reliability, testing: 1.5 / 2.5. Password never read (verified), messages never read (verified), about 100 assertions. Deductions: Instagram user id and username sent to PostHog and not disclosed in the store copy, session cookies on disk without an explicit protection class, UserJot SDK undisclosed, two undocumented Instagram endpoints.
- Analytics-driven iteration: 2.0 / 2.5. Every product change since Aug 31 has a query behind it and the beliefs that data overturned are recorded. Deduction: several events had misleading definitions for weeks (thread_ready rows, inbox_ready threads, login_submitted).
- Repo, design, presentation care: 1.0 / 2.5. No README, no license, no video, framed screenshots, the "1000+" laurel in the app.

## Totals

Internal: 26 / 40. Projected official: 4, 3, 3, 3 to 4. Tie-break order favours criterion 1, which is the strongest.

## What a 10 would require, per criterion

1. A device-measured before and after for at least the founder, one third-party number, and the ten-second line delivered in the first ten seconds of the video.
2. A repo a stranger can build (license, README, signing notes, sample config), a two-minute video with the real inbox and a purchase, login attempt counting fixed, one crash or error signal.
3. A true recurring-value sentence backed by the ops record, one lifecycle recovery path (win-back or reminder measured), and the block-versus-cancel story told as the data shows it.
4. The privacy label and copy matching the code, cookies with an explicit protection class, the cage explained as a system with counts (rules, selectors, patch turnaround), internal notes out of the public tree.
