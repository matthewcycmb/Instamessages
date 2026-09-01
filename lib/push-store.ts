// Device tokens for the silent-push heartbeat (Sep 1). Upstash Redis via
// the Vercel Marketplace: its env vars land on the project by themselves.
// A token is all the server ever knows about a phone.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const secret = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const storeConfigured = () => Boolean(url && secret);

async function redis(...cmd: (string | number)[]): Promise<unknown> {
  const r = await fetch(url!, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return ((await r.json()) as { result: unknown }).result;
}

export type TokenEnv = "production" | "sandbox";

export const saveToken = (token: string, env: TokenEnv, build: string) =>
  redis("HSET", `push:${env}`, token, JSON.stringify({ build, seen: Date.now() }));

export const listTokens = async (env: TokenEnv) => (await redis("HKEYS", `push:${env}`)) as string[];

export const dropTokens = (env: TokenEnv, tokens: string[]) =>
  tokens.length ? redis("HDEL", `push:${env}`, ...tokens) : Promise.resolve(0);
