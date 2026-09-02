// The share sheet completed (Sep 2 rule): nothing is granted for sending.
// The code is registered, the send noted once per RevenueCat id, and the
// current expiry (if any) is read back so the page can tell the sender
// where they stand.
import { storeConfigured } from "@/lib/push-store";
import { expiryOf, rcConfigured, registerCode, sentOnce, validHandle, validRc } from "@/lib/invite";

export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown; draft?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  await registerCode(b.handle, b.rc);
  await sentOnce(b.rc);
  const expires = rcConfigured() ? await expiryOf(b.rc) : null;
  return Response.json({ ok: true, expires });
}
