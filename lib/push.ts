import webpush from "web-push";
import { supabaseAdmin, Account } from "./supabase";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!pub || !priv) return false; // push not set up yet — degrade silently
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

/** True if the account's local hour falls inside its quiet window. */
export function inQuietHours(account: Account, now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: account.timezone,
    }).format(now)
  );
  const { quiet_hours_start: start, quiet_hours_end: end } = account;
  if (start === end) return false;
  // Window may wrap midnight (e.g. 23 → 8).
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export async function pushNewMessage(
  account: Account,
  senderLabel: string,
  snippet: string,
  conversationId: string
): Promise<void> {
  if (!ensureConfigured()) return;
  if (inQuietHours(account)) return;

  const db = supabaseAdmin();
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("account_id", account.id);

  if (!subs?.length) return;

  const payload = JSON.stringify({
    title: senderLabel,
    body: snippet,
    url: `/t/${conversationId}`,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
      } catch (err: unknown) {
        // 404/410 mean the subscription is dead — prune it.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    })
  );
}
