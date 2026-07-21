import { NextRequest, NextResponse } from "next/server";
import { refreshLongLived } from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;

/**
 * Weekly cron (see vercel.json):
 * 1. Refreshes long-lived Instagram tokens (they last ~60 days; Meta requires
 *    a token to be >24h old before it can be refreshed).
 * 2. Applies each account's message retention setting.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: accounts } = await db.from("accounts").select("*");

  let refreshed = 0;
  let pruned = 0;

  for (const account of accounts ?? []) {
    const issuedAgoMs = Date.now() - new Date(account.token_issued_at).getTime();
    if (issuedAgoMs > 24 * 60 * 60 * 1000) {
      try {
        const next = await refreshLongLived(account.access_token);
        await db
          .from("accounts")
          .update({
            access_token: next.access_token,
            token_issued_at: new Date().toISOString(),
            token_expires_at: new Date(Date.now() + next.expires_in * 1000).toISOString(),
          })
          .eq("id", account.id);
        refreshed++;
      } catch (err) {
        console.error(`token refresh failed for @${account.username}`, err);
      }
    }

    if (account.retention_days) {
      const cutoff = new Date(
        Date.now() - account.retention_days * 24 * 60 * 60 * 1000
      ).toISOString();
      const { count } = await db
        .from("messages")
        .delete({ count: "exact" })
        .eq("account_id", account.id)
        .lt("sent_at", cutoff);
      pruned += count ?? 0;
    }
  }

  return NextResponse.json({ refreshed, pruned });
}
