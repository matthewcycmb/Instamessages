import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/webhook-verify";
import { ingestMessagingEvent, WebhookMessagingEvent } from "@/lib/ingest";
import { supabaseAdmin, Account } from "@/lib/supabase";

export const runtime = "nodejs";

/** Meta's one-time subscription verification handshake. */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.IG_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type WebhookBody = {
  object?: string;
  entry?: Array<{
    id: string; // your Instagram professional account ID
    time?: number;
    messaging?: WebhookMessagingEvent[];
  }>;
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifyMetaSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  if (body.object !== "instagram") {
    return NextResponse.json({ ignored: true });
  }

  const db = supabaseAdmin();

  for (const entry of body.entry ?? []) {
    const { data: account } = await db
      .from("accounts")
      .select("*")
      .eq("ig_user_id", entry.id)
      .maybeSingle();
    if (!account) continue; // webhook for an account we don't manage

    for (const event of entry.messaging ?? []) {
      try {
        await ingestMessagingEvent(account as Account, event);
      } catch (err) {
        // Log and keep going — returning non-200 makes Meta retry the whole batch.
        console.error("ingest error", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
