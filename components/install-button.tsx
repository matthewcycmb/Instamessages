"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "prompt" | "ios" | "desktop";

/**
 * Prominent "Add to Home Screen" button for shared links. Android/desktop
 * Chrome get a one-tap native prompt; iOS Safari can't be prompted (Apple
 * rule), so it opens a Share → Add to Home Screen instruction sheet.
 * Hides itself once the app is already installed.
 */
export function InstallButton() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setMode("hidden");
      return;
    }
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    setMode(isIos ? "ios" : "desktop");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      track("app_installed");
      setMode("hidden");
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function onClick() {
    track("install_clicked", { mode });
    if (mode === "prompt" && deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      track("install_prompt_result", { outcome: choice.outcome });
      if (choice.outcome === "accepted") setMode("hidden");
      setDeferred(null);
    } else if (mode === "ios") {
      setShowIos(true);
    } else {
      setShowIos(true); // desktop: show menu instructions
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn border border-line py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-surface"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12" />
          <path d="m8 11 4 4 4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
        Add to Home Screen
      </button>

      {showIos && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setShowIos(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-bg px-6 py-7 text-center shadow-2xl"
          >
            <h2 className="text-xl">Add to your Home Screen</h2>
            <p className="mt-1.5 text-[13px] text-muted">
              Install it like a real app in 3 taps.
            </p>
            <ol className="mt-5 space-y-2.5 text-left">
              {(mode === "ios"
                ? [
                    "Tap the Share button in Safari",
                    "Scroll and tap “Add to Home Screen”",
                    "Tap Add. The icon appears on your home screen.",
                  ]
                : [
                    "Open your browser’s menu (⋮ or the address bar icon)",
                    "Choose “Install app” or “Add to Home Screen”",
                    "Confirm. It opens full-screen like a native app.",
                  ]
              ).map((item, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber text-[12px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[14px]">{item}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setShowIos(false)}
              className="mt-6 w-full rounded-btn bg-amber py-3 text-[15px] font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
