import { NextResponse, after } from "next/server";
import { currentAccount } from "@/lib/account";
import { getConversations, getProfile, IgConversation, IgMessage } from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase";
import { Account } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

const CONCURRENCY = 8;

/**
 * Sync: conversation list + the 20 most recent messages per thread (a hard
 * Instagram API cap). Message rows are batched (one upsert per thread) and
 * threads run in parallel; profile backfill only touches threads that are
 * still missing a name or photo, so re-syncs get faster over time.
 */
export async function POST() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const conversations = await getConversations(account.access_token);

  let threads = 0;
  let messages = 0;

  for (let i = 0; i < conversations.length; i += CONCURRENCY) {
    const batch = conversations.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((c) => syncConversation(account, c)));
    for (const r of results) {
      if (r) {
        threads++;
        messages += r.messages;
      }
    }
  }

  // Names/photos fill in after the response; no need to make the user wait.
  after(() => backfillProfiles(account));

  return NextResponse.json({ threads, messages });
}

async function syncConversation(
  account: Account,
  convo: IgConversation
): Promise<{ messages: number } | null> {
  const db = supabaseAdmin();
  const participants = convo.participants?.data ?? [];
  const peer =
    participants.find((p) => p.username && p.username !== account.username) ??
    participants.find((p) => p.id !== account.ig_user_id);
  if (!peer) return null;

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
    return null;
  }

  const msgs: IgMessage[] = convo.messages?.data ?? [];
  let lastAt: string | null = null;
  let lastInboundAt: string | null = null;

  const rows = msgs.map((m) => {
    const isFromMe =
      m.from?.username === account.username || m.from?.id === account.ig_user_id;
    const sentAt = m.created_time
      ? new Date(m.created_time).toISOString()
      : new Date().toISOString();

    if (!lastAt || sentAt > lastAt) lastAt = sentAt;
    if (!isFromMe && (!lastInboundAt || sentAt > lastInboundAt)) lastInboundAt = sentAt;

    return {
      account_id: account.id,
      conversation_id: row.id,
      mid: m.id,
      is_from_me: isFromMe,
      text: m.message || null,
      attachments: m.attachments?.data ?? null,
      sent_at: sentAt,
    };
  });

  if (rows.length) {
    // One batched upsert per thread instead of one call per message.
    const { error: msgError } = await db
      .from("messages")
      .upsert(rows, { onConflict: "mid", ignoreDuplicates: true });
    if (msgError) console.error("message batch upsert failed", msgError);
  }

  if (lastAt) {
    await db
      .from("conversations")
      .update({ last_message_at: lastAt, last_inbound_at: lastInboundAt })
      .eq("id", row.id)
      .is("last_message_at", null); // don't clobber fresher webhook data
  }

  return { messages: rows.length };
}

/** Fetch names/photos only for threads still missing them (consent-gated). */
async function backfillProfiles(account: Account): Promise<number> {
  const db = supabaseAdmin();
  const { data: missing } = await db
    .from("conversations")
    .select("id, peer_igsid")
    .eq("account_id", account.id)
    .or("peer_avatar_url.is.null,peer_name.is.null");

  let updated = 0;
  const list = missing ?? [];
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (convo) => {
        const profile = await getProfile(account.access_token, convo.peer_igsid);
        if (!profile) return;
        const updates: Record<string, string> = {};
        if (profile.name) updates.peer_name = profile.name;
        if (profile.username) updates.peer_username = profile.username;
        if (profile.profile_pic) updates.peer_avatar_url = profile.profile_pic;
        if (Object.keys(updates).length) {
          await db.from("conversations").update(updates).eq("id", convo.id);
          updated++;
        }
      })
    );
  }
  return updated;
}
