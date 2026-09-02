// A tap on Get Konvo on the landing page (Sep 1): a count per code and one
// event on the sender's person. No device, no IP, nothing else.
import { storeConfigured } from "@/lib/push-store";
import { bumpTap, captureServer, cleanHandle, getCode, validHandle } from "@/lib/invite";

export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false }, { status: 503 });
  let b: { handle?: unknown };
  try { b = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!validHandle(b.handle)) return Response.json({ ok: false }, { status: 400 });
  const code = cleanHandle(b.handle);
  await bumpTap(code);
  const senderRc = await getCode(code);
  if (senderRc) await captureServer("invite_link_tapped", senderRc, { code });
  return Response.json({ ok: true });
}
