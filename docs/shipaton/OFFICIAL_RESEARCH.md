# Shipaton 2026 official research for Konvo (Next Gen Award)

Fetched 2026-09-03 (UTC). Every rule below is quoted verbatim in double quotes with its source URL. Where a source is silent the text says "not stated in the source".

Typography: this file contains no em or en dashes. Where quoted official text contains one, it is rendered as a comma or as the word "to". All other characters are verbatim. Livestream quotes are YouTube auto-generated captions; mis-heard words (for example "shipon", "Revnikat", "nextG", "defost") are kept as transcribed and marked [ASR].

Authority order used for conflicts: Official Rules, then the judging guide, then the submission guide, then the pitching, building and growth guides, then winner announcements, then winning submissions, then inference.

Raw page text: `/private/tmp/claude-501/-Users-matthewchan-Instamessages/8fdae7fc-2ee7-44d9-a391-a7b442592fbd/scratchpad/official/<slug>.txt`

## 1. Sources

| # | Slug | URL | Method | Fetched (UTC) | Note |
|---|------|-----|--------|---------------|------|
| 1 | rules | https://revenuecat-shipaton-2026.devpost.com/rules | curl -sL, python html.parser strip | 2026-09-03T02:48:41Z | Page header: "Updated August 31, 2026: Eligibility for the Next Gen Award has been expanded to include entrants under the age of majority. See Section 3." |
| 2 | main | https://revenuecat-shipaton-2026.devpost.com/ | curl -sL | 2026-09-03T02:48:41Z | Devpost overview, requirements, judges, criteria summaries |
| 3 | how-we-judge | https://www.shipaton.com/blog/how-we-judge-shipaton | curl -sL | 2026-09-03T02:48:41Z | Perttu Lähteenlahti, Jun 26, 2026 |
| 4 | how-to-submit | https://www.revenuecat.com/blog/engineering/how-to-submit-your-app-for-shipaton | curl -sL | 2026-09-03T02:48:41Z | Perttu Lähteenlahti, Aug 27, 2026 |
| 5 | pitching | https://www.revenuecat.com/blog/engineering/how-to-win-shipaton-part-4-pitching-your-app | curl -sL | 2026-09-03T02:48:41Z | Sep 5, 2025 (2025 edition; its three-minute figure is stale) |
| 6 | growing | https://www.revenuecat.com/blog/engineering/how-to-win-shipaton-part-3-growing-your-app | curl -sL | 2026-09-03T02:48:41Z | Aug 22, 2025 |
| 7 | idea | https://www.revenuecat.com/blog/engineering/how-to-win-shipaton-part-1-coming-up-with-an-idea | curl -sL | 2026-09-03T02:48:41Z | Aug 4, 2025 |
| 8 | livestreams | https://www.shipaton.com/livestreams | curl -sL | 2026-09-03T02:48:41Z | Schedule and blurbs only |
| 9 | livestream | https://www.youtube.com/watch?v=HIyLyX8tkHs | watch page: curl -sL 02:48:58Z. Captions: yt-dlp 2026.08.19, installed into the scratchpad with pip --target (system yt-dlp absent), auto-sub en json3 | 2026-09-03T02:50:16Z | "How to win Shipaton: What judges actually look for [Shipaton 26]", published 2026-08-04, 69 min. curl of the captionTracks baseUrl (plain, fmt=json3, with cookies, innertube ANDROID/IOS/WEB) returned empty bodies. Auto-generated captions only. |
| S1 | next-gen | https://www.shipaton.com/next-gen | curl -sL | 2026-09-03T02:52:38Z | Supplementary, not in the requested list; linked from sources 1 and 2 |
| S2 | faq | https://www.shipaton.com/faq | curl -sL | 2026-09-03T02:52:39Z | Supplementary, not in the requested list |

All pages returned server-rendered HTML to curl; WebFetch was not needed.

## 2. Next Gen Award: eligibility and criteria

### Who counts as a student

