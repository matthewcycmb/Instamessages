"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Thread = { id: string; peer_username: string | null };

/**
 * Compose flow. The API cannot start conversations (Meta rule), so:
 * existing thread → jump to it; anyone else → hand off to instagram.com's
 * DM composer via ig.me. The echo webhook pulls the new chat in here the
 * moment the first message is sent.
 */
export function NewMessage() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [handedOff, setHandedOff] = useState(false);
  const router = useRouter();

  async function go() {
    const u = username.trim().replace(/^@/, "").toLowerCase();
    if (!u || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const match = (data.conversations as Thread[] | undefined)?.find(
          (c) => (c.peer_username ?? "").toLowerCase() === u
        );
        if (match) {
          close();
          router.push(`/t/${match.id}`);
          return;
        }
      }
    } catch {
      /* fall through to handoff */
    }
    window.open(`https://ig.me/m/${encodeURIComponent(u)}`, "_blank", "noopener");
    setHandedOff(true);
    setChecking(false);
  }

  function close() {
    setOpen(false);
    setUsername("");
    setChecking(false);
    setHandedOff(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="New message"
        title="New message"
        className="grid h-[34px] w-[34px] place-items-center rounded-full bg-surface transition-opacity hover:opacity-80"
      >
        <svg
          className="h-4 w-4 text-amber"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-bg px-6 py-7 shadow-2xl">
            <h2 className="text-center text-xl">New message</h2>

            {!handedOff ? (
              <>
                <div className="mt-5 flex items-center gap-1.5 rounded-[12px] bg-surface px-3.5 py-2.5">
                  <span className="text-[15px] text-faint">@</span>
                  <input
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && go()}
                    placeholder="username"
                    className="w-full bg-transparent text-[16px] placeholder:text-faint focus:outline-none"
                  />
                </div>
                <p className="mt-3 text-center text-[12px] leading-relaxed text-faint">
                  Existing chats open here. For someone new, Instagram only lets the first message
                  come from instagram.com, so we&rsquo;ll open their DM box there. The chat shows
                  up here as soon as you hit send.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={close}
                    className="rounded-btn border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={go}
                    disabled={!username.trim() || checking}
                    className="rounded-btn bg-amber px-6 py-2.5 text-sm text-white disabled:opacity-40"
                  >
                    {checking ? "Checking…" : "Open chat"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-center text-[14px] leading-relaxed text-muted">
                  Opened <span className="font-semibold text-ink">@{username.trim().replace(/^@/, "")}</span>&rsquo;s
                  DM box on instagram.com in a new tab. Send your first message there. The moment
                  it sends, the conversation appears here and their reply unlocks normal chatting.
                </p>
                <div className="mt-5 flex justify-center">
                  <button onClick={close} className="rounded-btn bg-amber px-6 py-2.5 text-sm text-white">
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
