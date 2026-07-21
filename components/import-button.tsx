"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "running" | "done" | "error";
type Result = { threads: number; messages: number };

/** Sync button (design 3a header icon) with progress modal. */
export function ImportButton() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setPhase("running");
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/import", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setResult({ threads: data.threads ?? 0, messages: data.messages ?? 0 });
      setPhase("done");
      window.dispatchEvent(new Event("im:refresh-threads"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
      setPhase("error");
    }
  }

  return (
    <>
      <button
        onClick={run}
        disabled={phase === "running"}
        aria-label="Sync chats from Instagram"
        title="Sync chats"
        className="grid h-[34px] w-[34px] place-items-center rounded-full bg-surface transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        {phase === "running" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-amber" />
        ) : (
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
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        )}
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-bg px-6 py-8 text-center shadow-2xl">
            {phase === "running" && (
              <>
                <div
                  className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-amber"
                  aria-hidden
                />
                <h2 className="mt-5 text-xl">Syncing from Instagram</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Pulling your conversations and the last 20 messages of each. Big inboxes take a
                  minute or two. You can close this; syncing continues in the background.
                </p>
                <button
                  onClick={() => setPhase("idle")}
                  className="mt-6 rounded-btn border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                >
                  Continue in background
                </button>
              </>
            )}

            {phase === "done" && result && (
              <>
                <div
                  className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-green text-xl text-white"
                  aria-hidden
                >
                  ✓
                </div>
                <h2 className="mt-5 text-xl">
                  {result.threads > 0 ? "Sync complete" : "Nothing new"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {result.threads > 0 ? (
                    <>
                      <span className="font-bold text-ink">{result.threads}</span> conversation
                      {result.threads === 1 ? "" : "s"} ·{" "}
                      <span className="font-bold text-ink">{result.messages}</span> message
                      {result.messages === 1 ? "" : "s"}. New DMs sync automatically.
                    </>
                  ) : (
                    <>Everything is already up to date. New DMs appear on their own.</>
                  )}
                </p>
                <button
                  onClick={() => setPhase("idle")}
                  className="mt-6 rounded-btn bg-amber px-6 py-2.5 text-sm text-white"
                >
                  Done
                </button>
              </>
            )}

            {phase === "error" && (
              <>
                <div
                  className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ember/15 text-xl font-bold text-ember"
                  aria-hidden
                >
                  !
                </div>
                <h2 className="mt-5 text-xl">Sync failed</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-muted">{error}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setPhase("idle")}
                    className="rounded-btn border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                  >
                    Close
                  </button>
                  <button onClick={run} className="rounded-btn bg-amber px-6 py-2.5 text-sm text-white">
                    Retry
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
