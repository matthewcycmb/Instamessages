# Konvo, RevenueCat Shipaton 2026: submission draft

Written 2026-09-03 (about 02:40 UTC) from live pulls. Every number below was pulled in this session from PostHog project 569146 (test-account filter on, Apple review machines excluded), App Store Connect, the iTunes lookup API or the RevenueCat dashboard. Nothing is estimated. Refresh every number on submission day (Sep 30) with the same queries (listed at the end).

Deadline: Sep 30, 2026, 11:45 PM PDT. Devpost: https://revenuecat-shipaton-2026.devpost.com/

Status of every word: DRAFT. Matthew approves each line before it is used anywhere.

## 1. Verified numbers (Aug 21 to Sep 2, 2026)

| | People |
|---|---|
| Opened Konvo | 652 |
| Reached the Instagram login | 635 |
| Signed in | 440 |
| Saw the paywall | 396 |
| Tapped a plan | 119 |
| Started the 7-day yearly trial | 68 |
| Bought monthly outright | 4 |
| Trials converted to paid yearly | 6 |
| Trials with auto-renew turned off | 38 |
| Trials expired without converting | 3 |
| Opened at least one chat | 119 |
| Rating prompt shown | 25 |

Derived: 72 buyers (trial or purchase) = 11.3% of the 635 who reached the login page, 18.2% of the 396 paywall viewers. Of the 8 trials that started by Aug 26 (so had finished their 7 days by Sep 2), 6 converted.

PostHog funnel tool (same window, 1-day conversion window, test filter on): login_started 635, login_succeeded 432, paywall_viewed 392, rc_trial_started_event 67, onboarding_completed 63.

RevenueCat dashboard Overview (read 2026-09-03 02:30 UTC): Active Trials 60, Active Subscriptions 10, MRR $42, Revenue $164 (last 28 days), New Customers 748 (28 days), Active Customers 914 (28 days).

Revenue by RevenueCat webhook events in PostHog: 4 monthly initial purchases $30.50, 6 yearly conversions $133.62, total $164.12. No sandbox rows (every paid row is APP_STORE with a 30-day or 365-day validity).

Growth curve, new people per day (first app open, Pacific dates): Aug 21: 10, Aug 22: 17, Aug 23: 4, Aug 24: 21, Aug 25: 26, Aug 26: 22, Aug 27: 19, Aug 28: 13, Aug 29: 12, Aug 30: 32, Aug 31: 280, Sep 1: 130, Sep 2: 72.

Daily active people (opened the app or a chat): Aug 30: 51, Aug 31: 299, Sep 1: 176, Sep 2: 117.

Return days among the 440 signed in: 376 one day, 44 two days, 12 three days, 8 four or more days. (The launch is 13 days old and 482 of the 652 arrived in the last three days, so this is immature.)

Chats opened per person by outcome: converted to yearly 6 people, average 302.7, median 136.5. Bought monthly 4 people, average 81.5, median 23. Trial cancelled 37 people, average 4.7, median 3.

Trials per day (start, auto-renew off, off within 1 hour, converted): Aug 30: 7, 6, 5, 0. Aug 31: 21, 13, 10, 0. Sep 1: 20, 11, 10, 0. Sep 2 (build 101 day): 9, 2, 2, 0.

Signed-in people by country (top 10): CA 68, IN 52, US 46, FR 41, HK 27, AU 23, GB 17, KR 14, SG 11, DE 9. Fifteen countries have 5 or more.

App Store: 10 written reviews, every one 5 stars (CA 7, HK 2, DE 1; dates Aug 20 to Aug 31). Public rating counts by storefront (iTunes lookup): CA 8 ratings at 5.0, HK 2 at 5.0, DE 1 at 5.0, US/GB/FR/IN/AU/KR/SG none yet.

Versions live: iOS 1.0.0 (created Jul 25, released Aug 21), 1.1.0, 1.2.0, 1.3.0, 1.4.0, 1.5.0 (Sep 2). Mac App Store 1.2.0 and 1.3.0. Products: konvo.pro.yearly and konvo.pro.monthly APPROVED, konvo.pro.lifetime MISSING_METADATA.

