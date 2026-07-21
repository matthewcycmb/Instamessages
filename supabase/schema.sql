-- Instamessages schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;

-- One row per connected Instagram professional account (multi-tenant-ready).
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text not null unique,          -- Instagram professional account ID (matches webhook entry.id)
  username text not null,
  access_token text not null,               -- long-lived token, server-only (RLS: no client policy)
  token_issued_at timestamptz not null default now(),
  token_expires_at timestamptz not null,
  quiet_hours_start int not null default 23, -- local hour 0-23
  quiet_hours_end int not null default 8,
  timezone text not null default 'America/New_York',
  retention_days int,                        -- null = keep forever
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  ig_conversation_id text,                   -- Graph API conversation id (from import; webhooks don't carry it)
  peer_igsid text not null,                  -- Instagram-scoped ID of the friend
  peer_username text,
  peer_name text,
  peer_avatar_url text,
  last_message_at timestamptz,
  last_inbound_at timestamptz,               -- drives the 24h reply window
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (account_id, peer_igsid)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  mid text unique,                           -- Meta message id; dedupes webhook echo vs our own insert
  is_from_me boolean not null default false,
  text text,
  attachments jsonb,                         -- raw attachment payloads (type + url); urls expire, see storage re-host
  sent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_sent_idx on messages (conversation_id, sent_at);
create index if not exists conversations_account_last_idx on conversations (account_id, last_message_at desc);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,               -- full PushSubscription JSON
  created_at timestamptz not null default now()
);

-- Row Level Security.
-- The server uses the service-role key (bypasses RLS). The browser only ever
-- holds a short-lived JWT minted by /api/realtime-token carrying an
-- `account_id` claim, used exclusively for Realtime subscriptions.
alter table accounts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table push_subscriptions enable row level security;

-- No policies on accounts / push_subscriptions: tokens and subscriptions never leave the server.

create policy "own conversations" on conversations
  for select using (account_id::text = (auth.jwt() ->> 'account_id'));

create policy "own messages" on messages
  for select using (account_id::text = (auth.jwt() ->> 'account_id'));

-- Realtime: broadcast INSERTs on messages to subscribed clients (RLS is enforced).
alter publication supabase_realtime add table messages;