Rules (source 1): "You must be an active student enrolled in high school, college, university, bootcamp, or another academic program and use a qualifying student or academic email address on Devpost. Email-domain eligibility may be verified using JetBrains/swot. Instead of a published app-store listing, submit a demo video and a link to your public, open-source code repository, including an open-source license file. No paid Apple or Google developer account or store release is required."

Rules criteria header (source 1): "A student-only category for the best app submitted by active students with a .edu (or equivalent) email address. Judged on a video submission and open-source code, no App Store or Google Play release required."

Next Gen page (S1): "You will also need a student or academic email on Devpost. This check uses JetBrains/swot and confirms the email domain only."

### Age limits and minors

Rules (source 1): "Open to active students aged thirteen and older. Students under the age of majority where they reside need parent or legal guardian consent."

Rules Section 3 (source 1): "Individuals who are under the age of majority where they reside but are at least thirteen (13) years of age as of the time of entry ("Minor Entrants"), solely for purposes of entering and winning the Next Gen Award. Minor Entrants are not eligible for any other prize category. A Minor Entrant must have a parent or legal guardian who has reviewed and agreed to these Official Rules on the Minor Entrant's behalf. A parent or legal guardian may register for or hold the Devpost account used to enter on the Minor Entrant's behalf. Sponsor and Administrator may require written confirmation of parental or legal guardian consent at any time, and will require it before any prize is awarded to a Minor Entrant."

Rules Section 3 (source 1): "A Team or Organization that includes one or more Minor Entrants may enter only for the Next Gen Award and is not eligible for any other prize category. Where a Minor Entrant enters individually or is the Representative of a Team, that Minor Entrant's parent or legal guardian is deemed to enter on the Minor Entrant's behalf, must agree to these Official Rules, and is the party authorized to act in connection with the Submission, including for purposes of Sections 7, 8, 9, and 10."

### Parent or legal guardian consent

Rules (source 1): "Entrants under the age of majority where they reside (but at least thirteen years of age) may enter this category as Minor Entrants, provided a parent or legal guardian has reviewed and agreed to these Official Rules on their behalf, and the Sponsor's parent or legal guardian consent form (https://forms.gle/Gx2Cr4X8WPk9V1q77) is completed before the Submission Period ends."

Rules Section 8 (source 1): "If a Next Gen Award winner is a Minor Entrant, the prize will be awarded in the Minor Entrant's name but delivered to their parent or legal guardian, who must complete all required tax, payment, eligibility, and release documentation on the winner's behalf."

FAQ (S2): "Signed written consent will be required before you can be announced as a winner."

### Academic email or proof of enrollment

Email: quoted above (rules and S1; the check "confirms the email domain only"). Proof of enrollment beyond the email domain: not stated in the source. General verification, Rules Section 8 (source 1): "THE AWARD OF A PRIZE TO A POTENTIAL WINNER IS SUBJECT TO VERIFICATION OF THE IDENTITY, QUALIFICATIONS AND ROLE OF THE POTENTIAL WINNER IN THE CREATION OF THE SUBMISSION."

### Is a published app required

No. Rules (source 1): "Except for Projects submitted for the Next Gen Award, include a URL to a fully published app in Apple's App Store, the Google Play Store, or the Samsung Galaxy Store." Also: "No paid Apple or Google developer account or store release is required." FAQ (S2): "For Next Gen judging, a store submission is allowed but is not considered as part of the judging criteria."

### Public repository and open-source license

Required. Rules (source 1): "For Projects submitted for the Next Gen Award only: provide a URL to your code repository for judging and testing. The repository must contain all necessary source code, assets, and instructions required for the project to be functional. The repository must be public and open source by including an open source license file. This license should be detectable and visible at the top of the repository page (in the About section). Projects in all other categories are not required to provide a code repository."

Livestream [ASR] (source 9, about 29:16): "you do need to share uh an open- source uh public repo of your code uh and that needs to be so that you've submitted the code before the end of uh September 30th or when the hackathon ends officially."

### How Next Gen entries are judged

