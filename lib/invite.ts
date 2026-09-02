// Codes, claims and taps for the invite loop (Sep 1). The code IS the
// sender's Instagram handle. The store knows handles, RevenueCat app user
// ids and counts; never a message, never a contact, never a device.
import { redis } from "./push-store";

const h = (handle: string) => handle.toLowerCase().replace(/^@/, "");

export const validHandle = (x: unknown): x is string =>
  typeof x === "string" && /^@?[a-z0-9._]{1,30}$/i.test(x);
export const validRc = (x: unknown): x is string =>
  typeof x === "string" && /^[A-Za-z0-9$:._-]{4,120}$/.test(x);
export const cleanHandle = h;

export const registerCode = (handle: string, rc: string) =>
  Promise.all([redis("HSETNX", "inv:codes", h(handle), rc), redis("HSET", "inv:rc", rc, h(handle))]);
export const getCode = async (handle: string) => (await redis("HGET", "inv:codes", h(handle))) as string | null;
export const codeOf = async (rc: string) => (await redis("HGET", "inv:rc", rc)) as string | null;
export const claimsOf = async (handle: string) => Number(await redis("HLEN", `inv:claims:${h(handle)}`)) || 0;
export const claimedBy = async (friendRc: string) => (await redis("HGET", "inv:claimed", friendRc)) as string | null;
export const recordClaim = (handle: string, friendRc: string, friendHandle: string) =>
  Promise.all([
    redis("HSET", `inv:claims:${h(handle)}`, friendRc, JSON.stringify({ handle: friendHandle, at: Date.now() })),
    redis("HSET", "inv:claimed", friendRc, h(handle)),
  ]);
export const claimList = async (handle: string) =>
  Object.values(((await redis("HGETALL", `inv:claims:${h(handle)}`)) as Record<string, string> | null) ?? {})
    .map((v) => JSON.parse(v) as { handle: string; at: number })
    .sort((a, b) => a.at - b.at);
export const bumpTap = (handle: string) => redis("HINCRBY", "inv:taps", h(handle), 1);
// Week 1 for the sender is granted once per RevenueCat id, however many
// times the share sheet completes.
export const sentOnce = async (rc: string) => (await redis("HSETNX", "inv:sent", rc, String(Date.now()))) === 1;

// RevenueCat REST v1, secret key server-side only. A promotional grant of
// "weekly" is 7 days from start_time_ms (now when omitted). An extension is
// a weekly grant starting at the current expiry; RevenueCat treats a grant
// ending within 2h of an active one as a duplicate, which +7 days never is.
const RC = "https://api.revenuecat.com/v1";
const WEEK = 7 * 86400000;
// Trimmed: the key was added from a pasteboard with a trailing newline
// (Sep 1), and a newline in a header value fails the whole request.
const rcKey = () => (process.env.REVENUECAT_SECRET_KEY ?? "").trim();
const rcHeaders = () => ({
  Authorization: `Bearer ${rcKey()}`,
  "Content-Type": "application/json",
});
export const rcConfigured = () => Boolean(rcKey());

export async function expiryOf(rc: string): Promise<number | null> {
  const r = await fetch(`${RC}/subscribers/${encodeURIComponent(rc)}`, { headers: rcHeaders(), cache: "no-store" });
  if (!r.ok) return null;
  const j = (await r.json()) as { subscriber?: { entitlements?: Record<string, { expires_date: string | null }> } };
  const e = j.subscriber?.entitlements?.Pro?.expires_date;
  return e ? Date.parse(e) : null;
}

export async function grantWeek(rc: string, fromMs?: number): Promise<number> {
  const now = Date.now();
  const start = fromMs && fromMs > now ? fromMs : now;
  const body: Record<string, unknown> = { duration: "weekly" };
  if (start !== now) body.start_time_ms = start;
  const r = await fetch(`${RC}/subscribers/${encodeURIComponent(rc)}/entitlements/Pro/promotional`, {
    method: "POST", headers: rcHeaders(), body: JSON.stringify(body), cache: "no-store",
  });
  if (!r.ok) throw new Error(`revenuecat ${r.status}`);
  return start + WEEK;
}

// Server-side PostHog capture into the app's project, so invite events sit
// on the same person as the app's events (distinct_id = RevenueCat id).
// The key is the project's public write token, the same one the app carries.
const PH_KEY = "phc_wgytRKK34P7KtTxZhz3eiWpccm7zfjbrU3MAcRfayJ7r";
export function captureServer(event: string, distinctId: string, props: Record<string, unknown>) {
  return fetch("https://us.i.posthog.com/i/v0/e/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: PH_KEY, event, distinct_id: distinctId, properties: { ...props, source: "site" } }),
  }).catch(() => undefined);
}
