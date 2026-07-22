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
NAME keeps you reachable on Instagram DMs without the feed.

When you open instagram.com, the addictive parts (the home feed, Reels,
Explore, posts, stories, and profile pages) are blocked and you land in
your NAME inbox instead. Direct messages, the login flow, and ig.me links
are untouched, so messaging keeps working exactly as before.

No data is collected, read, or transmitted. The extension contains only
static redirect rules (Chrome's declarativeNetRequest) and runs no code on
any page.

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