Rules (source 1): "Except for Projects submitted for the Next Gen Award, the app must either offer a free trial or the Entrant must include a promo code for judges to unlock the in-app purchase and test all premium features. Next Gen Award Projects will be evaluated using the demonstration video and code repository." And: "Next Gen Award Projects are exempt from the store-download testing requirements above and will be evaluated based on the demonstration video and public code repository."

### Can Next Gen entries also win other awards or the Grand Prize

Minors: no. Rules (source 1): "Minor Entrants are not eligible for any other prize category."

Adult students: the Rules contain no sentence barring a Next Gen entrant of majority age from other categories; the Grand Prize row lists eligible submissions as "All Eligible Submissions". An explicit statement in the Rules: not stated in the source. Submission guide (source 4): "Can I enter the Next Gen Award and another category? Yes, provided you meet both sets of requirements. That means submitting the code required for Next Gen and publishing the app to a supported store for the other category. The store release is not considered when judging the Next Gen Award itself." FAQ (S2): "Students who have reached the age of majority where they live may qualify for the Next Gen Award and another category if they meet both categories' requirements."

### The four judging criteria (verbatim, Rules, source 1)

"Is the app idea clear, useful, interesting, or original? Does it solve a real problem or create a compelling experience for its intended users?"

"Does the submitted project demonstrate meaningful progress toward a working app? Is the core functionality clear from the video and code repository?"

"Does the project thoughtfully use RevenueCat to support subscriptions, in-app purchases, web purchases, ads, or another monetization flow?"

"Does the submission show thoughtful technical choices, product thinking, and care in how the app was built and presented?"

Sub-bullets under these criteria: not stated in the source.

## 3. General eligibility

Release window. Rules (source 1): "Submission Period: Friday, July 31, 2026 at 8:00am PDT to Wednesday, September 30, 2026 at 11:45pm PDT ("Submission Period")." And: "Newly Submitted Apps Only: The first public version of the Project must be released during the Submission Period on Apple's App Store, the Google Play Store, or the Samsung Galaxy Store. A Project may have existed before the Submission Period, but it must not have been publicly released on any eligible store before the Submission Period. Updates to previously released apps are not eligible."

RevenueCat SDK. Rules (source 1): "Entrants must create a working software application that uses the RevenueCat SDK to power at least one in-app or web purchase, or that serves ads through RevenueCat Ads (each a "Project"). Apps must be built for iOS, iPadOS, macOS, or Android". Devpost overview (source 2): "Integrate the RevenueCat SDK to power at least one in-app purchase or serve ads through RevenueCat Ads."

Brand-new app. Devpost overview (source 2): "Ship a brand-new app to the App Store, Google Play Store, or, new this year, the Samsung Galaxy Store, between August 1st and September 30th, 2026." And: "Note: Updates to previously released apps won't qualify - it's all about bringing something new to life! You can brainstorm, build, and post before August 1st, but your app must be released for the first time during the Shipaton window." Submission guide (source 4): "TestFlight or testing-track builds don't count."

Team size. Rules (source 1) admit "Teams of Eligible Individuals ("Teams")" and require a single "Representative"; a numeric cap: not stated in the source. Submission guide (source 4): "Is there a limit to the number of teammates? No. Your team can have any number of members. However, if an eligible prize includes travel to New York, RevenueCat will fly one team member."

Countries excluded. Rules (source 1): "Individuals who are residents of, or Organizations domiciled in, a country, state, province or territory where the laws of the United States or local law prohibits participating or receiving a prize in the Hackathon (including, but not limited to, Russia, Crimea, Cuba, Iran, and North Korea and any other country designated by the United States Treasury's Office of Foreign Assets Control)". FAQ (S2): "New this year, individuals residing in Quebec or Brazil ARE allowed to participate in the Shipaton."

US availability. Rules (source 1): "Note: All apps must be accessible from the United States."

Third-party integrations. Rules (source 1): "Third Party Integrations: If a Project integrates any third-party SDK, APIs and/or data, Entrant must be authorized to use them in accordance with any terms and conditions or licensing requirements of the tool."

## 4. Submission requirements

