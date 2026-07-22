# Instamessages

Your friends' Instagram DMs — without the feed. An iMessage-style PWA that receives your
Instagram messages via Meta's webhooks and replies through the official
**Instagram API with Instagram Login**, so you can keep the Instagram app deleted.

**Stack:** Next.js (App Router) on Vercel · Supabase (Postgres + Realtime + Storage) · web push.

## What it can and can't do (Meta platform rules, not bugs)

| Works | Doesn't work — by design of Meta's API |
|---|---|
| Receive every new 1:1 DM in near-realtime | Group chats (never delivered to the API) |
| Reply within 24h of their last message | Initiating conversations / replying after 24h |
| Import the 20 most recent messages per thread | Importing older history via API (v1.1 will parse the official "Download Your Information" export instead) |
| Web push to your phone (installed PWA) | Marking threads "seen" inside the Instagram app |

## Setup

### 1. Instagram side (one-time, ~15 min)

1. Your Instagram account must be a **professional account** (Creator or Business):
   Instagram settings → Account type and tools → Switch to professional account.
2. Create an app at [developers.facebook.com](https://developers.facebook.com/apps) →
   add the **Instagram** product → choose **API setup with Instagram login**.
3. In **Business login settings**, add the OAuth redirect URI:
   `https://<your-domain>/api/auth/instagram/callback`
4. Copy the **Instagram app ID and secret** (shown under the Instagram product — not the parent
   Meta app's ID) into `.env` as `IG_APP_ID` / `IG_APP_SECRET`.
5. **Webhooks**: in the Instagram product's webhook setup, set the callback URL to
   `https://<your-domain>/api/webhooks/instagram`, enter the same random string you put in
   `IG_VERIFY_TOKEN`, verify, then subscribe to the **`messages`** field.
6. **Message access**: in the Instagram app/site settings → Messages and story replies →
   Message controls → allow access for connected tools.
7. **Testers** (until App Review): app dashboard → Roles → add your friends as
   **Instagram testers**; they accept in Instagram → Settings → Website permissions → Apps and
   websites → Tester invites. In dev mode, only testers' messages are delivered.

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy into `.env`: project URL, anon key, service-role key, and the **legacy JWT secret**
   (Settings → API → JWT settings) as `SUPABASE_JWT_SECRET` (used to mint Realtime tokens).

### 3. App secrets

```bash
cp .env.example .env.local
openssl rand -hex 32              # → SESSION_SECRET
npx web-push generate-vapid-keys  # → NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
openssl rand -hex 16              # → CRON_SECRET (also set in Vercel project env)
```

### 4. Deploy & connect

```bash
npm i -g vercel && vercel        # deploy; add all env vars to the Vercel project
```

Webhooks need a public URL, so deploy early — local-only dev can't receive messages
(or run `vercel dev` behind a tunnel like `ngrok` and point the webhook at it).

Then open the deployed app → **Connect Instagram** → approve the permissions → hit **Import**.
Connecting automatically makes the one Conversations API call that Creator accounts need
before Meta starts delivering webhooks.

### 5. iPhone install

Safari → open your deployed URL → Share → **Add to Home Screen** → open the installed app →
Settings → **Enable notifications on this device** (iOS 16.4+). Now delete Instagram. 🎉

## Architecture

```
friend DMs you on Instagram
        │  webhook (signed, X-Hub-Signature-256)
        ▼
POST /api/webhooks/instagram      ── verifies signature, dedupes by mid
        │  insert message row
        ▼
Supabase Postgres ──► Realtime → open PWA updates instantly
        │
        └──► web push → phone buzzes (quiet hours respected)

you hit send ──► POST /api/messages/send ── enforces 24h window ──► Graph API /me/messages
```

- **Sessions**: Instagram OAuth is the login. A signed cookie (`jose` JWT) carries the account id.
- **Realtime auth**: `/api/realtime-token` mints a short-lived Supabase JWT with an
  `account_id` claim; RLS policies scope Realtime to your rows. Service-role key never
  leaves the server.
- **Token refresh**: weekly cron (`vercel.ts`) refreshes the 60-day Instagram token and
  applies message retention.
- **Echoes**: messages you send from instagram.com (e.g. during a weekly group-chat check)
  arrive as `is_echo` webhooks and appear in history automatically.

## Desktop wrapper (`wrapper/`)

A Tauri app that loads instagram.com in a cage: DM inbox and login flows only — the feed,
reels, explore, and profiles are unreachable (enforced in Rust via a navigation allowlist
plus an injected document-start script that bounces SPA redirects back to the inbox).
It exists for the two things Meta's API can never do: starting new conversations and
group chats.

- Build: `cd wrapper && npx @tauri-apps/cli build` (needs Rust; output in
  `src-tauri/target/release/bundle/macos/`)
- Registers the `instamessages://dm/<username>` URL scheme. Turn on
  "Open new chats in the wrapper" in the web app's Settings and the New-message button
  hands cold sends to the wrapper instead of the browser.
- First run: log into instagram.com inside the wrapper once; the session persists.

## Roadmap

- **v1.1** — full history backfill from Instagram's "Download Your Information" export
  (zip upload → parse per-thread JSON → match usernames to API thread ids).
- Re-host expiring Meta media URLs into Supabase Storage on ingest.
- App Review (`instagram_business_manage_messages` advanced access) + business verification
  to open the app beyond testers.
