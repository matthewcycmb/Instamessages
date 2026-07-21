import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const db = supabaseAdmin();

  const { data: convo } = await db
    .from("conversations")
    .select(
      "id, peer_igsid, peer_username, peer_name, peer_avatar_url, last_inbound_at, unread_count"
    )
    .eq("id", id)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: messages, error } = await db
    .from("messages")
    .select("id, mid, is_from_me, text, attachments, sent_at")
    .eq("conversation_id", id)
    .order("sent_at", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: convo, messages });
}
