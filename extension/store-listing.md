# Chrome Web Store listing

> Trademark note: Meta enforces "Insta", "IG", and "gram" in product names on
> the Chrome Web Store, and Apple rejects the same under App Store guideline
> 5.2.1. The product was renamed from "Instachat" to "Konvo" precisely to
> clear that, so the name now carries no Meta mark at all. Referring to
> Instagram in the *description* is ordinary descriptive use and is fine —
> the product name is the part that gets rejected. Keep it that way: no
> "Insta", "IG", or "gram" in the name or summary, however tempting it is
> for search.

## Registration
1. https://chrome.google.com/webstore/devconsole — sign in with any Google
   account, pay the one-time $5 developer fee.
2. "New item" → upload `public/extension.zip` (rebuild it after renaming:
   `cd extension && zip -r ../public/extension.zip manifest.json rules.json icons`).

## Listing fields

**Name:** Konvo: DMs Only

**Summary (132 chars max, comes from manifest.json "description" — edit
there and rebuild the zip, not in the console):**
Blocks instagram.com in your browser and sends you to Konvo for your
DMs. Signing in still works.

**Description:**
This extension blocks Instagram in your browser. Open the feed, Reels,
Explore, a post, a story, a profile, or even your DMs, and you are sent to
the Konvo page instead, which opens your messages in the Konvo app.

Signing in to Instagram is left alone, so logging in, two-factor codes, and
account recovery all work normally.

The extension collects no data and runs no code on any page. It is just a
fixed list of redirect rules.

**Category:** Productivity → Workflow & Planning
**Language:** English

## Privacy tab
- Single purpose: "Redirects instagram.com to the Konvo page, which hands
  the user's messages to the Konvo app, to reduce doomscrolling. Sign-in
  and account-recovery URLs are excluded so login still works."
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
Set `CHROME_STORE_URL` at the top of `components/extension-button.tsx` to the
listing URL and redeploy. The button then switches from the load-unpacked
steps to a direct store link automatically.
