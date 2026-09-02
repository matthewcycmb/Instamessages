# Konvo Invite Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The paywall gains a ✕ that lands on an invite page; sending the link through the iOS share sheet grants the sender a free week through RevenueCat, each friend who claims gets a week and extends the sender a week (cap 3), and the friend claims at the paywall moment by pasting the link or typing the handle.

**Architecture:** Three layers. (1) cage.js draws the invite page inside the existing paywall wall and asks the Swift bridge for three things: `invite` (share sheet), `claim` (native paste sheet) and `inviteStatus` (meter). (2) KonvoStore.swift presents the share sheet and the claim sheet, talks to the site, refreshes the RevenueCat entitlement, and checks joins in the existing background heartbeat. (3) The Next.js site serves `/i/<handle>` and five small route handlers over the Upstash Redis the push heartbeat already uses, and calls RevenueCat's REST API with the secret key.

**Tech Stack:** cage.js (vanilla, jsdom tests), Swift (UIKit share sheet, UIPasteControl, RevenueCat SDK), Next.js App Router route handlers (Node runtime), Upstash Redis REST, RevenueCat REST v1, PostHog capture API.


> **Rule change, Sep 2 morning (supersedes the reward lines below):** nothing is
> granted for sending. A friend who pastes the link at their paywall gets 3
> free days (once per friend, ever); the first friend to join credits the
> sender 3 days; later joins credit nothing; no stacking. RevenueCat grants
> use `three_day`. Apple's 7-day trial is unchanged. The paywall's close can
> be removed remotely with `{"invite": false}` in the cage patch. Copy
> approved by Matthew: "Send Konvo to 3 friends, and get 3 days free" /
> "When one of them joins, you both get 3 days free!" / "Link sent. Your 3
> free days start when a friend joins." / "Your 3 free days are on."

**Spec:** scratchpad copy of the handoff (`ref/handoff-referral.md`) plus the grill decisions of Sep 1 2026 evening: link is `konvoinstall.com/i/<handle>`, the code IS the handle, ✕ on the paywall to the invite page and Not now back to the paywall, claim at the paywall moment after login, two iPhones on the cable for acceptance, 1.5.0 held for this build (build 100).

## Global Constraints

- Never commit or push. Matthew says when. Site deploys from main only.
- No em dashes in any user-facing string, any language. Every visible word is Matthew's: the mock's copy verbatim, the three drafts verbatim.
- The share sheet is the only send path. Never Instagram's composer, never prefilled.
- No fingerprinting, no IP matching, no reading contacts. The site records taps per code only.
- Trial and monthly stay exactly as they are. The invite is a third door, never the only one.
- Cap 3 claims per sender. One level only. A friend cannot claim twice, cannot claim their own code.
- iPhone only. Mac keeps its flow. iOS floor is 16.0 (UIPasteControl is fine).
- Existing suites stay green: `cd /Users/matthewchan/Instamessages/wrapper && npm test` (bridge, cage, onboarding). test_bridge's TABLE must list every new bridge command.
- Use the absolute path `/Users/matthewchan/Instamessages/wrapper` for every wrapper command. Long builds under nohup + disown.
- Version 1.5.0, build 100, in tauri.conf.json, project.yml (x4) and the four Info.plists.
- Events, and nothing else: `invite_page_viewed {via}`, `invite_sent {draft}`, `invite_link_tapped` (server), `invite_claimed {method}`, `referral_week_granted {role, week_n}` (server), `paywall_closed`.

---

### Task 1: Server rules and store (site)

**Files:**
- Modify: `lib/push-store.ts` (export `redis`)
- Create: `lib/invite.ts`
- Create: `lib/invite-rules.ts`
- Create: `lib/invite-rules.test.ts`

**Interfaces:**
- Produces: `decideClaim(input: ClaimInput): ClaimVerdict` (pure), `registerCode(handle, rc)`, `getCode(handle)`, `claimsOf(handle)`, `recordClaim(handle, friendRc, friendHandle)`, `claimedBy(friendRc)`, `codeOf(rc)`, `bumpTap(handle)`, `grantWeek(rc, fromMs?)`, `expiryOf(rc)`, `captureServer(event, distinctId, props)`.

