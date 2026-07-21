import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabaseAdmin()
    .from("conversations")
    .select(
      "id, peer_igsid, peer_username, peer_name, peer_avatar_url, last_message_at, last_inbound_at, unread_count"
    )
    .eq("account_id", account.id)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data });
}
