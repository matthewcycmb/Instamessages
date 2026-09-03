# Devpost "About the project" draft, v2 (2026-09-03), in Matthew's voice

Rewritten from Matthew's own transcripts and his LinkedIn post. Template headings kept because the Devpost form ships them. [refresh] = re-pull on submission day. [yours] = his own number, screenshot it into the evidence folder. No em dashes.

---

## Inspiration

I've been trying to lower my screen time for 2 years. Scrolling was shortening my attention span and I never felt good after it.

> I tried all the screen time apps. Opal, one sec, all of them.
> They all give YOU a limit YOU control. A 15 minute unlock.
> Every time, the 15 minutes went to Reels. As if Opal didn't exist.

So in the summer I deleted Instagram completely. 2 weeks later my urge to scroll was gone.

Then I redownloaded it at my grandparents' house just to check my messages. 15+ unread. Friends asking for advice, asking if I wanted to hang out. I had ghosted everyone and felt bad.

10 minutes later I knew 2 things:

> I can't delete Instagram again. My friends are on it.
> I don't want the feed back either.

I wanted an app where I open it and I'm just in my DMs. No feed, no Reels, no Explore. I told a friend the idea while we walked around Hong Kong island for 8 hours. She said pursue it. I could tell anyone this idea and they'd get it in 10 seconds.

## What it does

Konvo blocks your Instagram feed, Explore and Reels BUT keeps your messages.

> You sign in on Instagram's own login page inside the app. Konvo never sees your password or your messages.
> DMs, group chats, story replies all work like normal, because it IS Instagram.
> Home, Reels and Explore never load. Anywhere.
> Optional: lock the real Instagram app with Screen Time. 2 short passes a day to post a story or call someone.

## How we built it

First version: the official Instagram API. Didn't work. Too many weird restrictions. You could only message someone if they messaged you first. No group chats. I threw it out after 2 days.

I thought changing Instagram's UI was impossible. Then I tried loading instagram.com in a web view and injecting a script before Instagram's own code runs. That script is the whole product:

> 5 URL rules bounce home, Reels, Explore and a profile's Reels/Tagged/Saved tabs back to the inbox
> 39 CSS rules hide the doorways Instagram draws inside the pages you can see
> When Instagram changes its layout, I edit one JSON file on my site and the fix is live in about a minute. No app update.

Built it on my laptop first, saw it worked, then moved it to iPhone. Tauri + Rust for the app, Swift for RevenueCat, StoreKit, Screen Time and notifications. Most of it was built in the back of 3 hour lectures at a 2 week business program in Hong Kong.

101 builds. That is an abomination. I'm not making it up.

## Challenges we ran into

> App Review rejected it because Instagram asked their tester for a verification code and the review form has no field for one. 4 days per update. [yours: "6 back to back rejections"]

> The paywall broke on the biggest day. My LinkedIn post went viral (210k+ impressions [yours], 280 new people in one day [refresh]) and every one of them saw "Loading your plans". 10 people messaged me and one emailed. The cause: my paywall waited for 3 products from RevenueCat, and the 3rd (lifetime) was never approved in App Store Connect, so the real store never sent it. My phone had a local StoreKit file that still had it, so I never saw it. Fixed in 1.4.0: wait only for the products I sell, plus a test that boots the paywall with lifetime missing.

## Accomplishments that we're proud of

Aug 21 to Sep 2, review devices excluded [refresh all]:

> 443 people signed in to Instagram inside Konvo
> 68 started the 7 day trial, 4 bought monthly. 11% of everyone who reached the login page
> 6 of the first 8 trials that finished their week converted to yearly
> 10 paying subscriptions, $42 MRR, $164 through RevenueCat
> 10 App Store reviews, all 5 stars
> Signed-in people in 15+ countries

A 17 year old founder I met told me this app can't make money. Mom test, etc. 10 people pay for it.

I've been using it EVERYDAY since building it. Instagram is not on my phone.

## What we learned

I thought the Screen Time block was killing trials. I put it in the onboarding at the moment of purchase, and people freaked out, "oh my god my Instagram is blocked", and cancelled. So I made the block optional. Cancels didn't move.

RevenueCat's webhooks land in PostHog on the same person as the app's own events, so I could actually look. Cancels happened in the first 10 minutes, block or no block. The trial was the only door to the inbox, so curious people opened it, turned auto-renew off, and left. 1.5.0 fixed the real thing: a reminder promise before the trial ends, a notifications page after you pay, and a clear next step after the money.

My first explanation for a number is usually wrong. The RevenueCat + PostHog join is how I find out.

## What's next for Konvo: DM's Only

Land people in their latest chat right after they subscribe, see if the 10 minute cancels drop, and keep the cage standing every time Instagram changes.
