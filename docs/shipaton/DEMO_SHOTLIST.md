# Demo shot list, target 1:50 (rules: under two minutes, on device, purchase shown, no third-party marks or music)

Setup: iPhone 16e, screen recording, portrait; demo Instagram account with staged chats (never Matthew's inbox); fresh dev build with a fresh sandbox tester (clear purchase history first) so the real paywall and Apple's sheet appear; no music unless licensed; Instagram wordmark handled per decision D4; laurel handled per D6. Narration is Matthew's, not written here.

| Time | Shot | Purpose | Rights check |
|---|---|---|---|
| 0:00 to 0:08 | Instagram app icon tapped, Reels start moving for two seconds; cut to the Konvo icon; the inbox | the problem, recognisable instantly | Instagram's own app on screen: keep to two seconds, no logo card |
| 0:08 to 0:16 | On-screen line (his words): fifteen unread after two weeks deleted | the stake | none |
| 0:16 to 0:30 | Onboarding: two quiz screens, the privacy page "Before you sign in."; the drawn login sheet with lock and live hostname, password dots, the Passwords key tip | care detail (J) | blur Instagram's wordmark on the page per D4 |
| 0:30 to 0:38 | The wall clears: the person's own inbox before any price | distinctive experience | staged names only |
| 0:38 to 0:58 | Paywall with live prices and the per-week line; tap the trial; Apple's purchase sheet; confirm; notifications page; "Send Konvo to 3 friends"; "You're in" | RevenueCat purchase and entitlement (C3) | sandbox banner is fine |
| 0:58 to 1:12 | Open a chat, reply, back; tap a route that leads to home and watch it bounce to the inbox; Explore never loads | working app (C2) | none |
| 1:12 to 1:24 | Terminal: `public/cage-patch.json` with one added selector, push; phone refreshes and the element is gone within a minute | technical detail with a unit (N) | none |
| 1:24 to 1:36 | Split card: the 1.3.0 "Loading your plans" screen beside the RevenueCat offering showing two products; the one-line fix and its test in the repo | failure and improvement (D) | none |
| 1:36 to 1:46 | Evidence card: sign-ins, trials and subscriptions with dates, the two review excerpts, Matthew's Screen Time screenshot if provided | verified outcome | quotes verbatim, attributed to App Store reviews |
| 1:46 to 1:50 | End card: repo link, "Next Gen Award", one line on why (student, built July to September 2026) | explicit category relevance | none |

No title sequence. Refresh every number on the recording day.
