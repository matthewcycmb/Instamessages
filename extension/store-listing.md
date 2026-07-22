# Chrome Web Store listing — prepared, pending final brand name

> Replace NAME everywhere before submitting. Do not ship a name containing
> "Insta", "IG", or "gram" (Meta trademark enforcement is active on the
> Chrome Web Store).

## Registration
1. https://chrome.google.com/webstore/devconsole — sign in with any Google
   account, pay the one-time $5 developer fee.
2. "New item" → upload `public/extension.zip` (rebuild it after renaming:
   `cd extension && zip -r ../public/extension.zip manifest.json rules.json icons`).

## Listing fields

**Name:** NAME: Instagram DMs Only

**Summary (132 chars max, comes from manifest.json "description" — edit
there and rebuild the zip, not in the console):**
Blocks Instagram's feed, reels, and profiles in your browser. Your DMs and
login still work.

**Description:**
Instagram is really two products. There's the part you need — messages
from your friends — and the part built to eat your time: the feed, Reels,
Explore, an endless scroll of other people's lives.

This extension separates them. Open instagram.com and the feed, Reels,
Explore, posts, stories, and profile pages simply don't load. You land in
your NAME inbox instead. Your DMs still work. Login still works. Links
people send you still work. The only thing that stops working is the part
you were trying to quit.

It collects nothing and reads nothing. It's a static list of redirect
rules — no code runs on any page, and no data ever leaves your browser.

**Category:** Productivity → Workflow & Planning
**Language:** English

## Privacy tab
- Single purpose: "Redirects Instagram's feed/reels/profile pages to the
  user's NAME inbox to reduce doomscrolling; leaves DMs functional."
- Permission justifications:
  - `declarativeNetRequest`: applies the static redirect rules; no code
    reads page content.
  - Host permission `*://*.instagram.com/*`: the redirect rules must match
    instagram.com URLs. No data is accessed or transmitted.
- Data usage: "This item does not collect user data" (all boxes unchecked).

## Assets needed
- Store icon: `icons/icon128.png` (done)
- At least one 1280×800 screenshot: show instagram.com being redirected to
  the inbox (can be produced with Playwright when submitting).

## After approval
Set `CHROME_STORE_URL` in `components/block-instagram-banner.tsx` to the
listing URL and redeploy — the inbox banner switches from load-unpacked
steps to the two-click store install automatically.
