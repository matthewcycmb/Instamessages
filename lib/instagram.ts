/**
 * Instagram API with Instagram Login (no Facebook Page required).
 * OAuth host:  api.instagram.com / www.instagram.com
 * Graph host:  graph.instagram.com
 */

const GRAPH = "https://graph.instagram.com/v23.0";

export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env("IG_APP_ID"),
    redirect_uri: env("IG_REDIRECT_URI"),
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_manage_messages",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const body = new URLSearchParams({
    client_id: env("IG_APP_ID"),
    client_secret: env("IG_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: env("IG_REDIRECT_URI"),
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  const data = await asJson(res, "code exchange");
  return { access_token: data.access_token, user_id: String(data.user_id) };
}

export async function exchangeLongLived(shortToken: string): Promise<{
  access_token: string;
  expires_in: number; // seconds, ~60 days
}> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: env("IG_APP_SECRET"),
    access_token: shortToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${params}`);
  return asJson(res, "long-lived exchange");
}

export async function refreshLongLived(token: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: token,
  });
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params}`
  );
  return asJson(res, "token refresh");
}

export async function getMe(token: string): Promise<{
  user_id: string; // professional account ID — matches webhook entry.id
  username: string;
}> {
  const res = await fetch(
    `${GRAPH}/me?fields=user_id,username&access_token=${encodeURIComponent(token)}`
  );
  const data = await asJson(res, "me");
  return { user_id: String(data.user_id), username: data.username };
}

export type IgParticipant = { id: string; username?: string };
export type IgMessage = {
  id: string;
  created_time: string;
  from?: IgParticipant;
  to?: { data: IgParticipant[] };
  message?: string;
  attachments?: { data: unknown[] };
};
export type IgConversation = {
  id: string;
  updated_time?: string;
  participants?: { data: IgParticipant[] };
  messages?: { data: IgMessage[] };
};

/**
 * Lists conversations with participants and the 20 most recent messages each
 * (a hard platform cap — older message details are not retrievable via API).
 * Follows pagination up to `maxPages`.
 */
export async function getConversations(
  token: string,
  maxPages = 10
): Promise<IgConversation[]> {
  const fields =
    "id,updated_time,participants,messages.limit(20){id,created_time,from,to,message,attachments}";
  let url = `${GRAPH}/me/conversations?platform=instagram&fields=${encodeURIComponent(
    fields
  )}&access_token=${encodeURIComponent(token)}`;

  const all: IgConversation[] = [];
  for (let page = 0; page < maxPages && url; page++) {
    const res = await fetch(url);
    const data = await asJson(res, "conversations");
    all.push(...(data.data ?? []));
    url = data.paging?.next ?? "";
  }
  return all;
}

/**
 * A Creator account must make at least one Conversations API call before
 * Meta starts delivering message webhooks. Called once after connect.
 */
export async function primeWebhooks(token: string): Promise<void> {
  const url = `${GRAPH}/me/conversations?platform=instagram&fields=id&limit=1&access_token=${encodeURIComponent(token)}`;
  await fetch(url); // response intentionally ignored; the call itself is the point
}

export async function sendText(
  token: string,
  recipientIgsid: string,
  text: string
): Promise<{ message_id: string }> {
  const res = await fetch(`${GRAPH}/me/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientIgsid },
      message: { text },
    }),
  });
  return asJson(res, "send message");
}

/** Profile of a person who messaged you (name/username/avatar). Best-effort. */
export async function getProfile(
  token: string,
  igsid: string
): Promise<{ username?: string; name?: string; profile_pic?: string } | null> {
  try {
    const res = await fetch(
      `${GRAPH}/${igsid}?fields=username,name,profile_pic&access_token=${encodeURIComponent(token)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function asJson(res: Response, label: string): Promise<any> {
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(
      `Instagram API error (${label}): ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data;
}
