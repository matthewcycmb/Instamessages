# Shipaton winner pattern matrix (2024 and 2025) for Konvo's 2026 Next Gen entry

Written 2026-09-03 from saved page text in the session scratchpad (`winners/*.txt`). Every quotation is the submission's or RevenueCat's own words. Dashes inside quotations were replaced with commas to keep this file dash free. "Before deadline" means visible in the Devpost story as submitted (2024 deadline Sep 19, 2024, 11:45 pm PT, with a one day extension mentioned by Meshing; 2025 deadline Sep 30, 2025, 11:45 pm PT). "Posted later" means a Devpost update or recap blog dated after that. Devpost likes and comments are recorded but treated as noise.

Sources fetched: both recap blogs (200), the 2025 Devpost winners update (Devpost serves HTTP 403 with a full body, content was real), 2025 rules (full), 2024 rules (the given URL `revenuecat-ship-a-ton-2024.devpost.com/rules` 404s; the real 2024 site is `revenuecat-ship-a-ton.devpost.com/rules`, fetched in full), all nine project pages, nine YouTube watch pages. Payout's video (C7GRMcHE0HQ) is now private, so its length is unknown. No JS shells were encountered. Bonus: 2026 rules were fetched for the Next Gen criteria (quoted in section 3).

## 1. Per winner sections

### Payout (2025 Grand Prize: Build & Grow Award)

- Criteria that year (2025 rules): "Early and Effective Release. Explain when you first put a live, usable version in front of real users, why you shipped at that moment" and "Growth-by-numbers. Share the iterations, marketing efforts, and experiments you ran after launch and link them to concrete results: Installs, active users, paying customers, MRR/ARR". The recap blog instead lists "Innovation, Execution, Feasibility, Integration" for the Grand Prize; the two documents disagree.
- Value proposition: "Discover brands that owe you money through class action settlements."
- Primary spike: numbers plus a vibe coding hook. "Shipped v1 in 10 days by leveraging AI."
- Problem evidence: "Millions of dollars in class-action settlements go unclaimed every year". No source given.
- Working product evidence: App Store and Google Play links, website, "In-App Event" screenshot.
- Technical depth: stack list only. "React Native", "Node.js + TypeScript REST API", "Hosted on Vercel", "RevenueCat + Adjust + Mixpanel".
- Product and design craft: "App Store Screenshots (Made In Figma)", "Figma all day every day". Generated icon and art.
- RevenueCat's role, their words: one line, "Analytics: RevenueCat + Adjust + Mixpanel". Nothing about paywalls or entitlements.
- Monetization logic: "A/B testing pricing is crucial to optimize your LTV". No price named.
- Traction as stated in the submission (before deadline): "17,000+ users", "$30,017 revenue", "1750+ paid subscriptions", "500,000 X impressions about the app".
- Posted after judging: the recap repeats the same four numbers; no Devpost update.
- Demo video structure: not determinable from text (video private).
- Gallery: 3 images, captions "In-App Event", "Unseen Monetization Strategies!", "App Store Screenshots (Made In Figma)".
- How the writing guided judges: emoji headings, a four line number block under "Accomplishments", the vibe coding claim in the first paragraph, tagline ends "no proof required*".
- Distinctive: revenue in dollars to the unit, "not one line of code written by hand".
- Merely polished: the "What's next" list ("macOS desktop client").
- Transfers to Konvo: numbers in one block, one hook sentence up top, a stated ship date.
- Cargo cult risk: Konvo's numbers are two orders smaller; copying the number block without the growth story would look thin.

### Gurwi: Learn Anything (2025 #BuildInPublic Award, 1st)