Text description. Rules (source 1): "Include a text description that should explain the features and functionality of your Project."

Video. Rules (source 1): "Include a demonstration video of your Project. The video portion of the Submission: should be less than two (2) minutes. Judges are not required to watch beyond two minutes; should include footage that shows the Project functioning on the device for which it was built; must be uploaded to and made publicly visible on YouTube or Vimeo, and a link to the video must be provided on the submission form on the Hackathon Website; and must not include third party trademarks, or copyrighted music or other material unless the Entrant has permission to use such material." Submission guide (source 4): "Unlisted YouTube videos are fine; private ones won't be viewable by the judges, so don't do that."

Store URL. Rules (source 1): "Except for Projects submitted for the Next Gen Award, include a URL to a fully published app in Apple's App Store, the Google Play Store, or the Samsung Galaxy Store."

Icon. Rules (source 1): "Include a 1024x1024 app icon".

Screenshot. Rules (source 1): "Include at least one screenshot of the app with a resolution of 1179px width and 2556px height WITHOUT device frames."

Judge access. Rules (source 1): "If the app cannot be accessed with a free trial, a promo code must be provided for judges to unlock the in-app purchase and test all premium features of the app." Next Gen exception: quoted in section 2 ("Next Gen Award Projects are exempt from the store-download testing requirements above").

Other form fields. Rules (source 1): "Complete and enter all of the required fields on the "Enter a Submission" page of the Hackathon Website". Judging guide (source 3) says intake checks for "Added a valid bundle ID or package name, which we can use to check that the app has the RevenueCat SDK integrated correctly". Submission guide (source 4) lists "RevenueCat project ID" among required materials.

Language. Rules (source 1): "All Submission materials must be in English or, if not in English, the Entrant must provide an English translation".

Grand Prize extra. Rules (source 1): "Include a description outlining what you have done since launch to grow your app, and any relevant numbers (downloads/revenue/etc.) that show growth since launch."

## 5. Deadline and edit policy

Deadline. Rules (source 1): "Wednesday, September 30, 2026 at 11:45pm PDT". Devpost header (source 2): "Deadline: Sep 30, 2026 @ 11:45pm PDT".

Edits. Rules Section 5 (source 1): "Prior to the end of the Submission Period, you may save draft versions of your submission on Devpost to your portfolio before submitting the Submission materials to the Hackathon for evaluation. Once the Submission Period has ended, you may not make any changes or alterations to your Submission, but you may continue to update the Project in your Devpost portfolio." And: "The Sponsor and Devpost may permit you to modify part of your Submission after the Submission Period for the purpose of adding, removing or replacing material that potentially infringes a third party mark or right, discloses personally identifiable information, or is otherwise inappropriate."

Late entries. A grace period: not stated in the source. Rules Section 9 (source 1): "The Released Parties are not responsible for incomplete, late, misdirected, damaged, lost, illegible, or incomprehensible Submissions". Livestream [ASR] (source 9, about 28:27): "if your app becomes available on uh October 1st, it will not get included in the judging."

Timeline. Rules (source 1): "Judging Period: Thursday, October 1, 2026 at 12:00am PDT to Tuesday, October 13, 2026 at 12:00pm PDT" and "Winners announced: October 21st 2026".

## 6. Judging funnel (source 3 unless noted)

Stages: "Stage 1 Build window Stage 2 Intake filtering Stage 3 Prescreening Stage 4 Judge scoring Stage 5 Winner selection".

Time pressure: "After submissions close, we have just two weeks to do all of the judging." "Last year, that meant reviewing a thousand projects in a week for everything to go according to plan."

Intake: "once the hackathon concludes we export those project submissions to our internal tool. This tool allows us to quickly verify valid project submissions, meaning they have: Been submitted to the App Store or Google Play Store, and there's a link to the store page. This year we're validating other stores and web purchase integrations as well. Added a valid bundle ID or package name, which we can use to check that the app has the RevenueCat SDK integrated correctly All required submission fields have been answered There's a video submission of the app The required marketing materials for Times Square are included (app icon and screenshots)". "During this first judging phase we also tag each project for the categories it is eligible for. This is based on what you've written in the category-specific questions. If you left the question for the RevenueCat Peace Prize empty, your app won't get judged for that."

