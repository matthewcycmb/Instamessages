// The share sheet completed: week 1 for the sender, once per RevenueCat id,
// no purchase, nothing to cancel (Sep 1).
import { storeConfigured } from "@/lib/push-store";
import { captureServer, expiryOf, grantWeek, rcConfigured, registerCode, sentOnce, validHandle, validRc } from "@/lib/invite";

export async function POST(req: Request) {
  if (!storeConfigured() || !rcConfigured()) return Response.json({ ok: false, reason: "config" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown; draft?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  await registerCode(b.handle, b.rc);
  if (!(await sentOnce(b.rc))) return Response.json({ ok: true, expires: await expiryOf(b.rc) });
  const expires = await grantWeek(b.rc);
  await captureServer("referral_week_granted", b.rc, { role: "sender", week_n: 1 });
  return Response.json({ ok: true, expires });
}
