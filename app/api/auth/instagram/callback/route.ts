import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCode,
  exchangeLongLived,
  getMe,
  primeWebhooks,
} from "@/lib/instagram";
import { supabaseAdmin } from "@/lib/supabase";
import { createSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error_description") ?? params.get("error");

  const home = new URL("/", req.nextUrl.origin);
  if (error) return NextResponse.redirect(withError(home, error));
  if (!code) return NextResponse.redirect(withError(home, "Missing code"));

  const store = await cookies();
  const expectedState = store.get("ig_oauth_state")?.value;
  store.delete("ig_oauth_state");
  if (!expectedState || state !== expectedState) {
    return NextResponse.redirect(withError(home, "State mismatch — try again"));
  }

  try {
    const short = await exchangeCode(code);
    const longLived = await exchangeLongLived(short.access_token);
    const me = await getMe(longLived.access_token);

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);
    const db = supabaseAdmin();

    const { data: account, error: dbError } = await db
      .from("accounts")
      .upsert(
        {
          ig_user_id: me.user_id,
          username: me.username,
          access_token: longLived.access_token,
          token_issued_at: new Date().toISOString(),
          token_expires_at: expiresAt.toISOString(),
        },
        { onConflict: "ig_user_id" }
      )
      .select("id")
      .single();
    if (dbError) throw dbError;

    // Creator accounts must hit the Conversations API once before Meta
    // starts delivering message webhooks. Do it now so sync "just works".
    await primeWebhooks(longLived.access_token);

    await createSession(account.id);
    return NextResponse.redirect(home);
  } catch (err) {
    console.error("Instagram connect failed", err);
    return NextResponse.redirect(
      withError(home, "Connecting Instagram failed — check server logs")
    );
  }
}

function withError(url: URL, message: string): URL {
  const u = new URL(url);
  u.searchParams.set("error", message);
  return u;
}
