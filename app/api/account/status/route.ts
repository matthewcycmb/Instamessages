import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { getMe } from "@/lib/instagram";

/**
 * Post-connect verification (design 2a/2b "Checking" state): confirms the
 * connected account is a professional (Creator/Business) account.
 */
export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const me = await getMe(account.access_token);
    const type = (me.account_type ?? "").toUpperCase();
    // If the OAuth succeeded at all, the account is nearly always professional;
    // treat unknown as professional and only fail on an explicit PERSONAL.
    const isProfessional = type !== "PERSONAL";
    return NextResponse.json({ username: me.username, accountType: type || null, isProfessional });
  } catch (err) {
    console.error("account status check failed", err);
    return NextResponse.json({ error: "Could not reach Instagram" }, { status: 502 });
  }
}
