// The sender's joins (the heartbeat asks after each wake) and, for a friend,
// the current expiry.
import { storeConfigured } from "@/lib/push-store";
import { claimList, codeOf, expiryOf, rcConfigured, validRc } from "@/lib/invite";
import { CAP } from "@/lib/invite-rules";

export async function GET(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  const rc = new URL(req.url).searchParams.get("rc");
  if (!validRc(rc)) return Response.json({ ok: false }, { status: 400 });
  const handle = await codeOf(rc);
  const joined = handle ? await claimList(handle) : [];
  const expires = rcConfigured() ? await expiryOf(rc) : null;
  return Response.json({ ok: true, handle, claims: joined.length, cap: CAP, joined, expires });
}
