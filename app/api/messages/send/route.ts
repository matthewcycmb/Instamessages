import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { sendText, REPLY_WINDOW_MS } from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { conversationId, text } = await req.json();
  if (typeof conversationId !== "string" || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "conversationId and text required" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: convo } = await db
    .from("conversations")
    .select("id, peer_igsid, last_inbound_at")
    .eq("id", conversationId)
    .eq("account_id", account.id)
    .maybeSingle();

  if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  // Enforce Instagram's 24h reply window server-side; the UI shows the countdown.
  const lastInbound = convo.last_inbound_at ? new Date(convo.last_inbound_at).getTime() : 0;
  if (!lastInbound || Date.now() - lastInbound > REPLY_WINDOW_MS) {
    return NextResponse.json(
      {
        error:
          "Reply window closed. Instagram only lets connected apps reply within 24 hours of their last message.",
        code: "WINDOW_CLOSED",
      },
      { status: 409 }
    );
  }

  try {
    const sent = await sendText(account.access_token, convo.peer_igsid, text.trim());

    const sentAt = new Date().toISOString();
    // Store immediately; the echo webhook for this mid dedupes via unique(mid).
    const { data: message } = await db
      .from("messages")
      .insert({
        account_id: account.id,
        conversation_id: convo.id,
        mid: sent.message_id ?? null,
        is_from_me: true,
        text: text.trim(),
        sent_at: sentAt,
      })
      .select("*")
      .single();

    await db
      .from("conversations")
      .update({ last_message_at: sentAt })
      .eq("id", convo.id);

    return NextResponse.json({ message });
  } catch (err) {
    console.error("send failed", err);
    return NextResponse.json(
      { error: "Instagram rejected the message. The window may have just closed." },
      { status: 502 }
    );
  }
}
