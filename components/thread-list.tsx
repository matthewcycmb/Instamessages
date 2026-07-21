"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { listTimestamp } from "@/lib/format";
import { primeThread } from "@/lib/thread-cache";
import { GradientAvatar } from "./gradient-avatar";

type Thread = {
  id: string;
  peer_igsid: string;
  peer_username: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
  last_message_at: string | null;
  last_inbound_at: string | null;
  unread_count: number;
  preview: string;
};

/**
 * Conversation list per design 3a. Used full-page on mobile and as the
 * desktop sidebar (pass `activeId` to highlight the open thread).
 */
export function ThreadList() {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/t/") ? pathname.split("/")[2] : undefined;
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.conversations ?? []);
    } catch {
      /* offline; keep whatever we have */
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
      <div className="px-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-surface" />
              <div className="h-3 w-56 animate-pulse rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className="mx-4 rounded-2xl bg-surface px-6 py-12 text-center">
        <p className="text-xl font-bold">No messages yet</p>
        <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
          Your DMs are syncing. New messages show up on their own.
        </p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const visible = q
    ? threads.filter((t) =>
        `${t.peer_name ?? ""} ${t.peer_username ?? ""} ${t.preview}`.toLowerCase().includes(q)
      )
    : threads;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 rounded-[10px] bg-surface-2 px-3 py-2">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-faint"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-[14px] placeholder:text-faint focus:outline-none"
          />
        </div>
      </div>

      {visible.length === 0 && (
        <p className="py-10 text-center text-[15px] text-muted">
          No results for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {visible.map((t) => {
          const name =
            t.peer_name || (t.peer_username ? `@${t.peer_username}` : "Instagram user");
          const active = t.id === activeId;
          return (
            <li key={t.id}>
              <Link
                href={`/t/${t.id}`}
                onMouseEnter={() => primeThread(t.id)}
                onTouchStart={() => primeThread(t.id)}
                className={`flex items-center gap-3 px-4 py-[11px] transition-colors ${
                  active ? "bg-amber" : "hover:bg-surface-2/50 active:bg-surface"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    t.unread_count > 0 && !active ? "bg-amber" : ""
                  }`}
                />
                <GradientAvatar name={name} url={t.peer_avatar_url} size={48} />
                <div className="min-w-0 flex-1 border-b border-line pb-[11px] pt-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`flex min-w-0 items-baseline gap-1.5 ${
                        active ? "text-white" : ""
                      }`}
                    >
                      <span className="truncate text-[16px] font-semibold">{name}</span>
                      {t.peer_name && t.peer_username && (
                        <span
                          className={`shrink-0 text-[12px] ${
                            active ? "text-white/70" : "text-faint"
                          }`}
                        >
                          @{t.peer_username}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-[13px] ${active ? "text-white/70" : "text-faint"}`}
                    >
                      {listTimestamp(t.last_message_at)}
                    </span>
                  </div>
                  <p
                    className={`mt-0.5 truncate text-[14px] ${
                      active ? "text-white/75" : "text-muted"
                    }`}
                  >
                    {t.preview || "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
