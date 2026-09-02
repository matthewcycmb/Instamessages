// A friend claims a code (Sep 1): the rules in lib/invite-rules decide, then
// two RevenueCat grants: a week for the friend, a week onto the sender's end.
import { storeConfigured } from "@/lib/push-store";
import {
  captureServer, claimedBy, claimsOf, cleanHandle, expiryOf, getCode, grantWeek,
  rcConfigured, recordClaim, validHandle, validRc,
} from "@/lib/invite";
import { decideClaim } from "@/lib/invite-rules";

export async function POST(req: Request) {
  if (!storeConfigured() || !rcConfigured()) return Response.json({ ok: false, reason: "config" }, { status: 503 });
  let b: { handle?: unknown; rc?: unknown; method?: unknown; friend_handle?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle) || !validRc(b.rc)) return Response.json({ ok: false }, { status: 400 });
  const code = cleanHandle(b.handle);
  const senderRc = await getCode(code);
  const verdict = decideClaim({
    code: senderRc ? { rc: senderRc } : null,
    friendRc: b.rc,
    alreadyClaimed: await claimedBy(b.rc),
    claims: await claimsOf(code),
  });
  if (!verdict.ok) return Response.json(verdict, { status: 409 });
  const friendHandle = validHandle(b.friend_handle) ? cleanHandle(b.friend_handle) : "";
  await recordClaim(code, b.rc, friendHandle);
  const expires = await grantWeek(b.rc);
  const senderExpiry = await expiryOf(senderRc!);
  await grantWeek(senderRc!, senderExpiry ?? undefined);
  const method = b.method === "handle" ? "handle" : "clipboard";
  await Promise.all([
    captureServer("invite_claimed", b.rc, { method, code }),
    captureServer("referral_week_granted", b.rc, { role: "friend", week_n: 1 }),
    captureServer("referral_week_granted", senderRc!, { role: "sender", week_n: verdict.weekN + 1 }),
  ]);
  return Response.json({ ok: true, expires });
}
