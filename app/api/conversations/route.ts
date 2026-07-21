import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("conversations")
    .select(
      "id, peer_igsid, peer_username, peer_name, peer_avatar_url, last_message_at, last_inbound_at, unread_count"
    )
    .eq("account_id", account.id)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Last-message previews: one query, newest-first, first row per conversation wins.
  const { data: recent } = await db
    .from("messages")
    .select("conversation_id, text, attachments, is_from_me")
    .eq("account_id", account.id)
    .order("sent_at", { ascending: false })
    .limit(400);

  const previews = new Map<string, string>();
  for (const m of recent ?? []) {
    if (previews.has(m.conversation_id)) continue;
    const body = m.text
      ? m.text
      : Array.isArray(m.attachments) && m.attachments.length
        ? "Attachment"
        : "Message";
    previews.set(m.conversation_id, `${m.is_from_me ? "You: " : ""}${body}`);
  }

  return NextResponse.json({
    conversations: (data ?? []).map((c) => ({ ...c, preview: previews.get(c.id) ?? "" })),
  });
}
