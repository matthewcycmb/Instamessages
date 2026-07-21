"use client";

import { useEffect, useState } from "react";

type Settings = {
  username: string;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
  retention_days: number | null;
};

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pushState, setPushState] = useState<"unknown" | "enabled" | "unsupported" | "denied">(
    "unknown"
  );

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushState("unsupported");
    } else if (Notification.permission === "granted") {
      setPushState("enabled");
    } else if (Notification.permission === "denied") {
      setPushState("denied");
    }
  }, []);

  async function enablePush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error();
      setPushState("enabled");
      flash("Notifications enabled");
    } catch {
      flash("Enabling notifications failed");
    }
  }

  async function save(partial: Partial<Settings>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      setSettings((s) => (s ? { ...s, ...partial } : s));
      flash("Saved");
    } else {
      flash("Save failed");
    }
  }

  async function wipe() {
    if (!window.confirm("Delete every stored message and conversation? This cannot be undone.")) {
      return;
    }
    const res = await fetch("/api/settings/wipe", { method: "POST" });
    flash(res.ok ? "All messages deleted" : "Wipe failed");
  }

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2500);
  }

  if (!settings) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;
  }

  return (
    <div className="space-y-4">
      {status && (
        <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-2.5 text-sm text-amber">
          {status}
        </div>
      )}

      <Section title="Notifications">
        {pushState === "enabled" ? (
          <p className="text-sm text-muted">Push notifications are on for this device.</p>
        ) : pushState === "unsupported" ? (
          <p className="text-sm text-muted">
            This browser doesn&rsquo;t support web push. On iPhone: share → Add to Home Screen,
            then open the installed app and enable notifications here.
          </p>
        ) : pushState === "denied" ? (
          <p className="text-sm text-muted">
            Notifications are blocked for this app in system settings.
          </p>
        ) : (
          <button
            onClick={enablePush}
            className="rounded-full border border-amber/60 px-4 py-2 text-sm font-bold text-amber transition-colors hover:bg-amber/10"
          >
            Enable notifications on this device
          </button>
        )}
      </Section>

      <Section title="Quiet hours">
        <p className="mb-3 text-sm text-muted">No pushes between these hours ({settings.timezone}).</p>
        <div className="flex items-center gap-3">
          <HourSelect
            value={settings.quiet_hours_start}
            onChange={(v) => save({ quiet_hours_start: v })}
          />
          <span className="text-faint">to</span>
          <HourSelect
            value={settings.quiet_hours_end}
            onChange={(v) => save({ quiet_hours_end: v })}
          />
        </div>
      </Section>

      <Section title="Message retention">
        <p className="mb-3 text-sm text-muted">
          How long stored messages are kept before automatic deletion.
        </p>
        <select
          value={settings.retention_days ?? ""}
          onChange={(e) =>
            save({ retention_days: e.target.value === "" ? null : Number(e.target.value) })
          }
          className="rounded-xl border border-line bg-surface px-3 py-2 text-sm focus:border-amber focus:outline-none"
        >
          <option value="">Keep forever</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
      </Section>

      <Section title="Danger zone">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={wipe}
            className="rounded-full border border-ember/60 px-4 py-2 text-sm font-bold text-ember transition-colors hover:bg-ember/10"
          >
            Delete all stored messages
          </button>
          <form action="/api/auth/logout" method="POST">
            <button className="rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-ink hover:text-ink">
              Sign out (@{settings.username})
            </button>
          </form>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-4">
      <h2 className="mb-2 font-display text-lg font-semibold italic">{title}</h2>
      {children}
    </section>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm focus:border-amber focus:outline-none"
    >
      {Array.from({ length: 24 }, (_, h) => (
        <option key={h} value={h}>
          {h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
        </option>
      ))}
    </select>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
