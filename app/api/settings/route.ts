import { NextRequest, NextResponse } from "next/server";
import { currentAccount } from "@/lib/account";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  return NextResponse.json({
    username: account.username,
    quiet_hours_start: account.quiet_hours_start,
    quiet_hours_end: account.quiet_hours_end,
    timezone: account.timezone,
    retention_days: account.retention_days,
    auto_reply_enabled: account.auto_reply_enabled ?? false,
    auto_reply_text: account.auto_reply_text ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (Number.isInteger(body.quiet_hours_start) && body.quiet_hours_start >= 0 && body.quiet_hours_start <= 23) {
    updates.quiet_hours_start = body.quiet_hours_start;
  }
  if (Number.isInteger(body.quiet_hours_end) && body.quiet_hours_end >= 0 && body.quiet_hours_end <= 23) {
    updates.quiet_hours_end = body.quiet_hours_end;
  }
  if (typeof body.timezone === "string" && body.timezone.length < 64) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: body.timezone });
      updates.timezone = body.timezone;
    } catch {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }
  }
  if (body.retention_days === null || (Number.isInteger(body.retention_days) && body.retention_days > 0)) {
    updates.retention_days = body.retention_days;
  }
  if (typeof body.auto_reply_enabled === "boolean") {
    updates.auto_reply_enabled = body.auto_reply_enabled;
  }
  if (typeof body.auto_reply_text === "string" && body.auto_reply_text.length <= 500) {
    updates.auto_reply_text = body.auto_reply_text.trim() || null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("accounts")
    .update(updates)
    .eq("id", account.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
