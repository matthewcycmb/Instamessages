// The sender's phone registers its code (its Instagram handle) against its
// RevenueCat id before the share sheet opens (Sep 1). Idempotent.
import { storeConfigured } from "@/lib/push-store";
import { registerCode, validHandle, validRc } from "@/lib/invite";

export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  await registerCode(b.handle, b.rc);
  return Response.json({ ok: true });
}