- [ ] **Step 1: Write the failing rules test**

```ts
// lib/invite-rules.test.ts  (run: node --test lib/invite-rules.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { decideClaim, CAP } from "./invite-rules.ts";

test("a fresh friend on a live code is allowed", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: null, claims: 0 }),
    { ok: true, weekN: 1 });
});
test("unknown code", () => {
  assert.deepEqual(decideClaim({ code: null, friendRc: "f1", alreadyClaimed: null, claims: 0 }),
    { ok: false, reason: "no_code" });
});
test("the sender cannot claim their own code", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "s1", alreadyClaimed: null, claims: 0 }),
    { ok: false, reason: "own_code" });
});
test("a friend claims once, ever", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f1", alreadyClaimed: "someone", claims: 0 }),
    { ok: false, reason: "already" });
});
test("the fourth friend is refused; the third is week 4 for the sender", () => {
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f4", alreadyClaimed: null, claims: CAP }),
    { ok: false, reason: "cap" });
  assert.deepEqual(decideClaim({ code: { rc: "s1" }, friendRc: "f3", alreadyClaimed: null, claims: 2 }),
    { ok: true, weekN: 3 });
});
```

- [ ] **Step 2: Run it, expect a module-not-found failure**

Run: `cd /Users/matthewchan/Instamessages && node --test lib/invite-rules.test.ts`

- [ ] **Step 3: Write the rules**

```ts
// lib/invite-rules.ts
// The whole referral policy, pure, so it can be tested without a store:
// three claims per sender, one claim per friend ever, never your own code.
export const CAP = 3;
export type ClaimInput = {
  code: { rc: string } | null;   // the sender behind the handle, if registered
  friendRc: string;              // the claiming phone's RevenueCat app user id
  alreadyClaimed: string | null; // the handle this friend claimed before, if any
  claims: number;                // claims already on this code
};
export type ClaimVerdict = { ok: true; weekN: number } | { ok: false; reason: "no_code" | "own_code" | "already" | "cap" };
export function decideClaim(i: ClaimInput): ClaimVerdict {
  if (!i.code) return { ok: false, reason: "no_code" };
  if (i.code.rc === i.friendRc) return { ok: false, reason: "own_code" };
  if (i.alreadyClaimed) return { ok: false, reason: "already" };
  if (i.claims >= CAP) return { ok: false, reason: "cap" };
  return { ok: true, weekN: i.claims + 1 };
}
```

- [ ] **Step 4: Run the test, expect PASS**

- [ ] **Step 5: Export redis and write the store + RevenueCat helpers**

In `lib/push-store.ts` change `async function redis(` to `export async function redis(`.

