// Admin: strip promotional days from one RevenueCat subscriber. Guarded by
// CRON_SECRET; used to reset Matthew's own test devices (Sep 3).
import { rcConfigured, revokeDays, validRc } from "@/lib/invite";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!rcConfigured()) return Response.json({ ok: false, reason: "no_rc" }, { status: 503 });
  let b: { rc?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validRc(b.rc)) return Response.json({ ok: false, reason: "bad_rc" }, { status: 400 });
  try {
    const expires = await revokeDays(b.rc);
    return Response.json({ ok: true, expires });
  } catch (e) {
    return Response.json({ ok: false, reason: String(e) }, { status: 502 });
  }
}