Who screens and what they look at first: "every project entry gets assigned to a minimum of two RevenueCat screeners. These screeners have only a few days to go through all the apps assigned to them and score them from 1-5 in all the categories the app is targeting. To do this, they are required to do two things: Watch the first 2 minutes of the submission video Read the project submission and the answers". "What we expect to see in the first two minutes of the video are these things: What your app is about, e.g. the elevator pitch Your app in use How and why your app is targeting the different prize categories". "don't try to jam your app into every prize category. Focus on the ones where your app makes the most sense."

Minutes spent per submission: not stated in the source.

Judges: "each judge must at minimum: Read the entire description Watch at least two minutes of the required video Review all of the screenshots Score the app from 1 to 5 (5 being best) in each category". "Judges are also welcome to download the app from the store and try it in person (it's encouraged), but not required." "Once everything is scored, each judge nominates their top apps per category." "close to 100 apps still make it to this final round of judging."

Final selection: "For each category, RevenueCat (or the category's sponsor) meets to deliberate and pick a first, second, and third place from the judges' nominees. Before anyone wins, we go back to the source material one more time, reading the full description, watching the video, and reviewing the screenshots, and at least one RevenueCat developer advocate downloads the app to confirm it matches what the video shows."

Aggregation. Rules (source 1): "The scores from the Judges will determine the potential winners of the applicable prizes. The Entrant(s) that are eligible for a Prize, and whose Submissions earn the highest overall scores based on the applicable Judging Criteria, will become potential winners of that Prize." Rounds: "Judging may take place in one or more rounds with one or more panels of Judges, at the discretion of the sponsor."

Tie-breaks. Rules (source 1): "if two or more Submissions are tied, the tied Submission with the highest score in the first applicable criterion listed above will be considered the higher scoring Submission. In the event any ties remain, this process will be repeated, as needed, by comparing the tied Submissions' scores on the next applicable criterion. If two or more Submissions are tied on all applicable criteria, the panel of Judges will vote on the tied Submissions." For Next Gen the first criterion is the "clear, useful, interesting, or original" one.

## 7. Pitching guide findings (source 5 unless noted)

Story: "A Devpost submission isn't just a checklist of features. It's a pitch." Use Dan Harmon's Story Circle: "1. Setup ... 2. Need ... 3. Go ... 4. Search ... 5. Find ... 6. Take: they pay a price for it. 7. Return ... 8. Change". Written form: "Start with a logline for your app that compresses Setup → Need → Change into one sentence, for example: "For [who], [App Name] helps [job to be done] by [distinct approach], so they can [valuable outcome]."" Then two short paragraphs (the problem and why existing options fall short; how the app works and why it is different) and "a final paragraph with evidence (Take → Return → Change): traction, test results, or signals from early users."

Clarity: "avoid the common pitfall of reducing your pitch to a feature list." "Always emphasize outcomes over features." Submission guide (source 4) description checklist: "What problem does it solve? Who is it for? What does it let them do? How does it make money? What makes it interesting or different? Which award categories are you targeting?" and tagline advice: "Say what the product actually does".

Uniqueness: "If your app has a surprising use case, a quirky origin, or an unexpected benefit, lean into that. The more distinct and specific your story feels, the more likely it is to stand out in the competition."

Failures and struggle: the pitching guide frames it as "Take: Show the effort and the reward". Submission guide (source 4): "Add the build story: what was hard, what you learned, and what comes next." An explicit instruction to describe failures: not stated in the source.

Technical details: the pitching guide says nothing about architecture. Submission guide (source 4) on technology tags: "These are mainly used for explaining your project; they don't affect judging." Livestream [ASR] (source 9, about 46:31): "other than a couple specific categories, we do not care how you built it."

