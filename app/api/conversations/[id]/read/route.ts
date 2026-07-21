import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

/** Clears the unread badge when a thread is opened. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  await supabaseAdmin()
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", id)
    .eq("account_id", account.id);

  return NextResponse.json({ ok: true });
}
