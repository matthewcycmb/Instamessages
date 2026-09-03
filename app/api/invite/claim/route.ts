// A friend claims a code (Sep 2, final rule): the rules in lib/invite-rules
// decide, then the friend gets 3 days. The sender gets nothing; a code
// serves three friends at most.
import { storeConfigured } from "@/lib/push-store";
import {
  FREE_DAYS, captureServer, claimedBy, claimsOf, cleanHandle, getCode, grantDays,
  rcConfigured, recordClaim, validHandle, validRc,
} from "@/lib/invite";
import { capFor, decideClaim } from "@/lib/invite-rules";

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
    cap: capFor(code),
  });
  if (!verdict.ok) return Response.json(verdict, { status: 409 });
  const friendHandle = validHandle(b.friend_handle) ? cleanHandle(b.friend_handle) : "";
  await recordClaim(code, b.rc, friendHandle);
  const expires = await grantDays(b.rc);
  const method = b.method === "handle" ? "handle" : "clipboard";
  await Promise.all([
    captureServer("invite_claimed", b.rc, { method, code, join_n: verdict.joinN }),
    captureServer("referral_days_granted", b.rc, { role: "friend", days: FREE_DAYS }),
    captureServer("invite_friend_joined", senderRc!, { code, join_n: verdict.joinN }),
  ]);
  return Response.json({ ok: true, expires });
}
