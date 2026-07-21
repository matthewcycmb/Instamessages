"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const router = useRouter();

  async function run() {
    setState("running");
    try {
      const res = await fetch("/api/import", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setState("done");
      router.refresh();
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const label =
    state === "running" ? "Importing…" : state === "done" ? "Imported ✓" : state === "error" ? "Failed — retry" : "Import";

  return (
    <button
      onClick={run}
      disabled={state === "running"}
      className="rounded-full border border-amber/60 px-3.5 py-1.5 text-sm font-bold text-amber transition-colors hover:bg-amber/10 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
