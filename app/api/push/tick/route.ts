// The heartbeat (Sep 1): every 15 minutes (GitHub Actions cron) send an
// empty push to every registered phone; each phone then checks its own
// inbox locally. Guarded by a bearer secret.
import { apnsConfigured, sendSilent } from "@/lib/apns";
import { dropTokens, listTokens, storeConfigured, type TokenEnv } from "@/lib/push-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function tick(req: Request) {
  const expected = process.env.PUSH_TICK_SECRET ?? process.env.CRON_SECRET;
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!storeConfigured() || !apnsConfigured()) {
    return Response.json({ ok: false, store: storeConfigured(), apns: apnsConfigured() }, { status: 503 });
  }
  const out: Record<string, unknown> = { ok: true };
  for (const env of ["production", "sandbox"] as TokenEnv[]) {
    const tokens = await listTokens(env);
    const r = await sendSilent(env, tokens);
    await dropTokens(env, r.gone);
    out[env] = { tokens: tokens.length, sent: r.sent, gone: r.gone.length, failed: r.failed };
  }
  return Response.json(out);
}

export const GET = tick;
export const POST = tick;
