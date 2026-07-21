import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { error } = await supabaseAdmin().from("push_subscriptions").upsert(
    {
      account_id: account.id,
      endpoint: subscription.endpoint,
      subscription,
    },
    { onConflict: "endpoint" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
