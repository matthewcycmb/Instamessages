import { NextResponse, after } from "next/server";
import { currentAccount } from "@/lib/account";
import { syncAccount, backfillProfiles } from "@/lib/sync";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { threads, messages } = await syncAccount(account);

  // Names/photos fill in after the response; no need to make the user wait.
  after(() => backfillProfiles(account));

  return NextResponse.json({ threads, messages });
}
