import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSession } from "@/lib/session";

/**
 * Local-testing only: signs you in as the first connected account so the
 * inbox can be tested on localhost, where the Instagram OAuth redirect
 * (which points at the production domain) can't complete.
 *
 * Gated by ALLOW_DEV_LOGIN=1, which is set in .env.local and must never be
 * set in production env.
 */
export async function GET(req: NextRequest) {
  if (process.env.ALLOW_DEV_LOGIN !== "1") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data: account } = await supabaseAdmin()
    .from("accounts")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!account) {
    return NextResponse.json(
      { error: "No connected account yet. Connect on the production app first." },
      { status: 404 }
    );
  }

  await createSession(account.id);
  return NextResponse.redirect(new URL("/", req.nextUrl.origin));
}
