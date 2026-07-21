import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { getConversations, IgMessage } from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Shallow import: conversation list + the 20 most recent messages per thread
 * (a hard Instagram API cap). Full history backfill via the "Download Your
 * Information" export is planned for v1.1.
 */
export async function POST() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const db = supabaseAdmin();
  const conversations = await getConversations(account.access_token);

  let threads = 0;
  let messages = 0;

  for (const convo of conversations) {
    const participants = convo.participants?.data ?? [];
    // Peer = the participant who isn't us (match by username, fall back to id).
    const peer =
      participants.find((p) => p.username && p.username !== account.username) ??
      participants.find((p) => p.id !== account.ig_user_id);
    if (!peer) continue;

    const { data: row, error } = await db
      .from("conversations")
      .upsert(
        {
          account_id: account.id,
          peer_igsid: peer.id,
          peer_username: peer.username ?? null,
          ig_conversation_id: convo.id,
        },
        { onConflict: "account_id,peer_igsid" }
      )
      .select("id")
      .single();
    if (error) {
      console.error("conversation upsert failed", error);
      continue;
    }
    threads++;

    const msgs: IgMessage[] = convo.messages?.data ?? [];
    let lastAt: string | null = null;
    let lastInboundAt: string | null = null;

    for (const m of msgs) {
      const isFromMe =
        m.from?.username === account.username || m.from?.id === account.ig_user_id;
      const sentAt = m.created_time
        ? new Date(m.created_time).toISOString()
        : new Date().toISOString();

      const { error: msgError } = await db.from("messages").upsert(
        {
          account_id: account.id,
          conversation_id: row.id,
          mid: m.id,
          is_from_me: isFromMe,
          text: m.message || null,
          attachments: m.attachments?.data ?? null,
          sent_at: sentAt,
        },
        { onConflict: "mid", ignoreDuplicates: true }
      );
      if (!msgError) messages++;

      if (!lastAt || sentAt > lastAt) lastAt = sentAt;
      if (!isFromMe && (!lastInboundAt || sentAt > lastInboundAt)) {
        lastInboundAt = sentAt;
      }
    }

    if (lastAt) {
      await db
        .from("conversations")
        .update({ last_message_at: lastAt, last_inbound_at: lastInboundAt })
        .eq("id", row.id)
        .is("last_message_at", null); // don't clobber fresher webhook data
    }
  }

  return NextResponse.json({ threads, messages });
}