```ts
// lib/invite.ts
// Codes, claims and taps for the invite loop (Sep 1). The code is the
// sender's Instagram handle. The store knows handle, RevenueCat app user
// ids and counts; never a message, never a contact.
import { redis } from "./push-store";

const h = (handle: string) => handle.toLowerCase().replace(/^@/, "");
export const validHandle = (x: unknown): x is string =>
  typeof x === "string" && /^[a-z0-9._]{1,30}$/i.test(x.replace(/^@/, ""));
export const validRc = (x: unknown): x is string => typeof x === "string" && /^[A-Za-z0-9$:._-]{4,120}$/.test(x);

export const registerCode = (handle: string, rc: string) =>
  Promise.all([redis("HSETNX", "inv:codes", h(handle), rc), redis("HSET", "inv:rc", rc, h(handle))]);
export const getCode = async (handle: string) => (await redis("HGET", "inv:codes", h(handle))) as string | null;
export const codeOf = async (rc: string) => (await redis("HGET", "inv:rc", rc)) as string | null;
export const claimsOf = async (handle: string) => Number(await redis("HLEN", `inv:claims:${h(handle)}`)) || 0;
export const claimedBy = async (friendRc: string) => (await redis("HGET", "inv:claimed", friendRc)) as string | null;
export const recordClaim = (handle: string, friendRc: string, friendHandle: string) =>
  Promise.all([
    redis("HSET", `inv:claims:${h(handle)}`, friendRc, JSON.stringify({ handle: friendHandle, at: Date.now() })),
    redis("HSET", "inv:claimed", friendRc, h(handle)),
  ]);
export const claimList = async (handle: string) =>
  Object.values(((await redis("HGETALL", `inv:claims:${h(handle)}`)) as Record<string, string>) ?? {})
    .map((v) => JSON.parse(v) as { handle: string; at: number });
export const bumpTap = (handle: string) => redis("HINCRBY", "inv:taps", h(handle), 1);
export const sentOnce = async (rc: string) => (await redis("HSETNX", "inv:sent", rc, String(Date.now()))) === 1;

// RevenueCat REST v1, secret key server-side only. A promotional grant of
// "weekly" is 7 days from start_time_ms (now if omitted). An extension is
// a weekly grant starting at the current expiry; RevenueCat treats a grant
// ending within 2h of an active one as a duplicate, which a +7d never is.
const RC = "https://api.revenuecat.com/v1";
const rcHeaders = () => ({ Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}`, "Content-Type": "application/json" });
export const rcConfigured = () => Boolean(process.env.REVENUECAT_SECRET_KEY);
export async function expiryOf(rc: string): Promise<number | null> {
  const r = await fetch(`${RC}/subscribers/${encodeURIComponent(rc)}`, { headers: rcHeaders(), cache: "no-store" });
  if (!r.ok) return null;
  const j = (await r.json()) as { subscriber?: { entitlements?: Record<string, { expires_date: string | null }> } };
  const e = j.subscriber?.entitlements?.Pro?.expires_date;
  return e ? Date.parse(e) : null;
}
export async function grantWeek(rc: string, fromMs?: number): Promise<number | null> {
  const body: Record<string, unknown> = { duration: "weekly" };
  if (fromMs && fromMs > Date.now()) body.start_time_ms = fromMs;
  const r = await fetch(`${RC}/subscribers/${encodeURIComponent(rc)}/entitlements/Pro/promotional`,
    { method: "POST", headers: rcHeaders(), body: JSON.stringify(body), cache: "no-store" });
  if (!r.ok) throw new Error(`revenuecat ${r.status}`);
  return (fromMs && fromMs > Date.now() ? fromMs : Date.now()) + 7 * 86400000;
}

