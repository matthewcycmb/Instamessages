-- Auto-reply feature: run once in the Supabase SQL editor.
alter table accounts
  add column if not exists auto_reply_enabled boolean not null default false,
  add column if not exists auto_reply_text text;

alter table conversations
  add column if not exists auto_replied_at timestamptz;
