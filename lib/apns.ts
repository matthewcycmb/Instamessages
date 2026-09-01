// Empty (content-available) pushes over APNs HTTP/2 with a token-based
// JWT (Sep 1). One JWT per ~50 minutes, one connection per tick.
import { createPrivateKey, sign } from "node:crypto";
import http2 from "node:http2";
import type { TokenEnv } from "./push-store";

const HOSTS: Record<TokenEnv, string> = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
};

let cached: { jwt: string; at: number } | null = null;
function jwt(): string {
  if (cached && Date.now() - cached.at < 50 * 60 * 1000) return cached.jwt;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const header = b64({ alg: "ES256", kid: process.env.APNS_KEY_ID });
  const claims = b64({ iss: process.env.APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) });
  const key = createPrivateKey((process.env.APNS_KEY_P8 ?? "").replace(/\\n/g, "\n"));
  const sig = sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  cached = { jwt: `${header}.${claims}.${sig}`, at: Date.now() };
  return cached.jwt;
}

export const apnsConfigured = () =>
  Boolean(process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID && process.env.APNS_KEY_P8);

// Tokens APNs says are dead come back in `gone` so the store can forget them.
export async function sendSilent(env: TokenEnv, tokens: string[]) {
  const result = { sent: 0, gone: [] as string[], failed: 0 };
  if (!tokens.length) return result;
  const client = http2.connect(HOSTS[env]);
  const topic = process.env.APNS_TOPIC ?? "com.matthewchan.konvo";
  const body = JSON.stringify({ aps: { "content-available": 1 } });
  const auth = `bearer ${jwt()}`;
  const one = (token: string) =>
    new Promise<void>((resolve) => {
      const req = client.request({
        ":method": "POST",
        ":path": `/3/device/${token}`,
        authorization: auth,
        "apns-topic": topic,
        "apns-push-type": "background",
        "apns-priority": "5",
        "apns-expiration": "0",
      });
      let status = 0;
      let text = "";
      req.on("response", (h) => { status = Number(h[":status"]); });
      req.on("data", (c) => { text += c; });
      req.on("end", () => {
        if (status === 200) result.sent++;
        else if (/BadDeviceToken|Unregistered|DeviceTokenNotForTopic/.test(text)) result.gone.push(token);
        else result.failed++;
        resolve();
      });
      req.on("error", () => { result.failed++; resolve(); });
      req.setTimeout(10000, () => req.close());
      req.end(body);
    });
  // ponytail: batches of 20 on one connection; a fleet needs streaming.
  for (let i = 0; i < tokens.length; i += 20) {
    await Promise.all(tokens.slice(i, i + 20).map(one));
  }
  client.close();
  return result;
}