Repo: first commit Jul 21, 2026; 137 commits; 24 commits on Sep 1 and 2 alone.

Invite loop (live since Sep 2): 4 real friends have claimed 3 days through RevenueCat promotional entitlements (uids 4d480925, c3f65f17, e3f12f8f, 050bc272); the other 10 three_day grants and 3 of the 4 weekly grants are smoke-test ids (smoke-*, smk-*, konvo-sm). invite_page_viewed 7 people, invite_link_copied 3, invite_friend_joined 2 senders.

Notifications page: notify_answered 8 people (12 events). Screen Time block armed (cage_enabled): 54 people. Passes used: 16 people, 39 times. Lock button tapped: 32 people.

Platform: every signed-in person is iOS (the Mac app sends no PostHog events). Phone language of signed-in people: 310 unknown (before build 79), 119 en, 3 fr, 1 zh, 1 each ja/de/fi/sk/th/es/cs. Do not lean on localization as a traction claim.

### Numbers I could NOT get, and what is pending

- App Store downloads: not in PostHog. I created an App Store Connect analytics ONE_TIME_SNAPSHOT request (id 75e30231-94df-4ac5-a6c4-e7ecdc7620dd). Reports "App Downloads Standard" (r3) and "App Store Installation and Deletion Standard" (r6) exist under it but had 0 instances at 02:30 UTC. Poll: `scripts/asc.sh GET 'analyticsReports/r3-75e30231-94df-4ac5-a6c4-e7ecdc7620dd/instances'` then `analyticsReportInstances/<id>/segments` for the gzipped TSV. Until then the only download number is the ASC web UI (Matthew).
- The "1000+ users love Konvo" laurel image (dist/proof.png) is NOT supported by anything pulled here: 652 people have opened the app, 748 RevenueCat customers in 28 days, 11 public ratings. Do not use it in the submission unless the download report shows 1000+ and Matthew is comfortable with "users" meaning downloads.
- Social post links and reach: Matthew's, not in any system I can read.

## 2. Category recommendation

Every eligible submission is considered for the Grand Prize automatically (rules page). The choice is which opt-in award to lead with.

Lead with the HAMM Award (Help Apps Make Money). Why, against the published criteria:

- "Revenue stream clarity and integration within app design": one product, Konvo Pro, hard paywall after the person sees their own inbox, yearly with a 7-day trial and monthly. Money from day 3 of the launch (Pro shipped in 1.1.0 on Aug 24).
- "Innovation beyond standard models": RevenueCat promotional entitlements power the invite loop (a friend who pastes the link gets 3 days, capped at 3 per link); RevenueCat webhooks land in PostHog on the same person as the app's events, so trial cancels are joined to in-app behaviour and drove three shipped changes in ten days; RevenueCat Paywalls can be switched on remotely through the cage patch without a release; per-week price framing from live offerings.
- "Any conversion or revenue numbers": 11.3% of login-page arrivals buy or start a trial (RevenueCat's published hard-paywall median is 10.7% per the handoff; re-verify the source before quoting), 18.2% of paywall viewers, 6 of the first 8 finished trials converted, $164 gross and $42 MRR after 13 days.

Why not the others as the lead:

- Grand Prize: automatic, and the description will carry the growth section anyway. The absolute numbers (652 opens, 10 payers) will not beat apps with thousands of installs; the curve (20 a day to 280 in a day) is the honest story and it lives in the description either way.
- Peace Prize: credible second choice (screen time, real 5-star reviews describing less scrolling), but it will be the most crowded wellness field and Konvo's impact evidence is 10 reviews. If Devpost lets one project opt into several non-influencer awards, add Peace Prize second.
- Design Award: the core screen is Instagram's own inbox in a web view. The onboarding and the drawn login sheet are polished, but "aesthetics and smooth interactions" of the app itself is not where Konvo wins.
- #BuildInPublic: posting started Sep 2; judges want the journey "shared as you go" with engagement and lessons. Four weeks of posting could make this viable by Sep 30, but it depends entirely on Matthew's posting cadence and public response, neither of which exists yet.

## 3a. Devpost text description (DRAFT, propose only)

Konvo: DMs Only

Konvo is Instagram with only the messages. Open it and you are in your inbox. The feed, Reels and Explore never load, anywhere in the app. Your chats are exactly as you left them, and everything you send shows up in Instagram like normal, because it is Instagram, just the part you actually need.

I built it for myself. Every screen time app I tried died on the same excuse: "I just need to check my messages." Konvo removes the excuse. You keep your friends and lose the feed.

How it works

- A native iOS app whose only screen is a web view of instagram.com. A script injected at document start hides or bounces everything that is not the inbox, draws the onboarding over it, and talks to native Swift through a bridge.
- You sign in on Instagram's own login page inside the app. Konvo never sees or stores your password or your messages. Nothing leaves Instagram's servers.
- Optional block of the real Instagram app through Screen Time. Two passes a day (5 minutes and 1 minute) for the things that need the real app, like posting a story or calling someone. When the pass ends, Instagram locks itself again.
- Onboarding shows you your own inbox before it asks for money, then a hard paywall.
- Every buyer gets "Send Konvo to 3 friends". A friend who pastes the link at the paywall gets 3 free days.
- Notifications for new messages, a rating prompt after the first good session, a remote patch channel that repairs the cage within 60 seconds if Instagram changes its markup, and French, Traditional Chinese and Korean.
- Also on the Mac App Store.

Built with RevenueCat

- Konvo Pro: yearly $19.99 with a 7-day free trial, or monthly $6.99. Purchase, restore and entitlements run through the RevenueCat SDK. Prices on the paywall come live from the RevenueCat offering, framed per week.
- The invite loop grants friends 3 days with RevenueCat promotional entitlements, three friends per link, then the paywall.
- RevenueCat webhooks flow into PostHog and share a person with the app's own events. That join showed that most trial cancels happen within ten minutes of starting, before anyone has used the app, and it drove the changes in 1.5.0: a reminder promise before the trial ends, a notifications page after purchase, and a clear next step after the money.
- RevenueCat Paywalls can be switched on remotely for a test without shipping a build.

Numbers (August 21 to September 2, 2026, Apple's review devices excluded)

- 652 people opened Konvo, 440 signed in to Instagram, 396 saw the paywall
- 68 started the free trial and 4 bought the monthly plan: 11% of everyone who reached the login page, 18% of the people who saw the paywall
- 6 of the 8 trials that have finished their 7 days converted to the yearly plan
- 10 paying subscriptions, $42 monthly recurring revenue, $164 gross revenue (RevenueCat)
- About 20 new people a day for the first ten days, then 280 in one day on August 31 and 130 the next
- 10 App Store reviews so far, every one 5 stars
- Signed-in people in at least 15 countries; the top five are Canada, India, the United States, France and Hong Kong
- People who pay open a median of 136 chats; people who cancel the trial open 3

Timeline

- July 21: first commit
- August 21: iOS 1.0.0 live on the App Store, free
- August 24: 1.1.0 with Konvo Pro and RevenueCat
- August 31: first promotion, 280 new people in a day
- September 2: 1.5.0 with the login sheet, the notifications page and the invite loop
- 137 commits, six iOS versions and two Mac versions in six weeks

Peace Prize note (only if opted in): Konvo is designed for one kind of person, the one who has tried deleting Instagram and reinstalled it to answer a friend. The App Store reviews describe the effect in their own words; two short excerpts are quoted below verbatim from App Store Connect and need Matthew's decision before use: "my screen time decreased drastically" (Canada, Aug 31) and "Konvo eliminated this excuse" (Hong Kong, Aug 31).

Copy rules checked: no em dashes, no en dashes, no invented counts, quotes or ratings. The "1000+" laurel is not used.

## 3b. Demo video shot list (2 minutes, on device, must show the paywall or a purchase)

Setup

- Record on the iPhone 16e (screen recording, portrait, sound off). Use a demo Instagram account with staged chats, never Matthew's real inbox. The store screenshots already use staged names.
- Fresh install of a dev-signed build with a fresh sandbox tester (clear purchase history first with `scripts/asc.sh POST ../v2/sandboxTestersClearPurchaseHistoryRequest`), so the full paywall and Apple's purchase sheet appear. The sheet will say Sandbox; that is normal for hackathon demos. If Matthew prefers a production purchase, an Apple ID that has never held Konvo Pro on the App Store build is needed.
- No music unless it is licensed or royalty free. No Instagram logo in title cards; Instagram's own pages appear only where the product inherently shows them.
- Devpost rule: judges are not required to watch past two minutes. Lead with the strongest thing.

Shots (times are targets)

1. 0:00 to 0:08. Cold open: the real Instagram app opens on Reels for two seconds. Cut. Tap the Konvo icon. The inbox. Title card: "Konvo. Instagram with only the messages."
2. 0:08 to 0:22. Onboarding: two quiz screens, the impact page, the privacy page "Before you sign in." with its three lines.
3. 0:22 to 0:40. The drawn login sheet with the lock and the live hostname. Type the demo username, the password field shows dots. Sign in. The wall clears and the person's own inbox is revealed.
4. 0:40 to 1:00. The money moment. The paywall with live prices and the per-week line. Tap the yearly plan, "Try for $0.00". Apple's purchase sheet. Confirm. The notifications page, allow. The "Send Konvo to 3 friends" page. "You're in."
5. 1:00 to 1:20. Use it: open a chat, send a message, go back. Try to leave: tap anything that would lead to the feed and show it bounce back to the inbox. Reels never load.
6. 1:20 to 1:40. Lock button in the inbox. Screen Time authorisation, pick Instagram. Switch to the home screen, tap Instagram, the shield. Back in Konvo, the unlock sheet with "Unlocks left: 2".
7. 1:40 to 1:55. Numbers card with the verified figures (refresh on the day): people signed in, trial and purchase rate, paying subscriptions, five-star reviews, countries.
8. 1:55 to 2:00. End card: Konvo: DMs Only, the App Store link, "Purchases, trials and the invite loop run on RevenueCat."

Upload as public on YouTube; paste the link into Devpost.

## 3c. Screenshot and icon checklist

- Devpost needs at least one screenshot at 1179 x 2556 with no device frame. The four live App Store screenshots (1242 x 2688) all have a device frame and a headline band, so they cannot be reused.
- Capture on the 16e (native 1170 x 2532) and resize to 1179 x 2556 with `sips -z 2556 1179 in.png --out out.png` (the aspect ratio differs by less than 0.2%). Or run the app on an iPhone 16 simulator, which captures at exactly 1179 x 2556.
- Shots to capture, demo account, dark mode: (1) the inbox, (2) the paywall with live prices, (3) a chat, (4) the unlock sheet with the two passes, (5) "You're in" with the invite line. Upload at least the inbox and the paywall.
- Icon: `wrapper/src-tauri/gen/apple/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` is 1024 x 1024 (copied to the scratchpad as store/icon-1024.png). It has an alpha channel; flatten to an opaque PNG before upload so Devpost does not render a transparent corner.
- Store URL: https://apps.apple.com/app/id6794756261 (use the campaign form with ct=devpost if attribution per channel is wanted: https://apps.apple.com/app/apple-store/id6794756261?pt=129211722&ct=devpost&mt=8).
- Judge access: the 7-day trial on the yearly plan satisfies the rule. Risk: a judge has to sign in to Instagram with a real account inside a third-party app to reach the paywall. Mitigations for Matthew to decide: an App Store offer code as the stated alternative, and a demo Instagram account with 2FA off in the Devpost testing notes (Instagram challenged App Review's login once, so the video must carry the weight).
- Category opt-in: HAMM (Peace Prize second if multiple opt-ins are allowed). #BuildInPublic needs social links; only opt in if there is a month of posts to show.

## 4. What would raise traction or RevenueCat usage before Sep 30 (effort order)

Nothing here is started. Each needs Matthew's go.

1. Refresh the numbers on Sep 30 and again for the video card. Effort: minutes, all mine. Evidence: every figure above has a query.
2. Put the campaign links in every bio and post (ct=instagram, ct=tiktok, ct=x already exist; add ct=devpost). Effort: Matthew's clicks, zero code. Evidence: Apple attributes downloads and revenue per campaign in App Analytics, which is the only download source we have.
3. Land the buyer inside their latest chat after "You're in" instead of the inbox. Effort: small change in cage.js plus a test, one build. Evidence: cancels cluster at 0 to 10 minutes with inbox_ready as the last event; converters open a median of 136 chats, cancellers 3; RevenueCat's own post-purchase guidance names a clear next step as the fix for day-0 cancels. Listed first among the open ideas in the handoff.
4. Complete the lifetime product's metadata in App Store Connect so RevenueCat can return $rc_lifetime. Effort: Matthew's clicks in ASC, then verify on a TestFlight build that the paywall renders a third card correctly (the gate ignores lifetime today, so check the layout before exposing it). Evidence: a second, higher-ticket revenue stream is exactly what HAMM's "diverse revenue streams" line asks for; the product already exists as konvo.pro.lifetime at $79.99.
5. Apple win-back offer for lapsed trials, presented by the RevenueCat SDK. Effort: an offer in ASC (Matthew), a small Swift addition to surface it, one build. Evidence: 38 of 68 trials turned auto-renew off and 0 of 19 earlier cancellers came back on their own; Apple also surfaces win-back offers in the App Store itself.
6. RevenueCat Paywalls test through the remote switch. Effort: design the paywall in the RevenueCat dashboard (Matthew), flip `rcPaywall: true` in cage-patch.json for a share of days, read paywall_viewed to trial starts before and after. Evidence: 18.2% paywall-to-buy today; the switch and the rc_paywall result event already exist; it also makes the "uses RevenueCat Paywalls" line true for HAMM.
7. Build-in-public posts with the real numbers, weekly, on X, TikTok and Instagram, each with the campaign link. Effort: Matthew's time. Evidence: the one promotion day produced 280 new people; #BuildInPublic is a separate $30,000 award that needs a month of posts to be credible.
8. Invite loop visibility: mention "3 free days for friends" in the posts. Effort: none in code. Evidence: 4 real friends have joined in the first 14 hours; the loop is live and measured (invite_friend_joined, referral_days_granted).
9. Later, not before Sep 16: a 14-day trial test on annual, freemium, or a weekly plan. The Sep 2 memory says no price or trial changes until the build 101 cohort has two weeks of data.

Not recommended: RevenueCat Customer Center for cancel-flow offers (cancels happen in iOS Settings, not in the app), Web Billing on konvoinstall.com (large, no evidence of web demand), a second product line.

## 5. Queries to rerun on submission day

All against PostHog project 569146 with the Apple exclusion subquery: app events with `build` set, country US, city Cupertino or empty state.

- Funnel and outcomes: uniqIf(person_id, event = X) for app_opened, login_started, login_succeeded, paywall_viewed, plan_selected, thread_opened, onboarding_completed, review_asked, rc_trial_started_event, rc_initial_purchase_event, rc_trial_converted_event, rc_trial_cancelled_event, rc_expiration_event, timestamp >= '2026-08-20'.
- Revenue: sum(properties.revenue) on rc_trial_converted_event and rc_initial_purchase_event (and rc_renewal_event once it exists) with store = APP_STORE.
- New people per day: min(toDate(toTimeZone(timestamp, 'US/Pacific'))) per person over app_opened.
- Countries: uniq(person_id) by properties.$geoip_country_code on login_succeeded.
- RevenueCat Overview: app.revenuecat.com project cce508b7 (Matthew's Chrome session is signed in).
- App Store: `scripts/asc.sh GET 'apps/6794756261/customerReviews?limit=50'` and the iTunes lookup per storefront.