Monetization in the pitch: submission guide (source 4) lists for the first two minutes "Its purchase, subscription, web-payment, or advertising experience." and screenshots should "show the core experience, the monetization, and the product's strongest visual details."

Video structure: "A great Shipaton video is proof first, polish second. In the opening 15 to 20 seconds, start with Setup + Need". "Then move to Go + Search by showing the app running on the actual device." "If you have numbers, retention, completion, time saved, show them with a quick before-and-after." "deliver your hook and proof in the first 60 to 90 seconds." Submission guide (source 4): "Don't spend the week making a trailer for your app or game. A clear screen recording with concise narration beats a long intro or elaborate title sequence." and "don't let AI write your whole description. No one will like reading that."

## 8. Growth and idea guides for a single-purpose paid utility

Idea guide (source 7): "Solve a real problem For real people In a way that delivers delight or an "aha" moment". "Start with a single problem". "Don't try to build a full menu, just focus on getting one dish right." "Ask yourself: What is the smallest thing I can build that still solves the problem? What makes this feel personal, intentional, or unique? What can I polish just enough that someone says "wow, I didn't expect that"?" Metrics: "Activation ... Retention ... Referral ... Monetization: Did they say they'd pay for it?" and "Pick one primary metric that reflects whether your idea is working". Pricing signal: "How much people are willing to pay for something is the best estimate of how much value they give to it."

Growth guide (source 6): "The milestone to aim for is 100 paying customers during Shipaton." Channels: personal network posts, "niche communities on Reddit, Discord, or specialized forums", "A micro-influencer with a few hundred engaged followers can often drive more adoption than a big account". Store page: revisit "title and description" for keywords, ask early users for reviews, "keep your app fresh" with specific release notes rather than "Bug fixes and performance improvements". Retention: "responding to feedback quickly", "Show momentum by iterating visibly". Standard for judges: "It's about showing clear signs of growth and proving that you've hustled to get your app into more hands. Even small improvements, such a few new daily active users, a handful of signups, or the first batch of reviews, are what builds momentum."

## 9. Livestream (source 9)

Transcript status: AVAILABLE as YouTube auto-generated English captions (ASR) via yt-dlp; no human transcript exists. Speakers: Charlie Chapman and Perttu Lähteenlahti (ASR renders the latter as "Perto", "Pu", "Perthu"). Timestamps are 20-second caption-block starts, so approximate. Chapters: prepared segments 9:47 to 18:46 and 20:03 to 42:07; Q&A 18:46 to 20:03 and 42:07 onward.

### Prepared guidance

About 28:27: "a lot of submissions got disqualified just for the fact that the app was not released during the review or during the period of the hackathon. So for example, if your app becomes available on uh October 1st, it will not get included in the judging."

About 30:03: "your app you can like release your app in your own market but it also has to be available in the US app store".

About 30:26: "please double check that you've added actual Google Play and Apple App Store and Galaxy Store links that work because we can't do the work uh of figuring out what's wrong with the URL".

About 31:39 (clarity): "in the first two minutes of it, you have to go through uh certain things uh that you mentioned because the judges will be looking at that video."

About 32:27 (categories): "It is highly unlikely that you'll be able to target all of the categories". About 33:11: "you should at least mention the categories you're targeting, what your app does, and how you've built it and how you've grown it during the uh shipon process itself. Growth in this case can just mean that when you when did you get it out, how did you come up with the idea."

About 34:18: "if you write a very long description uh it can actually work uh against you because then there's just too much information for the judges to go through".

About 35:53: "Don't just use AI to to answer uh for you those questions. Of course, you can use AI to fix your spelling and whatnot, but AI written text, fully AI written text is usually quite tedious uh and annoying to read." About 37:26: "if a hundred people are submitting and using the same claude model to answer it, it's going to you're going to start seeing the exact same phrase over and over again".

About 39:51 (technical / demo): "So in the video specifically show how your app works. That's going to be the number one thing the judges and prescriers will be using to understand how how how the app works, what you've built and what makes it special."

