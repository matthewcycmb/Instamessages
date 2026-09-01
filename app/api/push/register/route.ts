// A Konvo phone hands over its APNs token (Sep 1). Nothing else about the
// person is sent or kept.
import { saveToken, storeConfigured, type TokenEnv } from "@/lib/push-store";

export async function POST(req: Request) {
  if (!storeConfigured()) return Response.json({ ok: false, reason: "store" }, { status: 503 });
  let body: { token?: unknown; env?: unknown; build?: unknown };
  try { body = await req.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }
  const token = typeof body.token === "string" ? body.token.toLowerCase() : "";
  if (!/^[0-9a-f]{64,200}$/.test(token)) return Response.json({ ok: false }, { status: 400 });
  const env: TokenEnv = body.env === "sandbox" ? "sandbox" : "production";
  const build = typeof body.build === "string" ? body.build.slice(0, 8) : "";
  await saveToken(token, env, build);
  return Response.json({ ok: true });
}
