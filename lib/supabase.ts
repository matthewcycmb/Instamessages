import { createClient, SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

/** Server-only Supabase client using the service-role key (bypasses RLS). */
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

export type Account = {
  id: string;
  ig_user_id: string;
  username: string;
  access_token: string;
  token_issued_at: string;
  token_expires_at: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
  retention_days: number | null;
};

export type Conversation = {
  id: string;
  account_id: string;
  ig_conversation_id: string | null;
  peer_igsid: string;
  peer_username: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  unread_count: number;
};

export type Message = {
  id: string;
  account_id: string;
  conversation_id: string;
  mid: string | null;
  is_from_me: boolean;
  text: string | null;
  attachments: Attachment[] | null;
  sent_at: string;
};

export type Attachment = {
  type?: string;
  payload?: { url?: string; title?: string };
  url?: string;
};