About 41:05: "the developer advocates at revenue who will actually at this point download every app test them see that they match what is in the video. So if you for example end up getting to be the finalist and and you've done that with a nice description of your app and a nice video but then your actual app doesn't do any of those things you will get disqualified".

### Live Q&A

About 18:58: "Are AI apps allowed? ... both both are completely uh valid apps."

About 20:57 to 22:31 (first version versus judged version): "we aren't judging the first version. we're judging uh based on what the app looks like when we get to the judging period". "the grand prize is called the build and grow award and that is actually specifically about building and growing the app after you released it."

About 42:38 (AI voiceover): "It does not dock you in in our eyes at all."

About 47:42 to 48:49: "What we want to see in the video is your app uh that you've already released in the app store. you're running that version of the app and showing the features from that." "if you go through your app and it doesn't have the features that you show in the video we will unfortunately have to of course disqualify you".

About 51:40 to 55:59 (one piece of advice): "don't overshoot ... don't try to cram in every single category". "the apps that stand out are the ones that can tell a good compelling narrative about their app related to that specific category." "There were apps that made really highly polished content that didn't win and there were apps that made not super highly polished content that did win." Perttu: "whatever you're building your app it needs to solve a problem or address a need of someone ... this is what my app does this is who it's for and this is what makes it special. If you manage to tell those things really well, it's very easy to judge how well you did in in the different categories." Charlie: "zoom in on details ... if you say it's welldesigned and then you focus on like one or two specific anecdotes ... here's an example of a small detail that I really focused on".

About 58:01 (monetization): "the baseline for this one is it's not just a subscription with an annual on a monthly plan ... What we're really looking for is like something that's kind of novel or more specific to your app or audience or just like uh unique or different."

About 58:49 (past winner): "I believe the winner last year was was uh was one where, you know, it was it was actually like an app for the public good. And if you subscribed to it, a portion of your subscription would actually uh enable the app for free for people in a certain amount of people in a an area that was underprivileged ... there wasn't anything technically super crazy about that, but it was totally unique."

About 1:01:40 (Grand Prize): "based on the revenue we build a short list of the apps that we then judge in the final stage." About 1:02:52: "you would not automatically be eligible to to win the grand prize just because of the revenue you've made."

About 1:04:53 (free apps): "if you have an app that has a trial of two months, that's of course allowed ... But you do need to integrate revenue".

Past winners named elsewhere: the Devpost judges list (source 2) includes "Connor Burd Shipaton 2025 Grand Prize winner" and "Camilo Starling Peñalver Gomez CEO Gurwi / Shipaton 2025 #BuildInPublic winner". Their submissions were not fetched.

## 10. Source conflicts and which wins

1. Video length. Pitching guide (2025): "A demonstration video (max three minutes judges are required to watch)". Rules (2026): "should be less than two (2) minutes. Judges are not required to watch beyond two minutes". Rules win: two minutes.
2. Submission window start. Rules: "Friday, July 31, 2026 at 8:00am PDT". Devpost overview, submission guide, FAQ and judging guide say August 1. Rules win. Konvo's Aug 21 release is inside either.
3. Winner announcement. Rules: "October 21st 2026". FAQ: "October 22, 2026". Judging guide: "Stage 4: Final winner selection (October 8-9)" versus Rules Judging Period ending October 13. Rules win.
4. Student email. Criteria header says ".edu (or equivalent)"; the requirements paragraph says "qualifying student or academic email address ... verified using JetBrains/swot". Same document; the requirements paragraph is the operative one and swot covers non-.edu academic domains.
5. Bundle ID and RevenueCat project ID appear in the judging guide and submission guide but not in the Rules' Submission Requirements list. Rules require "all of the required fields", so the Devpost form governs; supply both.
6. Stage numbering differs between the judging guide's prose and its graphic. Cosmetic.
7. Rules: "highest overall scores". Judging guide adds "each judge nominates their top apps per category"; livestream (about 40:39) adds that final choice "is on our sole discretion". Rules win on the binding text; the others describe practice.
8. Livestream calls the Grand Prize "the build and grow award"; Rules say "Grand Prize". Rules win.