// Server-side PostHog capture into the app's project, so invite events sit
// on the same person as the app's events (distinct_id = RevenueCat id).
const PH_KEY = "phc_wgytRKK34P7KtTxZhz3eiWpccm7zfjbrU3MAcRfayJ7r";
export function captureServer(event: string, distinctId: string, props: Record<string, unknown>) {
  return fetch("https://us.i.posthog.com/i/v0/e/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PH_KEY, event, distinct_id: distinctId, properties: { ...props, source: "site" } }),
  }).catch(() => undefined);
}
```

- [ ] **Step 6: Typecheck** `npx tsc --noEmit -p .` (or `npm run lint`). Expected: no new errors in lib/.

### Task 2: Route handlers (site)

**Files:**
- Create: `app/api/invite/register/route.ts`, `app/api/invite/sent/route.ts`, `app/api/invite/claim/route.ts`, `app/api/invite/status/route.ts`, `app/api/invite/tap/route.ts`

**Interfaces:**
- register: POST `{handle, rc}` → `{ok}`
- sent: POST `{handle, rc, draft}` → `{ok, expires}` (grants week 1 once per rc; a second call returns the same shape without a new grant)
- claim: POST `{handle, rc, method, friend_handle?}` → `{ok, expires}` or `{ok:false, reason}`
- status: GET `?rc=` → `{ok, handle, claims, cap, joined:[{handle, at}], expires}`
- tap: POST `{handle}` → `{ok}`

- [ ] **Step 1: Write the handlers**

Every handler follows `app/api/push/register/route.ts`: parse JSON, validate with `validHandle`/`validRc`, 400 on bad input, 503 when `storeConfigured()` or `rcConfigured()` is false.

```ts
// app/api/invite/register/route.ts
import { storeConfigured } from "@/lib/push-store";
import { registerCode, validHandle, validRc } from "@/lib/invite";
export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  await registerCode(b.handle, b.rc);
  return Response.json({ ok: true });
}
```

```ts
// app/api/invite/sent/route.ts
import { storeConfigured } from "@/lib/push-store";
import { captureServer, grantWeek, rcConfigured, registerCode, sentOnce, expiryOf, validHandle, validRc } from "@/lib/invite";
export async function POST(req: Request) {
  if (!storeConfigured() || !rcConfigured()) return Response.json({ ok: false, reason: "config" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown; draft?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  await registerCode(b.handle, b.rc);
  if (!(await sentOnce(b.rc))) return Response.json({ ok: true, expires: await expiryOf(b.rc) });
  const expires = await grantWeek(b.rc);
  await captureServer("referral_week_granted", b.rc, { role: "sender", week_n: 1 });
  return Response.json({ ok: true, expires });
}
```

```ts
// app/api/invite/claim/route.ts
import { storeConfigured } from "@/lib/push-store";
import { captureServer, claimedBy, claimsOf, expiryOf, getCode, grantWeek, rcConfigured, recordClaim, validHandle, validRc } from "@/lib/invite";
import { decideClaim } from "@/lib/invite-rules";
export async function POST(req: Request) {
  if (!storeConfigured() || !rcConfigured()) return Response.json({ ok: false, reason: "config" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown; method?: unknown; friend_handle?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  const senderRc = await getCode(b.handle);
  const verdict = decideClaim({ code: senderRc ? { rc: senderRc } : null, friendRc: b.rc,
    alreadyClaimed: await claimedBy(b.rc), claims: await claimsOf(b.handle) });
  if (!verdict.ok) return Response.json(verdict, { status: 409 });
  const friendHandle = validHandle(b.friend_handle) ? b.friend_handle : "";
  await recordClaim(b.handle, b.rc, friendHandle);
  const expires = await grantWeek(b.rc);
  const senderExpiry = await expiryOf(senderRc!);
  await grantWeek(senderRc!, senderExpiry ?? undefined);
  const method = b.method === "handle" ? "handle" : "clipboard";
  await Promise.all([
    captureServer("invite_claimed", b.rc, { method, code: String(b.handle).toLowerCase() }),
    captureServer("referral_week_granted", b.rc, { role: "friend", week_n: 1 }),
    captureServer("referral_week_granted", senderRc!, { role: "sender", week_n: verdict.weekN + 1 }),
  ]);
  return Response.json({ ok: true, expires });
}
```

```ts
// app/api/invite/status/route.ts
import { storeConfigured } from "@/lib/push-store";
import { claimList, codeOf, expiryOf, rcConfigured, validRc } from "@/lib/invite";
import { CAP } from "@/lib/invite-rules";
export async function GET(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  const rc = new URL(req.url).searchParams.get("rc");
  if (!validRc(rc)) return Response.json({ ok: false }, { status: 400 });
  const handle = await codeOf(rc);
  const joined = handle ? await claimList(handle) : [];
  const expires = rcConfigured() ? await expiryOf(rc) : null;
  return Response.json({ ok: true, handle, claims: joined.length, cap: CAP, joined, expires });
}
```

```ts
// app/api/invite/tap/route.ts
import { storeConfigured } from "@/lib/push-store";
import { bumpTap, captureServer, getCode, validHandle } from "@/lib/invite";
export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false }, { status: 503 });
  let b: { handle?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle)) return Response.json({ ok: false }, { status: 400 });
  await bumpTap(b.handle);
  const senderRc = await getCode(b.handle);
  if (senderRc) await captureServer("invite_link_tapped", senderRc, { code: String(b.handle).toLowerCase() });
  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Typecheck and lint** `npm run lint`. Expected: clean.
- [ ] **Step 3: Smoke locally** `npm run dev` then `curl -X POST localhost:3000/api/invite/register -d '{"handle":"matt","rc":"$RCAnonymousID:test"}' -H 'content-type: application/json'` → `{"ok":true}` (needs the Upstash env locally via `vercel env pull .env.local`; without it the 503 is the expected answer).

### Task 3: Landing page `/i/<handle>` (site)

**Files:**
- Create: `app/i/[handle]/page.tsx`, `app/i/[handle]/GetKonvo.tsx`

- [ ] **Step 1: Write the page**

`page.tsx` (server): `generateMetadata` returns `{ title: "<handle> sent you a free week of Konvo", description: "instagram dms with no feed or reels. free for a week with this link.", openGraph: { title: same casual line } }`. Body: dark, centered, Konvo wordmark, `<h1>{handle} sent you a free week of Konvo</h1>`, `<p>Instagram DMs, no feed, no Reels. Install Konvo, sign in, and the week is yours.</p>`, `<GetKonvo handle={handle} link={`https://konvoinstall.com/i/${handle}`} />`, fine print "Tap Get Konvo, install, then open the app and paste the link when it asks." Read `params` as `await ctx.params` (this Next version).

`GetKonvo.tsx` (`"use client"`): a button; on click, inside the gesture: `navigator.clipboard.writeText(link).catch(() => {})`, then `fetch("/api/invite/tap", { method: "POST", body: JSON.stringify({ handle }), headers: {...}, keepalive: true })`, then `window.location.href = APP_STORE_URL` (from `@/lib/links`). Shows "Link copied. Opening the App Store" for 600ms before leaving.

- [ ] **Step 2: Check** `npm run lint` and `npm run dev`, open `localhost:3000/i/matt` on the Mac and on the phone's Safari (same Wi-Fi) and tap the button: clipboard holds the link, App Store opens.

### Task 4: Bridge commands (Swift)

**Files:**
- Modify: `wrapper/src-tauri/gen/apple/Sources/instamessages-wrapper/KonvoStore.swift` (run() switch next to `case "restore":`, plus a heartbeat hook next to `checkUnread`)
- Modify: `wrapper/test/test_bridge.js` TABLE

**Interfaces:**
- `invite` productId = JSON `{handle, text, url, draft}` → reply `{ok, sent, expires}`; presents UIActivityViewController with `[text, URL]`; on `completed`, POSTs `/api/invite/sent`, invalidates the RevenueCat cache, returns `expires` (ms).
- `claim` productId = `"auto" | "ask"` → reply `{ok, shown, entitled, expires, method}`; "auto" presents the claim sheet only when `UIPasteboard.general.detectPatterns(for: [.probableWebURL])` finds a URL; "ask" always presents. The sheet: title "Did a friend send you Konvo?", a `UIPasteControl` ("Paste the link"), a handle field with "Claim", "Skip". Paste reads the string, extracts `/i/<handle>`; claim POSTs `/api/invite/claim {handle, rc, method, friend_handle}`; on ok: `Purchases.shared.invalidateCustomerInfoCache()`, re-read entitlement, dismiss.
- `inviteStatus` → reply `{ok, handle, claims, cap, expires}` from GET `/api/invite/status?rc=`.
- Host: `inviteHost` = `UserDefaults.standard.string(forKey: "konvoInviteHost") ?? "https://konvoinstall.com"` (a `-konvoInviteHost URL` launch argument points a dev build at a preview).
- Heartbeat: `checkInvites(via:)` called right after `checkUnread` in the three background paths; GET status; if `claims` > the stored count, post a local notification "<handle> joined Konvo. Your free week just got longer." (friend handle when known, else "A friend"), store the count. Never more than once per new claim.

- [ ] **Step 1: Extend the bridge table test first**

```js
  invite:        { arg: 'JSON {handle, text, url, draft} for the share sheet (Sep 1)', replies: ['ok', 'sent', 'expires'] },
  claim:         { arg: '"auto" (only if the clipboard holds a link) | "ask"', replies: ['ok', 'shown', 'entitled', 'expires', 'method'] },
  inviteStatus:  { arg: 'unused', replies: ['ok', 'handle', 'claims', 'cap', 'expires'] },
```
Run `node test/test_bridge.js`: FAIL (Swift lacks the cases).

- [ ] **Step 2: Add the three cases and the claim controller** (code in Task 4 appendix at the bottom of this plan), then run test_bridge: PASS.

### Task 5: The invite page and the claim door (cage.js)

**Files:**
- Modify: `wrapper/src-tauri/src/cage.js`: `pay()` gains the ✕; new `invitePage()`; handlers `x`, `inv-send`, `inv-try`, `inv-later`, `inv-open`, `inv-claim`; `claimAuto()` at the first paywall paint; the handle captured into `localStorage.konvoHandle`; I18N entries in fr, zh, ko; `paywall_closed` event.
- Modify: `wrapper/test/test_cage.js` (new block after the paywall tests).

**Interfaces:**
- Consumes: bridge `invite`, `claim`, `inviteStatus`; `localStorage.konvoHandle` (set at inbox settle from `titleEl`).
- Produces: `#im-pay .imp-close[data-act='x']` on the pay page; `#im-invite` page inside the wall; success state `.inv-done`.

- [ ] **Step 1: Write the failing tests** (jsdom, in test_cage.js, after the lapsed tests): ✕ present on the pay page; ✕ tap → invite page with the headline "Get a free week. Send Konvo to three friends." and the first draft containing `konvoinstall.com/i/matt` when `localStorage.konvoHandle = "matt"`; `paywall_closed` and `invite_page_viewed {via: "paywall_x"}` tracked; Try another cycles the draft; Send posts bridge `invite` with JSON whose `url` is `https://konvoinstall.com/i/matt`, and a reply `{ok:true, sent:true, expires: <ms>}` paints the success state with "Your free week is on." and "0 of 3", and `invite_sent {draft: 0}`; Not now returns to the pay page; Restore still reaches the bridge; "Have an invite?" posts bridge `claim "ask"`, and a reply `{ok:true, entitled:true}` finishes the sequence (`onboarding_completed`); a reply `{entitled:false}` leaves the paywall; at the first paywall paint the bridge gets `claim "auto"` once; nothing typed and no draft text reaches any event except the draft index; the three drafts and the page carry no em dashes; every new string is in all three tables.

- [ ] **Step 2: Run** `node test/test_cage.js` → FAIL at the ✕ assertion.

- [ ] **Step 3: Implement** (code in Task 5 appendix). Run the cage suite → PASS. Run `npm test` → all three PASS.

### Task 6: Build 100, two devices, acceptance

- [ ] Bump build to 100 (tauri.conf.json, project.yml x4, PlistBuddy x4). Build under nohup; verify the IPA with a `verify100.py` (markers: `imp-close' data-act='x'`, `Send to 3 friends`, `konvoinstall.com/i/`, `case "invite"` is strings-invisible so check the JS side, build 100 in four plists).
- [ ] Site: Matthew adds `REVENUECAT_SECRET_KEY` to Vercel (production + preview) and says the word to fast-forward main. Until then, `vercel deploy` (preview, no git) plus `-konvoInviteHost <preview url>` on the dev launches, or wait.
- [ ] Device A (16e, signed in, no plan): paywall → ✕ → invite page → Send → Messages to Device B's number → success state with the end date → Open my messages → inbox. PostHog: `paywall_closed`, `invite_page_viewed`, `invite_sent`, `referral_week_granted {sender, 1}`.
- [ ] Device B: tap the link → landing page → Get Konvo → App Store (dev build installed over the cable instead) → onboarding → login → at the paywall the claim sheet appears (link on the clipboard) → Paste → "<A> sent you a free week" → Claim → inbox. PostHog: `invite_claimed {clipboard}`, `referral_week_granted {friend, 1}` and `{sender, 2}`. Device A next open: meter 1 of 3, later end date; the heartbeat posts the notification within 15 minutes.
- [ ] Device B, empty clipboard: paywall shows "Have an invite?" → handle field → Claim works; Skip works.
- [ ] A fourth claim on A's code is refused (409 cap) and the sheet says so politely; A's own device cannot claim A's code (409 own_code).
- [ ] Trial and monthly still purchasable on both (sandbox); Restore works from the invite page.

---

## Appendix, Task 4: Swift

Add next to `case "restore":` in `run()`:

```swift
        case "invite":
            return await inviteShare(productId)
        case "claim":
            return await inviteClaim(mode: productId)
        case "inviteStatus":
            return await inviteStatus()
```

Then the helpers (a new `// ── The invite loop (Sep 1) ──` section):

```swift
    private static var inviteHost: String {
        UserDefaults.standard.string(forKey: "konvoInviteHost") ?? "https://konvoinstall.com"
    }
    private static func invitePost(_ path: String, _ body: [String: Any]) async -> [String: Any]? {
        guard let url = URL(string: inviteHost + path),
              let data = try? JSONSerialization.data(withJSONObject: body) else { return nil }
        var req = URLRequest(url: url); req.httpMethod = "POST"; req.httpBody = data
        req.setValue("application/json", forHTTPHeaderField: "Content-Type"); req.timeoutInterval = 20
        guard let (d, _) = try? await URLSession.shared.data(for: req) else { return nil }
        return (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
    }
    @MainActor
    private static func inviteShare(_ json: String) async -> [String: Any] {
        guard let d = json.data(using: .utf8),
              let o = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any],
              let handle = o["handle"] as? String, let text = o["text"] as? String,
              let link = o["url"] as? String, let url = URL(string: link),
              let front = frontViewController() else { return ["ok": false] }
        _ = await invitePost("/api/invite/register", ["handle": handle, "rc": Purchases.shared.appUserID])
        let completed: Bool = await withCheckedContinuation { cont in
            var done = false
            let sheet = UIActivityViewController(activityItems: [text, url], applicationActivities: nil)
            sheet.completionWithItemsHandler = { _, ok, _, _ in
                guard !done else { return }; done = true; cont.resume(returning: ok)
            }
            front.present(sheet, animated: true)
        }
        guard completed else { return ["ok": true, "sent": false] }
        let r = await invitePost("/api/invite/sent", ["handle": handle, "rc": Purchases.shared.appUserID, "draft": o["draft"] ?? 0])
        Purchases.shared.invalidateCustomerInfoCache()
        _ = try? await Purchases.shared.customerInfo(fetchPolicy: .fetchCurrent)
        return ["ok": true, "sent": true, "expires": r?["expires"] ?? NSNull()]
    }
    private static func inviteStatus() async -> [String: Any] {
        guard var c = URLComponents(string: inviteHost + "/api/invite/status") else { return ["ok": false] }
        c.queryItems = [URLQueryItem(name: "rc", value: Purchases.shared.appUserID)]
        guard let u = c.url, let (d, _) = try? await URLSession.shared.data(from: u),
              let j = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] else { return ["ok": false] }
        return j
    }
    @MainActor
    private static func inviteClaim(mode: String) async -> [String: Any] {
        if mode == "auto" {
            let found: Bool = await withCheckedContinuation { cont in
                UIPasteboard.general.detectPatterns(for: [.probableWebURL]) { r in
                    cont.resume(returning: (try? r.get().contains(.probableWebURL)) ?? false)
                }
            }
            if !found { return ["ok": true, "shown": false, "entitled": false] }
        }
        guard let front = frontViewController() else { return ["ok": false] }
        let result: [String: Any] = await withCheckedContinuation { cont in
            let vc = InviteClaimController()
            vc.finish = { r in front.dismiss(animated: true); cont.resume(returning: r) }
            vc.modalPresentationStyle = .pageSheet
            front.present(vc, animated: true)
        }
        var out = result; out["ok"] = true; out["shown"] = true
        return out
    }
```

`InviteClaimController` (UIViewController, same file, bottom): a vertical stack with the title "Did a friend send you Konvo?", a `UIPasteControl` whose `target` is the controller (the controller sets `pasteConfiguration = UIPasteConfiguration(acceptableTypeIdentifiers: [UTType.url.identifier, UTType.plainText.identifier])` and overrides `paste(itemProviders:)` to load a string or URL, run the regex `/i/([A-Za-z0-9._]{1,30})`, and call `claim(handle, method: "clipboard")`), a `UITextField` (placeholder "Their Instagram handle", autocapitalization none) with a "Claim" button calling `claim(field.text, method: "handle")`, a "Skip" button calling `finish(["entitled": false])`, and a status label. `claim` POSTs `/api/invite/claim {handle, rc, method}`; on `ok`: `Purchases.shared.invalidateCustomerInfoCache()`, `customerInfo(fetchPolicy: .fetchCurrent)`, `finish(["entitled": true, "expires": r["expires"], "method": method])`; on 409: label per reason ("That link has been used three times already." / "That is your own link." / "You already used an invite." / "No invite under that handle."). `import UniformTypeIdentifiers` at the top.

Heartbeat: after each `await checkUnread(via:)` add `await checkInvites(via:)`:

```swift
    static func checkInvites(via: String) async {
        _ = configureOnce
        let s = await inviteStatus()
        guard s["ok"] as? Bool == true, let claims = s["claims"] as? Int else { return }
        let d = UserDefaults.standard, last = d.integer(forKey: "konvoInviteClaims")
        d.set(claims, forKey: "konvoInviteClaims")
        guard claims > last, via != "background" else { return }
        let joined = (s["joined"] as? [[String: Any]]) ?? []
        let who = (joined.last?["handle"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "A friend"
        let center = UNUserNotificationCenter.current()
        let status = await center.notificationSettings().authorizationStatus
        guard status == .authorized || status == .provisional else { return }
        let content = UNMutableNotificationContent()
        content.title = "Konvo"; content.body = "\(who) joined Konvo. Your free week just got longer."; content.sound = .default
        try? await center.add(UNNotificationRequest(identifier: "konvo.invite.\(claims)", content: content, trigger: nil))
    }
```

## Appendix, Task 5: cage.js

- `pay()`: prepend `"<div class='imp-close' data-act='x' aria-label='Close'>" + X_SVG + "</div>"` to the markup (the same SVG the Screen Time page uses).
- At inbox settle, next to `rp.$set.ig_username = un;`: `try { localStorage.konvoHandle = un; } catch (e) {}` (outside the `konvoIdentified` guard, so every settle refreshes it).
- `DRAFTS` = the mock's three strings with `konvo.app/i/matt` replaced by `{link}`; `inviteLink()` = `"https://konvoinstall.com/i/" + localStorage.konvoHandle`.
- `invitePage(viaX)`: the mock's markup as one wall page: eyebrow "No card needed", h2 "Get a free week. Send Konvo to three friends.", sub "Every friend who joins adds another week. <b>They get a free week too.</b>", the message card (label "Your message", link "Try another" data-act='inv-try', `<p class='inv-text' contenteditable='true'>`, dots), hint "Tap the text to make it yours.", `imp-btn` "Send to 3 friends" data-act='inv-send', fine "Opens the share sheet. Pick anyone. Nothing sends until you tap send.", links "Not now" data-act='inv-later' and "Restore purchase" data-act='restore'. Send is disabled with "Loading your username" until `localStorage.konvoHandle` exists (re-checked every 500ms).
- `inviteDone(expires, claims)`: check, "Your free week is on.", "Ends <b>{date}</b>. Nothing to cancel, nothing charges.", meter rows "Friends who joined" / "{n} of 3" and "Each one adds" / "+7 days", `imp-btn` "Open my messages" data-act='inv-open'.
- Handlers in the wall's click listener: `x` → `track("paywall_closed")`, `track("invite_page_viewed", {via: "paywall_x"})`, `swap(invitePage())`; `inv-try` → next draft; `inv-later` → `swap(pay("y"))`; `inv-send` → `track("invite_sent", {draft: i})`, `storekit("invite", JSON.stringify({handle, text, url, draft: i}), cb)`; cb: `res.sent` → `setCache(true)`, `swap(inviteDone(res.expires, 0))`, then `storekit("inviteStatus")` to refresh the meter; `inv-open` → `finish("s15_invite")`; `inv-claim` → `storekit("claim", "ask", cb)`; cb `res.entitled` → `setCache(true); finish("s13_paywall")`.
- `claimAuto()`: once per session, at the first `swap(pay("y"))` paint (both the normal and the lapsed path): `storekit("claim", "auto", cb)` with the same cb; a "Have an invite?" link (data-act='inv-claim') in the pay page's `imp-links` row.
- Lapsed wall: the same ✕ (via "lapsed").
- I18N (fr, zh, ko) for every new chrome string; the drafts stay English.
