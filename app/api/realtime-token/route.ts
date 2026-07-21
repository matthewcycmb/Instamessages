import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { getSessionAccountId } from "@/lib/session";

/**
 * Mints a short-lived Supabase JWT (signed with the project's legacy JWT
 * secret) carrying an `account_id` claim. The browser uses it only for
 * Realtime subscriptions; RLS policies check the claim.
 */
export async function GET() {
  const accountId = await getSessionAccountId();
  if (!accountId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SUPABASE_JWT_SECRET not configured" }, { status: 500 });
  }

  const token = await new SignJWT({
    role: "authenticated",
    account_id: accountId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(accountId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json({ token, expiresIn: 3600 });
}