## 11. Eligibility risks for Konvo

1. Release date. Konvo 1.0.0 went live on the App Store on 2026-08-21, inside the Submission Period ("Friday, July 31, 2026 at 8:00am PDT to Wednesday, September 30, 2026 at 11:45pm PDT"). Confirm no earlier public store release under any name or bundle ID; TestFlight builds do not count as a release.

2. Student status and age. The Rules require "an active student enrolled in high school, college, university, bootcamp, or another academic program" and "a qualifying student or academic email address on Devpost", checked against JetBrains/swot ("confirms the email domain only"). Action: set the Devpost account email to the school address and test it on the Next Gen page checker. If the founder is under the age of majority: only the Next Gen Award is open ("Minor Entrants are not eligible for any other prize category"), a parent or legal guardian must agree to the Rules, the consent form at https://forms.gle/Gx2Cr4X8WPk9V1q77 must be "completed before the Submission Period ends", the guardian may hold the Devpost account, and any prize is "delivered to their parent or legal guardian". If of majority age, Konvo may also enter other categories (HAMM, Design, Grand Prize) because it already has a store link and a trial.

3. Private repository. The Rules require the repository to be "public and open source by including an open source license file" with the license "detectable and visible at the top of the repository page (in the About section)" and containing "all necessary source code, assets, and instructions required for the project to be functional". Action before the deadline: make the repo public, add a recognised license file (GitHub shows it in About automatically when detected), scrub RevenueCat, PostHog, ASC and any other keys from history or rotate them, and add build instructions. The livestream says the code must be submitted "before the end of uh September 30th".

4. Instagram trademark in the video. The Rules say the video "must not include third party trademarks, or copyrighted music or other material unless the Entrant has permission to use such material." A demo showing Instagram's own login page inside the app displays Instagram's wordmark and logo. This is the clearest literal conflict. Rules Section 5 allows post-deadline removal of "material that potentially infringes a third party mark", which suggests such material is treated as fixable rather than disqualifying; that is inference, not a stated rule. Options: start the recording after login or blur the logo and wordmark, and give most of the two minutes to Konvo's own screens (paywall, notifications page, invite page, lock button).

5. Instagram name in the description and app. The Rules' trademark clause is written for the video; the text description has no equivalent clause (not stated in the source). The IP warranty applies to the whole Submission: it must "not violate the intellectual property rights or other rights including but not limited to copyright, trademark, patent, contract, and/or privacy rights, of any other person or entity", and "If a Project integrates any third-party SDK, APIs and/or data, Entrant must be authorized to use them in accordance with any terms and conditions or licensing requirements of the tool." Whether a WKWebView wrapper of instagram.com is "authorized" under Instagram's terms is a legal question outside these sources; the Rules place the warranty on the Entrant. Name Instagram in plain words, without its logos or branding.

6. Judges cannot log in. Next Gen is "evaluated using the demonstration video and code repository" and judges are "not required to download the app". The video has to carry the proof on a real iPhone: signed-in inbox, hidden feed, RevenueCat paywall and purchase. Make the repo README state plainly what the app does so the code corroborates the video.

7. RevenueCat criterion. Criterion three asks whether the project "thoughtfully use[s] RevenueCat to support subscriptions, in-app purchases, web purchases, ads, or another monetization flow". The livestream baseline is "not just a subscription with an annual on a monthly plan". Konvo's trial, the invite loop (three-day gift via RevenueCat) and the opt-in lock are the material to show, in the app and in the code.

8. US availability, assets and language. Rules: "All apps must be accessible from the United States." Confirm the App Store listing is available in the US storefront. Supply the 1024x1024 icon and a 1179x2556 screenshot "WITHOUT device frames", English materials, the RevenueCat project ID and bundle ID, and answer the Next Gen category question on the form (unanswered category questions mean "your app won't get judged for that").

9. Not overshooting. Screeners "score them from 1-5 in all the categories the app is targeting" and the organisers say "don't try to jam your app into every prize category". Target Next Gen plus at most one or two others where a real case exists.
