"use client";

import { useEffect, useState } from "react";
import { CHROME_STORE_URL } from "@/lib/extension";
import { track } from "@/lib/analytics";

/**
 * Landing CTA: install the Instagram-blocking extension. Chromium desktop
 * only (Safari gets the Screen Time card in the inbox instead). Opens the
 * Web Store once a listing exists; until then, walks through load-unpacked.
 */
export function ExtensionButton({
  step,
  pill,
  onEngage,
}: {
  step?: number;
  /** Render as a compact solid pill with this label instead of the full-width bar. */
  pill?: string;
  /** Called when the user starts the install flow (used to advance step UI). */
  onEngage?: () => void;
}) {
  // Pill usage is gated by the parent (only rendered on desktop Chromium),
  // so it can show from the first paint — no pop-in on reload.
  const [show, setShow] = useState(!!pill);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isChromium = /chrome|chromium|crios|edg|arc/i.test(ua);
    const isMobile = /iphone|ipad|ipod|android/i.test(ua);
    setShow(isChromium && !isMobile);
  }, []);

  if (!show) return null;

  function onClick() {
    track("extension_button_clicked");
    onEngage?.();
    if (CHROME_STORE_URL) {
      window.open(CHROME_STORE_URL, "_blank", "noopener");
      return;
    }
    setShowSteps(true);
  }

  const steps = [
    <>
      <a
        href="/extension.zip"
        className="font-semibold text-amber underline underline-offset-2"
        download
      >
        Download the extension
      </a>{" "}
      and unzip it
    </>,
    <>
      Open <span className="font-semibold text-ink">chrome://extensions</span> and switch on{" "}
      <span className="font-semibold text-ink">Developer mode</span> (top right)
    </>,
    <>
      Click <span className="font-semibold text-ink">Load unpacked</span> and pick the unzipped
      folder
    </>,
    <>Visit instagram.com — you land here instead</>,
  ];

  return (
    <>
      {pill ? (
        <button
          onClick={onClick}
          className="cursor-pointer transition-opacity hover:opacity-85"
          style={{
            minHeight: 40,
            padding: "0 18px",
            border: 0,
            borderRadius: 999,
            background: "#0a84ff",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            flex: "none",
          }}
        >
          {pill}
        </button>
      ) : (
      <button
        onClick={onClick}
        className="relative flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-btn bg-amber text-[17px] font-semibold text-white transition-opacity hover:opacity-85"
      >
        {step !== undefined && (
          <span className="absolute left-4 grid h-6 w-6 place-items-center rounded-full bg-white text-[13px] font-bold text-amber">
            {step}
          </span>
        )}
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
          <circle cx="12" cy="12" r="10" />
          <path d="m4.9 4.9 4.2 4.2" />
          <path d="M12 8a4 4 0 1 0 4 4" />
        </svg>
        Add the Chrome extension
      </button>
      )}

      {showSteps && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setShowSteps(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-bg px-6 py-7 shadow-2xl"
          >
            <h2 className="text-center text-xl">Install the blocker</h2>
            <p className="mt-1.5 text-center text-[13px] text-muted">
              Blocks Instagram in this browser. Your DMs live here instead.
            </p>
            <ol className="mt-5 space-y-2.5">
              {steps.map((item, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber text-[12px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-muted">{item}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setShowSteps(false)}
              className="mt-6 w-full rounded-btn bg-amber py-3 text-[15px] font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
