# Evidence ledger (2026-09-03)

Safe = may be used in the submission as worded. C1 to C4 = Next Gen criteria.

| # | Claim | Support | Range | Conf | Limits | Safe | Crit |
|---|---|---|---|---|---|---|---|
| 1 | Konvo has been on the App Store since Aug 21, 2026, six iOS versions by Sep 2 | ASC appStoreVersions, 2026-09-03 02:20 UTC | Jul 25 to Sep 2 | high | none | yes | C2 |
| 2 | 443 people signed in to Instagram inside Konvo in its first 13 days | PostHog SQL, login_succeeded unique persons, 04:05 UTC, Apple excluded | Aug 21 to Sep 3 | high | persons not installs; Matthew's devices included | yes | C1, C2 |
| 3 | 68 started the 7-day trial and 4 bought monthly; 6 trials converted; 10 active subscriptions | PostHog rc_ events 04:05 UTC; RevenueCat Overview 02:30 UTC | Aug 24 to Sep 3 | high | 57 trials immature | yes | C3 |
| 4 | 6 of the first 8 trials that completed their 7 days converted | PostHog trials by day, 02:35 UTC | trials started Aug 24 to 26 | high | small n; alias overlap on one row | yes, with n | C3 |
| 5 | $164.12 gross revenue, $42 MRR | PostHog revenue sum; RevenueCat Overview | to Sep 3 | high | RevenueCat reported, before Apple's cut | yes | C3 |
| 6 | 11.3% of people who reached the login page started a trial or bought; 18.2% of paywall viewers | derived from 2 and 3 (72 / 641, 72 / 399) | Aug 21 to Sep 3 | high | mixed cohorts across builds | yes, as derived | C3 |
| 7 | 10 App Store reviews, all five stars | ASC customerReviews 02:20 UTC | Aug 20 to 31 | high | 7 from Canada, likely his network | yes | C1 |
| 8 | Review excerpt: "i've been consistently getting 10+ hours of screentime (daily average) for a month straight ... after switching to konvo, my screen time decreased drastically (5 hours daily" | ASC review by aliisasa, CA, 2026-08-31, public | n/a | high | self-reported by a reviewer; public review text | yes, verbatim, attribute as "an App Store review" | C1 |
| 9 | Review excerpt: "When i used other apps, i just ended up still using insta bcus i had to 'check my msgs' but Konvo eliminated this excuse" | ASC review by KadenWong1, HK, 2026-08-31, public | n/a | high | generic praise beyond this line | yes, verbatim | C1 |
| 10 | The cage is a five-rule URL block-list plus CSS, enforced in the page, with a remote data-only patch channel live in about 60 seconds | cage.js:550, 1395 to 1428; public/cage-patch.json | code | high | patch reach blocked by one Instagram CSP variant (record) | yes | C4 |
| 11 | Stories, profiles and single posts stay open by design | cage.js:531 to 547, in-app copy at 106 | code | high | contradicts "no Reels anywhere" only for the single reel permalink | yes, state it | C1, C4 |
| 12 | Konvo never reads the password: the code checks only that the field is non-empty | cage.js:744 to 745 | code | high | none | yes | C4 |
| 13 | Messages are never read or sent anywhere | no selector reads message bodies; inbox_ready counts links | code | high | none | yes | C4 |
| 14 | Instagram user id and username are sent to PostHog once | cage.js:1202 to 1207 | code | high | must be disclosed if the privacy story is told | yes, as disclosure | C4 |
| 15 | The 1.3.0 paywall hung for every store user because the gate waited for a product Apple never approved; fixed in 1.4.0 with a regression test | konvo-storekit-lifetime-trap record; ASC lifetime MISSING_METADATA; PostHog build 78: 46 at paywall, 0 completions | Aug 30 to 31 | high | the test file line to be cited in the repo | yes | C2, C3 |
| 16 | Moving the Screen Time block out of onboarding did not reduce trial cancels (11 of 19 without versus 16 of 26 with) | konvo-block-optin record, Sep 1 evening | Aug 30 to Sep 1 | med | small n; recorded in a memory file, re-run before quoting | yes after re-run | C3, C4 |
| 17 | Cancels cluster at 0 to 10 minutes after the trial starts (21 of 31) | trial cancel record, Sep 1 | Aug 24 to Sep 1 | med | re-run on submission day | yes after re-run | C3 |
| 18 | 101 builds by Sep 2 | live build 101; 27 build numbers in commit messages | Jul 21 to Sep 2 | high | builds, not releases | yes | C4 |
| 19 | The API version was deleted after two days because Meta's API allows no group chats and no reply after 24 hours | README, commit f58d1c5, Jul 21 memory | Jul 21 to 23 | high | none | yes | C4 |
| 20 | Matthew went from about five hours a day on Instagram to none on Reels | his estimate, Q8 | summer 2026 | low | self-reported until Screen Time screenshots | no, until screenshots | C1 |
| 21 | 280 new people in one day from a LinkedIn post | PostHog first-day cohort (280 on Aug 31); LinkedIn attribution is Matthew's word | Aug 31 | med | link pending | number yes, cause "after a LinkedIn post" only with the link | C1 |
| 22 | 1000+ users | none | n/a | none | unsupported | no | none |
| 23 | 4 friends have claimed 3 free days through RevenueCat promotional entitlements | PostHog rc_non_subscription_purchase_event, non smoke ids | Sep 2 to 3 | high | tiny n | yes, with n | C3 |
| 24 | The Aug 31 spike followed a public LinkedIn post announcing App Store approval | LinkedIn urn:li:activity:7500010677047246848, fetched 2026-09-03 (public page, "3 days ago", 1,553 likes, 303 comments at fetch time); PostHog 280 first-day people on Aug 31 | Aug 31 | high | engagement counts change; quote the post's own lines only | yes, with the fetch date | C1 |
| 25 | Post claims "after facing 6 back to back rejections" and "after developing 73 builds" | LinkedIn post text | to Aug 30 | med | rejections count to be checked against ASC review submissions; 73 builds consistent with build 78 live that day | after ASC check | C2 |
| 26 | The brain dump predates the first commit and records the two-week deletion, the fear of reverting and the friends' DMs as the reason to return | Matthew's document (verbatim in FOUNDER_STORY_MINE.md), undated | Jul 2026 | med | file timestamp would date it; it is his own text | yes, as "a note I wrote before starting" | C1 |
| 27 | The LinkedIn post reached 210k+ impressions | Matthew's LinkedIn analytics (only he can see it); post text confirms "6 back to back rejections", "73 builds", "6 hour + work days" as his own public claims | Aug 31 onward | med | needs a screenshot of the analytics panel in the evidence folder before it is quoted; impressions are not people who installed | yes, as "my post reached 210k+ impressions", with the screenshot | C1 |
