"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listTimestamp, replyWindow } from "@/lib/format";

type Thread = {
  id: string;
  peer_igsid: string;
  peer_username: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  unread_count: number;
};

export function ThreadList() {
  const [threads, setThreads] = useState<Thread[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.conversations ?? []);
    } catch {
      /* offline — keep whatever we have */
    }
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("im:refresh-threads", load);
    const interval = setInterval(load, 15_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("im:refresh-threads", load);
      clearInterval(interval);
    };
  }, [load]);

  if (threads === null) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
        <p className="font-display text-xl italic text-ink">Nothing here yet.</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Hit <span className="text-amber">Import</span> to pull in your recent conversations, or
          wait — new DMs appear the moment a friend messages you.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {threads.map((t) => {
        const name = t.peer_name || (t.peer_username ? `@${t.peer_username}` : "Instagram user");
        const win = replyWindow(t.last_inbound_at);
        return (
          <li key={t.id}>
            <Link
              href={`/t/${t.id}`}
              className="flex items-center gap-3.5 rounded-2xl border border-transparent bg-surface px-4 py-3.5 transition-colors hover:border-line hover:bg-surface-2"
            >
              <Avatar name={name} url={t.peer_avatar_url} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-bold">{name}</span>
                  <span className="shrink-0 text-xs text-faint">
                    {listTimestamp(t.last_message_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${win.open ? "text-muted" : "text-faint"}`}>
                    {win.open ? win.label : win.label}
                  </span>
                  {t.unread_count > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-amber px-1.5 text-xs font-bold text-bubble-ink">
                      {t.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- Instagram CDN URLs expire; next/image caching hurts here
    return <img src={url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />;
  }
  const letter = name.replace("@", "").charAt(0).toUpperCase() || "?";
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-xl font-semibold italic text-bubble-ink"
      style={{ background: "linear-gradient(135deg, #e8963e, #d9552f)" }}
    >
      {letter}
    </div>
  );
}
