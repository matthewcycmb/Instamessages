import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

/** Deletes all stored messages and conversations for this account. */
export async function POST() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const db = supabaseAdmin();
  // messages cascade from conversations
  const { error } = await db.from("conversations").delete().eq("account_id", account.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
