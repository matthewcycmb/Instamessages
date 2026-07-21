"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "running" | "done" | "error";
type Result = { threads: number; messages: number };

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
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({ threads: data.threads ?? 0, messages: data.messages ?? 0 });
      setPhase("done");
      window.dispatchEvent(new Event("im:refresh-threads"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setPhase("error");
    }
  }

  return (
    <>
      <button
        onClick={run}
        disabled={phase === "running"}
        className="rounded-full border border-amber/60 px-3.5 py-1.5 text-sm font-bold text-amber transition-colors hover:bg-amber/10 disabled:opacity-60"
      >
        Import
      </button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-6 backdrop-blur-sm">
          <div className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-surface px-6 py-8 text-center shadow-2xl">
            {phase === "running" && (
              <>
                <div
                  className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-amber"
                  aria-hidden
                />
                <h2 className="mt-5 font-display text-xl font-semibold italic">
                  Importing from Instagram
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Pulling your conversations and the last 20 messages of each — Instagram&rsquo;s
                  API caps history there. This can take a minute for a busy inbox.
                </p>
              </>
            )}

            {phase === "done" && result && (
              <>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-amber/15 text-xl text-amber" aria-hidden>
                  ✓
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold italic">
                  {result.threads > 0 ? "Import complete" : "Nothing to import"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {result.threads > 0 ? (
                    <>
                      <span className="font-bold text-ink">{result.threads}</span> conversation
                      {result.threads === 1 ? "" : "s"} ·{" "}
                      <span className="font-bold text-ink">{result.messages}</span> message
                      {result.messages === 1 ? "" : "s"}. New DMs sync automatically from here on.
                    </>
                  ) : (
                    <>
                      Instagram returned no importable conversations. New DMs will still appear
                      here the moment someone messages you.
                    </>
                  )}
                </p>
                <button
                  onClick={() => setPhase("idle")}
                  className="mt-6 rounded-full px-6 py-2.5 text-sm font-bold text-bubble-ink"
                  style={{ background: "linear-gradient(135deg, #e8963e, #d9552f)" }}
                >
                  Done
                </button>
              </>
            )}

            {phase === "error" && (
              <>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ember/15 text-xl text-ember" aria-hidden>
                  !
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold italic">Import failed</h2>
                <p className="mt-2 break-words text-sm leading-relaxed text-muted">{error}</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setPhase("idle")}
                    className="rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:text-ink"
                  >
                    Close
                  </button>
                  <button
                    onClick={run}
                    className="rounded-full px-6 py-2.5 text-sm font-bold text-bubble-ink"
                    style={{ background: "linear-gradient(135deg, #e8963e, #d9552f)" }}
                  >
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
