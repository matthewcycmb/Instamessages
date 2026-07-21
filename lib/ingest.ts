import { supabaseAdmin, Account, Attachment } from "./supabase";
import { getProfile } from "./instagram";
import { pushNewMessage } from "./push";

export type WebhookMessagingEvent = {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    attachments?: Attachment[];
    is_echo?: boolean;
    is_deleted?: boolean;
  };
};

/**
 * Handles one `messaging` event from an Instagram webhook entry:
 * upserts the conversation, dedupes by mid, stores the message, bumps
 * unread/window state, and fires a push for inbound messages.
 */
export async function ingestMessagingEvent(
  account: Account,
  event: WebhookMessagingEvent
): Promise<void> {
  const msg = event.message;
  if (!msg?.mid || msg.is_deleted) return;

  const isEcho = Boolean(msg.is_echo);
  // Echoes are messages *you* sent from another client (e.g. instagram.com).
  const peerIgsid = isEcho ? event.recipient?.id : event.sender?.id;
  if (!peerIgsid) return;

  const db = supabaseAdmin();
  const sentAt = new Date(event.timestamp ?? Date.now()).toISOString();

  // Find or create the conversation for this peer.
  let { data: convo } = await db
    .from("conversations")
    .select("id, peer_username, peer_name, unread_count")
    .eq("account_id", account.id)
    .eq("peer_igsid", peerIgsid)
    .maybeSingle();

  if (!convo) {
    const profile = await getProfile(account.access_token, peerIgsid);
    const { data: created, error } = await db
      .from("conversations")
      .insert({
        account_id: account.id,
        peer_igsid: peerIgsid,
        peer_username: profile?.username ?? null,
        peer_name: profile?.name ?? null,
        peer_avatar_url: profile?.profile_pic ?? null,
      })
      .select("id, peer_username, peer_name, unread_count")
      .single();
    if (error) throw error;
    convo = created;
  }

  // Insert the message; unique(mid) makes webhook redelivery + send-echo a no-op.
  const { error: insertError } = await db.from("messages").insert({
    account_id: account.id,
    conversation_id: convo.id,
    mid: msg.mid,
    is_from_me: isEcho,
    text: msg.text ?? null,
    attachments: msg.attachments ?? null,
    sent_at: sentAt,
  });
  if (insertError) {
    if (insertError.code === "23505") return; // duplicate mid — already ingested
    throw insertError;
  }

  await db
    .from("conversations")
    .update({
      last_message_at: sentAt,
      ...(isEcho
        ? {}
        : {
            last_inbound_at: sentAt,
            unread_count: (convo.unread_count ?? 0) + 1,
          }),
    })
    .eq("id", convo.id);

  if (!isEcho) {
    const label =
      convo.peer_name || (convo.peer_username ? `@${convo.peer_username}` : "New message");
    const snippet = msg.text ?? (msg.attachments?.length ? "Sent an attachment" : "New message");
    await pushNewMessage(account, label, snippet, convo.id);
  }
}
