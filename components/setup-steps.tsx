"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { identify, track } from "@/lib/analytics";

type Phase = "checking" | "error" | "success";

/**
 * Post-connect flow per design 2a/2b: Checking → (Not a Creator) → You're in.
 * On success the first sync fires automatically; no manual import step.
 */
export function SetupSteps({ username }: { username: string }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const importStarted = useRef(false);
  const router = useRouter();

  const check = useCallback(async () => {
    setPhase("checking");
    try {
      const res = await fetch("/api/account/status");
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.isProfessional === false) {
        setPhase("error");
        return;
      }
      // Kick off the first sync in the background; the inbox fills as it runs.
      if (!importStarted.current) {
        importStarted.current = true;
        identify(username);
        track("instagram_connected", { username });
        fetch("/api/import", { method: "POST" }).catch(() => {});
      }
      setPhase("success");
    } catch {
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      {phase === "checking" && (
        <div className="rise flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-line border-t-amber" />
          <h1 className="mt-6 text-[24px] sm:text-[28px]">Checking your account</h1>
          <p className="mt-1.5 text-[14px] text-faint">Creator account</p>
        </div>
      )}

      {phase === "error" && (
        <div className="rise flex w-full flex-col items-center">
          <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-ember/15 text-2xl font-bold text-ember">
            !
          </div>
          <h1 className="mt-5 text-[26px] sm:text-[32px]">Not a Creator yet.</h1>
          <p className="mt-2 text-[14px] text-muted sm:text-[15px]">
            Instagram says your account is still personal.
          </p>
          <button
            onClick={() => window.open("https://www.instagram.com/accounts/convert_to_professional_account/", "_blank")}
            className="mt-7 min-h-[50px] w-full rounded-btn bg-amber text-[16px] text-white transition-opacity hover:opacity-90"
          >
            Show me the switch steps
          </button>
          <button
            onClick={check}
            className="mt-2 min-h-[44px] w-full text-[15px] font-medium text-amber"
          >
            Check again
          </button>
        </div>
      )}

      {phase === "success" && (
        <div className="rise flex w-full flex-col items-center">
          <div className="grid h-[60px] w-[60px] place-items-center rounded-full bg-green">
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-6 text-[32px] sm:text-[40px]">You&rsquo;re in.</h1>
          <p className="mt-2 text-[15px] text-muted sm:text-[16px]">
            Your DMs are syncing now, @{username}.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 min-h-[52px] w-full rounded-btn bg-amber text-[17px] text-white transition-opacity hover:opacity-90"
          >
            Open your inbox
          </button>
          <p className="mt-4 text-[12px] leading-relaxed text-faint">
            On iPhone: Safari → Share → Add to Home Screen, then turn on notifications in
            Settings.
          </p>
        </div>
      )}
    </main>
  );
}