- Criteria (2025 rules): "Sharing your story", "Engagement", "Lessons Learned", with "Note that audience size does not matter."
- Value proposition: "Learn anything through our unique format of visual, interactive, and multilingual bite-sized lessons."
- Primary spike: founder story with a viral origin, plus scale of engineering.
- Problem evidence: "out of every 100 children who begin primary school, only 44 manage to graduate from high school on time", PISA results, "more than 80% of final-year students fail to understand basic texts".
- Working product: store links, "over 1,000 reviews in the app stores and an average rating of 4.9", though "the five lessons currently available".
- Technical depth: "a completely new file format, the .gurwi format", "more than 3,000 lines of code within a .gurwi file", "our database alone consists of 10 schemas, 65 tables, 39 functions, and 36 triggers", editor "Gurwi Educators" in Next.js.
- Craft: "MVPs (Minimum Viable Products) are no longer worth it", they aimed for a "Minimum Lovable Product".
- RevenueCat's role, their words: "his first time integrating payments with RevenueCat, implementing push notifications, and deploying edge functions with Supabase."
- Monetization logic: "showing a subscription prompt immediately after registration seemed far too invasive, but when we dared to try it, we were thrilled: our subscriptions skyrocketed."
- Traction before deadline: "over 13,000 users in just the last two months of the Shipaton", "1,000+ app store reviews", "4.9-star average", viral video "more than 200,000 views and 40,000 likes" (May 2024, pre hackathon).
- Posted later: Devpost update Oct 3, 2025 (during judging): "Total users: 17,696", "Active subscriptions: 228", "MRR: US$1,145", "Total revenue: US$2,668", "TikTok, 54.8% (9,011 users)". Recap: "over 13,000 users", "1,000 app store reviews", "4.9 rating".
- Video: 3:28, titled "Gurwi, the app that could change the way we learn". Structure not determinable from text.
- Gallery: 11 images, no captions.
- Guidance: numbered subsections inside each Devpost heading, an eight point roadmap.
- Distinctive: hardship narrative ("neither parent had a job") plus a file format.
- Merely polished: long roadmap ("Agentic Era", "B2B and B2G").
- Transfers: name one artefact you invented (Konvo's cage patch channel) and give its size in real units.
- Cargo cult: hardship prose without Gurwi's stakes would read as padding.

### Dayloop: Everyday Timelapse (2025 RevenueCat Design Award, 1st)

- Criteria (2025 rules): "Innovative ideas. Does the app introduce any innovative technology or designs?" and "Aesthetics. Is the app simply delightful to look at and use? Does the design spark joy?"
- Value proposition: "the app takes all the hassle out of creating a timelapse video."
- Spike: one magic feature, "Auto Face Alignment", which makes value visible "in under a minute".
- Problem evidence: App Store review mining. "Some apps were outdated but still had tons of reviews, showing strong past interest."
- Working product: App Store link, five localizations "English, French, Spanish (LATAM), Portuguese (Brazil), and German".
- Technical depth: "Swift, SwiftUI (a bit of UIKit here and there), SwiftData and Vision Framework". Bugs named: "batch processing leading to unexpected memory leaks, saved images randomly flipped upside down due to mismatched orientations, and Core Image vs. SwiftUI having different coordinate systems".
- Craft: "Ghost Photo" overlay, "Playful Slider", "Privacy First".
- RevenueCat's role: not mentioned anywhere in the text; "Built With" lists only swiftdata, swiftui, vision.
- Monetization logic: none stated.
- Traction before deadline: none. Posted later: recap gives no numbers either.
- Video: 2:54, description is just the store link. Structure not determinable.
- Gallery: 4 images, no captions.
- Guidance: emoji headings, one bold feature name per paragraph, a copywriting lesson ("Sell benefits, not features" failed, "feature-first" won).
- Distinctive: honest positioning doubt ("I decided to go broad").
- Merely polished: roadmap bullets.
- Transfers: name the one interaction a judge should feel (for Konvo, the inbox appearing with no feed), and say what copy failed.
- Cargo cult: Konvo's core screen is Instagram's own inbox; a Design Award framing would be borrowed clothes.

### Heartbeat Hero (2025 RevenueCat Peace Prize, 1st)

- Criteria (2025 rules): "Impact. How impactful is the solution?" and "Feasibility. Is the technology solution realistic and achievable for solving the problem?"
- Value proposition: "turns iPhone and iPad into a CPR coach."
- Spike: a sensor fusion feature no competitor has, plus a WWDC credential ("one of 50 Distinguished Winners").
- Problem evidence: anecdote, "my uncle, a firefighter, told me how he saved someone's life with CPR."
- Working product: App Store link, five modes, "Works offline".
- Technical depth, the most specific of all nine: "200 Hz accelerometer streams align to AR pose", "Calibration: 60 samples over roughly 3 seconds with median statistics", "adaptive Kalman filter with 5-sigma outlier rejection and drift compensation", "State machine: 200 Hz IMU signals detect compression start and end with millisecond precision".
- Craft: "haptics, voice guidance and torch pulses for hearing accessibility", a "focus" mode for ADHD and dyslexia.
- RevenueCat's role: "Built With" tag only; no prose.
- Monetization logic: "Learn mode and the AED map free for all users and lifetime full access to all features for verified students." "Just because someone can't afford the fancy stuff, does not mean they should not be able to have access to potentially life-saving information."
- Traction before deadline: none. Posted later: none in recap.
- Video: 15:11 (well past the "three minutes" judges must watch), plus a separate 1:16 "Depth Demo Video" linked inline.
- Gallery: 10 images, no captions.
- Guidance: custom headings ("Why it is different", "Final note") instead of the Devpost template; the disclaimer "not a substitute for certified training".
- Distinctive: the numbers describe the mechanism, not the traction.
- Merely polished: the thank you paragraph.
- Transfers: this is the model for Konvo's cage section, numbers about the mechanism (selectors, patch latency, break count) beat adjectives.
- Cargo cult: a 15 minute video. The 2026 rule is "less than two (2) minutes".

### Vector Guard (2025 HAMM Award, 1st)

- Criteria (2025 rules): "Clarity of Monetization Strategy", "Creativity of Monetization Strategy", "Financial Viability. Can the team articulate how their chosen monetization methods could generate revenue?"
- Value proposition: "Tick & Mosquito Disease Education & Prevention."
- Spike: a named pricing model. "The 1:50 Justice Model. Every $2.99 premium subscription automatically funds 50 free accounts in high-risk ZIP codes."
- Problem evidence: "476,000 Americans get Lyme disease every year", "Migrant farmworkers face 5x higher exposure". Author is "a PhD student at UC San Diego studying vector-borne diseases."
- Working product: App Store link and website. Nothing else shown in text.
- Technical depth: four bullets, "Offline-first: Complete vector database cached locally", "Image recognition trained on diverse photo conditions", "Zero personal data collection". No mechanism for ZIP eligibility or account funding is described.
- Craft: "Progressive disclosure, red/yellow/green risk scores upfront".
- RevenueCat's role: "Built With" tag only (cdc-open-data, revenuecat, swift). No prose.
- Monetization logic: "outdoor enthusiasts directly fund protection for vulnerable communities", "the world's first self-sustaining health equity platform".
- Traction before deadline: none. Posted later: none.
- Video: 3:20, "VectorGuard Explained", no description. Structure not determinable.
- Gallery: 2 images, no captions. Smallest gallery of the nine.
- Guidance: opens with a statistic, one bold model name, bullets, no Devpost template headings.
- Distinctive: the model is the product story; the whole entry is about 600 words.
- Merely polished: "Impact Vision" bullets.
- Transfers: name your pricing mechanism and tie it to an access rule. Konvo has one (a claimed invite link grants 3 days through RevenueCat promotional entitlements).
- Cargo cult: a charity ratio Konvo cannot fund or verify.

### ReadHim (2025 Buzziest Launch Award, 1st)

- Criteria (2025 rules): "Visibility", "Creativity", "Audience Engagement and Reach. Can the team provide any metrics, even anecdotal, of their launch's reach or engagement?"
- Value proposition: "Is he playing you? Know for sure."
- Spike: an explicit campaign for one award. "we decided to focus our efforts on ONE SINGULAR mission: to definitively win the Buzziest Launch Award."
- Problem evidence: "we have heard SO many times from our female colleagues and friends".
- Working product: store link, "officially live as of September 18th, 2025", UI update "September 24th based on initial user feedback".
- Technical depth: "optical character recognition plus a fine-tuned GPT-OSS-120B endpoint", "SwiftUI", "a Vercel API endpoint".
- Craft: "the report is shareable via iMessage".
- RevenueCat's role, their words, the longest of the nine: "RevenueCat made it an absolute breeze to authenticate users who were subscribed to our app or had an active free trial, and made it super easy to set up our paywall. We were concerned that setting up the paywall, payments, and entitlements with Apple JWTs would be time-consuming and complicated, but RevenueCat allowed us to set all of this up in just a few hours."
- Monetization: subscription with free trial and "a special discount code" as the Instagram funnel.
- Traction before deadline: "$1100 in Monthly Recurring Revenue", "a couple hundred free trials", "over 5.2 MILLION views", "over HALF A MILLION views" from one influencer, "over a thousand downloads", "6 Million Organic Views", all in the tagline too: "(6M+ views, $1100 MRR)".
- Posted later: recap repeats "5.2 million views", "$1,100 in MRR".
- Video: 3:04, "ReadHim, RevenueCat Shipaton". Structure not determinable.
- Gallery: 10 images with captions; first is "iOS App Store carousel of our app, officially live as of September 18th, 2025." Later captions describe the nightclub stunt and the influencer deal.
- Guidance: dated timeline (Sep 1, Sep 2, Sep 9, Sep 18, Sep 24), a "Results" heading, a closing ask "kindly ask that you consider us for the Buzziest Launch Award".
- Distinctive: naming the award and the plan to win it.
- Merely polished: the McLaren anecdote.
- Transfers: dated timeline, numbers in the tagline, one explicit category ask, a short RevenueCat paragraph in your own words.
- Cargo cult: stunts and influencer spend.

### Flowmino: Time Block & Focus (2024 RevenueCat Design Award, 1st)

- Criteria (2024 rules): "Innovative ideas" and "Aesthetics", same wording as 2025.
- Value proposition: "Time Blocking meets App Blocking."
- Spike: one gesture. Recap: "you simply tap to enter flow and the app uses the iOS Screen Time APIs to block you from using any distracting apps".
- Problem evidence: "We're 2 procrastinators." "Like 88% of people, before Flowmino we had never tried using a time management system" (unsourced). Book cited: "Indistractable by Nir Eyal".
- Working product: App Store link, three captioned screenshots.
- Technical depth: "The Screen Time APIs are notorious for being unstable. Understanding how its 3 frameworks work was... time-consuming. We had to circumvent its defects in creative ways. For example, the native ActivityPicker (for choosing which apps to block) often crashes and we had to incorporate some error handling into the UX to soften the issue."
- Craft (from the recap, not the entry): "wonderful breathing animation", "fluid transition animations when starting a flow state", "fantastic use of haptics".
- RevenueCat's role, their words: "Flowmino is made for iPhone using SwiftUI, SwiftData, the Screen Time APIs, and of course, RevenueCat :-)". Not in "Built With".
- Monetization logic: none stated anywhere.
- Traction before deadline: none. Posted later: none.
- Video: 3:26, "Introducing Flowmino", description restates the pitch. Structure not determinable.
- Gallery: 5 images, first caption "Make time for the things that matter most to you".
- Guidance: numbered "3 biggest challenges", a confession, "Our previous app was a solution in search of a problem."
- Distinctive: admitting the prior failed app and the fear of posting ("two introverts").
- Merely polished: roadmap of seven items.
- Transfers: the platform pain paragraph (a named API, a named crash, the workaround). Konvo's WKWebView cage has the same shape.
- Cargo cult: "Screen Time" in Konvo's headline. See section 4.

### Karo: Social Task Manager (2024 Most Likely to Make Money Award, 1st)

- Criteria (2024 rules): "Overall business viability", "App design & execution", "Monetization strategy... If there is a free version, is there enough value locked behind the in-app purchase", "Onboarding & paywall design", "ASO (App Store Optimization) best practices".
- Value proposition: "Delegate tasks to anyone from your contacts. We get it to them if they aren't on the app (via WhatsApp/Messages)".
- Spike: distribution built into the product. Recap: "you don't have to convince everyone you work with to download and start using the same app as you."
- Problem evidence: "My mom & wife send tasks over iMessage/WhatsApp. These tasks get lost".
- Working product: App Store link, "Making it to the App Store iOS 18 feature lists", "featured on TechCrunch, 9to5Mac, MacRumors and AppAdvice".
- Technical depth: "GoLang", "AWS (EC2, S3)", "Twilio for SMS", "WhatsApp Business", and the pain: "getting SMS services to work because of US laws compliances and getting approval from Meta to use the WhatsApp business API."
- Craft: "Completing the feedback loop!", the sender is notified on completion.
- RevenueCat's role: listed in the iOS stack, no prose. Recap supplies the paywall detail: "the well performing Blinkist style paywall with a secondary list of products behind a 'View all plans' button."
- Monetization logic (entry): "Adopting the blinkist paywall design"; roadmap "Free Trials vs Paid upfront intro offer". Recap: free tier "restrictions on the collaboration features and the AI assistance features."
- Traction before deadline: press names only, no numbers. Posted later: none.
- Video: 0:48, "Karo Promo Video", the shortest of the nine.
- Gallery: 4 images with captions; first "Social task manager, delegate tasks and let Karo make sure it reaches them".
- Guidance: stack as a bulleted list, month by month roadmap ("September: Paywall experiments").
- Distinctive: "Twilio is expensive!" and "If your launch is perfect and flooded with features, you launched too late."
- Merely polished: gamification promises.
- Transfers: a paywall named by pattern, the free tier boundary stated in one line, a roadmap with dated experiments.
- Cargo cult: SMS fan out.

### Meshing: AI Mesh Gradient Tool (2024 #BuildInPublic Award, 1st)

- Criteria (2024 rules): "Sharing your story", "Engagement", "Lessons Learned".
- Value proposition: "Quickly create beautiful gradients."
- Spike: daily public journey. Recap: "His regular tweets and daily video log on YouTube".
- Problem evidence: personal, "The previews kept loading...and loading...and loading."
- Working product: App Store link, nine captioned screenshots including "App Icon (1024 x 1024)" and "Main Screenshot (1179 x 2556)".
- Technical depth: "Animating mesh gradients was computationally expensive, and I had to optimize ruthlessly", tags metal, coreimage, coregraphics, aiproxy, wishkit. Built with "Claude 3.5 Sonnet".
- Craft: last day "VoiceOver and Voice Control" support and "hue, saturation and brightness sliders" in "just four hours".
- RevenueCat's role: "Built With" tag only.
- Monetization logic: none stated.
- Traction before deadline: none. Posted later: recap quote, "Most of the features implemented in the app, and the ones on the roadmap have been suggested by people who love the app".
- Video: 2:53, description links the X account and "Follow my #BuildInPublic journey".
- Gallery: 9 images, first caption "Craft Your Vision".
- Guidance: essay with invented headings ("Starbucks and Inspiration", "Bonus Bonanza"), a prototype sold on Gumroad before the hackathon.
- Distinctive: "There were days I did not want to work on the app at all, even quit the hackathon".
- Merely polished: "MeshRoom" social roadmap.
- Transfers: a public changelog of what feedback changed; Konvo's Sep 1 block change (opt in lock after trial data) is exactly this.
- Cargo cult: daily vlogs Konvo has no runway for before Sep 30.

## 2. Matrix

| Winner | Award | Spike | RevenueCat role | Monetization stated | Evidence before deadline | Failure story | Tech detail named | Video |
|---|---|---|---|---|---|---|---|---|
| Payout | 2025 Grand Prize | Numbers plus vibe coding | One word in a stack line | Pricing A/B, no prices | 17,000+ users, $30,017, 1750+ subs | No | No (stack only) | private |
| Gurwi | 2025 BuildInPublic | Founder story, own file format | "first time integrating payments" | Paywall after signup lifted subs | 13,000 users, 1,000+ reviews, 4.9 | Yes (poverty, format bugs) | Yes (65 tables, 3,000 line files) | 3:28 |
| Dayloop | 2025 Design | Auto face alignment | Not mentioned | None | None | Yes (orientation, memory) | Yes (Vision, coordinate systems) | 2:54 |
| Heartbeat Hero | 2025 Peace | Sensor fusion depth | Tag only | Free core, students free | None (WWDC award) | Yes ("sleepless nights") | Yes (200 Hz, 5-sigma Kalman) | 15:11 + 1:16 |
| Vector Guard | 2025 HAMM | 1:50 Justice Model | Tag only | $2.99 funds 50 accounts | None | No | Partial (offline, no PII) | 3:20 |
| ReadHim | 2025 Buzziest | Campaign for one award | Paragraph, "a few hours" | Trial plus discount code | $1100 MRR, 6M views | Yes (5 App Review rounds) | Yes (OCR, GPT-OSS-120B) | 3:04 |
| Flowmino | 2024 Design | Tap to enter flow | "and of course, RevenueCat :-)" | None | None | Yes (prior app failed) | Yes (ActivityPicker crash) | 3:26 |
| Karo | 2024 Make Money | Delegate to non users | Stack list | Blinkist paywall, free tier limits | Press and iOS 18 list | Yes (chat confusion, Meta) | Yes (Twilio, WhatsApp API) | 0:48 |
| Meshing | 2024 BuildInPublic | Daily public log | Tag only | None | None | Yes (wanted to quit) | Partial (Metal, optimization) | 2:53 |

## 3. Synthesis

### Five repeated winning patterns

1. One named mechanism the recap can repeat in a sentence: "1:50 Justice Model", "Auto Face Alignment", ".gurwi format", "Blinkist style paywall", "tap to enter flow". Eight of nine have one; Payout's is "not one line of code written by hand".
2. Platform pain described concretely, then the workaround: ActivityPicker crashes, Meta approval, five App Review rounds, flipped images. Judges are developers; this is how they recognise a real build.
3. Numbers about the mechanism when traction numbers are absent: Heartbeat Hero and Gurwi won with zero revenue in the text by quantifying the build.
4. The category is declared, not implied: ReadHim named its award; Vector Guard's whole entry answers the HAMM criteria in order; Payout's number block answers "Growth-by-numbers".
5. A confession of a previous mistake plus what it changed: Flowmino ("solution in search of a problem"), Gurwi (paywall timing), Dayloop (benefit copy failed), Karo (over planning), Meshing (six fingered first UI, per the recap).

### Five common weaknesses or anti patterns

1. RevenueCat as a tag: six of nine never explain how they used it. It did not stop them winning, but the 2026 Next Gen criteria explicitly ask "Does the project thoughtfully use RevenueCat".
2. Roadmap padding: every entry ends with a list of features that do not exist.
3. Unsourced statistics ("88% of people", "5x higher exposure").
4. Video length ignoring the rule (15:11 against a three minute rule; the 2026 rule is two).
5. Tiny galleries with no captions (Vector Guard: 2 images). Only ReadHim, Karo, Meshing and Flowmino captioned their images.

### What winning entries did not need

Revenue (six of nine gave none), a big audience ("audience size does not matter" is in the rules), a long video (Karo won with 48 seconds), a RevenueCat paragraph, a large gallery, Devpost updates (only Gurwi posted one, after the deadline), a polished founder bio.

### How winners made category fit unmistakable

They mirrored the criteria vocabulary. Vector Guard's headings answer clarity, creativity and viability. Heartbeat Hero has "Why it is different" (Innovation) and free access for students (Impact). ReadHim used "Visibility" channels, "Creative Marketing Stunts" and "Results", the three Buzziest criteria in order. Payout answered "Growth-by-numbers" with a number block.

### Story versus proof

The balance follows the award. Growth and Buzz winners were 70 percent proof (numbers, dates). Design and Peace winners were 70 percent mechanism (what the feature does and how). BuildInPublic winners were 70 percent story. No winner was all story: even Meshing names Metal and a four hour accessibility sprint.

### How failures and iteration were described

Past tense, specific, and closed with the fix: "the native ActivityPicker often crashes and we had to incorporate some error handling into the UX"; "we had to go back and forth with them like 5 times"; "showing a subscription prompt immediately after registration seemed far too invasive, but when we dared to try it... our subscriptions skyrocketed." Nobody described an open failure.

### How specific technical details affected memorability

The recap writers lifted the specifics verbatim: "ARKit, IMU fusion, and adaptive filtering to measure chest compression depth with millimeter accuracy", "a custom .gurwi file format", "Blinkist style paywall". Entries without specifics (Vector Guard, Payout) were summarised by their model or their numbers instead. A detail with a unit is what survives into the recap.

### How monetization reinforced the product

Where it worked, the price was part of the story: Vector Guard's subscription funds access; Heartbeat Hero's free tier keeps the life saving part free; Karo's free tier stops exactly where collaboration starts. Where it was absent (Dayloop, Flowmino, Meshing) the app won on design or story and the recap said nothing about money.

### Strong project versus strongly communicated submission

Heartbeat Hero and Gurwi were strong projects whose writing was also strong. Vector Guard is a strongly communicated submission with thin product evidence (two screenshots, no mechanism for the ZIP rule) that still won HAMM because its category has a single question and the entry answered it. Payout is a strong outcome communicated in 300 words. Lesson: fit to one category's criteria beats breadth.

### 2026 Next Gen criteria (fetched, quoted)

"Is the app idea clear, useful, interesting, or original? Does it solve a real problem or create a compelling experience for its intended users?" "Does the submitted project demonstrate meaningful progress toward a working app? Is the core functionality clear from the video and code repository?" "Does the project thoughtfully use RevenueCat to support subscriptions, in-app purchases, web purchases, ads, or another monetization flow?" "Does the submission show thoughtful technical choices, product thinking, and care in how the app was built and presented?" Requirements: video "less than two (2) minutes", "a link to your public, open-source code repository, including an open-source license file", judged "using the demonstration video and code repository". A store release is optional, so Konvo being live is a surplus, not the basis.

### The single dominant spike Konvo can realistically own

Candidates:

A. The cage: a WKWebView that renders Instagram's inbox and never the feed, kept alive by a remote patch channel (edit `public/cage-patch.json`, live in about 60 seconds, no release) and language proof selectors. Heartbeat Hero shape: mechanism numbers.

B. Attention protection with proof: the feed is gone, and the trial data show who stays. Flowmino shape, with the derivative risk in section 4.

C. Money from day three: 11.3 percent of login page arrivals buy or start a trial, 6 of the first 8 finished trials converted, RevenueCat promotional entitlements power the invite loop (per `docs/shipaton/2026-09-03-submission-draft.md`, pulled Sep 3, refresh on submission day). Payout and Karo shape.

Pick A, with C as the second paragraph. Reasons tied to the evidence: Next Gen judges read a repo and a two minute video, which is exactly where a mechanism shows and where traction does not; the recap writers reuse mechanism details with units (Heartbeat Hero) and drop entries without them; six winners never explained RevenueCat, so a real paragraph on promotional entitlements and webhooks joined to app events covers the one criterion most entries skip; and B is already Flowmino's headline. Konvo's absolute numbers (about 650 opens, 10 subscriptions) are too small to lead against Payout scale entries and are not asked for by the Next Gen criteria. Open source is mandatory for this category, so the cage selectors and patch channel become public; decide that before choosing A.

## 4. Deep dive: Flowmino and Vector Guard

### Flowmino

What they built: an iOS time blocking app where a tap starts a "flow" that uses the Screen Time APIs (FamilyControls, ManagedSettings, DeviceActivity, described as "its 3 frameworks") to block user chosen apps. SwiftUI, SwiftData, RevenueCat.

What they claimed: "Time Blocking meets App Blocking", "What if there was a minimalistic app that did both?", recap adds "built for professionals, neurodivergents, and anyone struggling with distractions."

Evidence given: three captioned screenshots, a 3:26 video, the ActivityPicker crash and workaround. No users, no revenue, no pricing, no monetization text. The Design Award was won on "gentle animations throughout, combined with fantastic use of haptics" (recap), plus one confessed prior failure.

What Konvo must do differently: never lead with "block" or "Screen Time". Flowmino blocks apps the user picks; Konvo removes surfaces inside one app the user still needs. The honest framing is subtraction, not restriction: Instagram with only the inbox, no picker, no schedule, nothing to arm. Konvo's optional Screen Time lock (opt in since Sep 1 after the trial data) is a footnote, not the headline. Where Flowmino gave one API pain paragraph, Konvo should give the cage as a system: how many DOM facts the cage relies on, how a broken selector is repaired without a release, how the badge poll gets unread counts without push. Where Flowmino gave animation and haptics, Konvo should not compete; the inbox is Instagram's.

### Vector Guard

What they built: a Swift app with an offline tick and mosquito identification database from CDC open data, image recognition, Spanish as a primary language, "Zero personal data collection".

What they claimed: "476,000 Americans get Lyme disease every year", "The 1:50 Justice Model. Every $2.99 premium subscription automatically funds 50 free accounts in high-risk ZIP codes. No applications. No means testing.", "the world's first self-sustaining health equity platform".

Evidence given: two screenshots, a 3:20 video, the author's PhD affiliation. No traction, no mechanism for how a ZIP code unlocks access, no RevenueCat prose. It won HAMM on the clarity and originality of the model against criteria that ask for exactly that.

What Konvo must do differently: Konvo's access rule is real and instrumented, so show the mechanism Vector Guard never showed. A claimed invite link grants 3 days through a RevenueCat promotional entitlement, capped at 3 per link, and the grant, the friend's first chat and any later trial land in PostHog on the same person as RevenueCat's webhook events. State the price, the trial length, the boundary (hard paywall after the person sees their own inbox) and the one experiment already run (block at purchase removed after trial cancels, lock made opt in). Do not invent a social ratio. Konvo's version of "profit and purpose" is narrower and truer: the paying user funds nothing for anyone else; they pay to get less Instagram.
