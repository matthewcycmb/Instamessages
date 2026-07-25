# Chrome Web Store listing

> Trademark note: Meta enforces "Insta", "IG", and "gram" in product names on
> the Chrome Web Store. "Instagram" has been dropped from the extension's
> name, since using a trademark in a product name is the part that gets
> rejected; referring to Instagram in the description is ordinary descriptive
> use and is fine. The residual risk is "Insta" inside "Instachat" itself.
> That is a whole-product branding decision, not a listing one, and it is
> currently accepted. If the submission is rejected on the name, the fix is a
> rename across the app, site, and extension together.

## Registration
1. https://chrome.google.com/webstore/devconsole — sign in with any Google
   account, pay the one-time $5 developer fee.
2. "New item" → upload `public/extension.zip` (rebuild it after renaming:
   `cd extension && zip -r ../public/extension.zip manifest.json rules.json icons`).

## Listing fields

**Name:** Instachat: DMs Only

**Summary (132 chars max, comes from manifest.json "description" — edit
there and rebuild the zip, not in the console):**
Blocks instagram.com in your browser and sends you to Instachat for your
DMs. Signing in still works.

**Description:**
This extension blocks Instagram in your browser. Open the feed, Reels,
Explore, a post, a story, a profile, or even your DMs, and you are sent to
the Instachat page instead, which opens your messages in the Instachat app.

Signing in to Instagram is left alone, so logging in, two-factor codes, and
account recovery all work normally.

The extension collects no data and runs no code on any page. It is just a
fixed list of redirect rules.

**Category:** Productivity → Workflow & Planning
**Language:** English

## Privacy tab
- Single purpose: "Redirects instagram.com to the Instachat page, which hands
  the user's messages to the Instachat app, to reduce doomscrolling. Sign-in
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
Set `CHROME_STORE_URL` in `lib/extension.ts` to the listing URL and redeploy.
`components/extension-button.tsx` then switches from the load-unpacked steps
to a direct store link automatically.
