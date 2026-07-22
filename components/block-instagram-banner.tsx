"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { CHROME_STORE_URL } from "@/lib/extension";

const DISMISS_KEY = "im_block_banner_dismissed";

type Browser = "chromium" | "safari" | "other";

/**
 * Desktop inbox card: "Block Instagram in this browser". Chromium browsers
 * get the mini-cage extension (feed/reels/profiles redirect here, DMs still
 * work); Safari gets Screen Time steps. Websites can't install blockers
 * silently, so the pre-checked look is an invitation, not an action.
 */
export function BlockInstagramBanner() {
  const [browser, setBrowser] = useState<Browser | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const ua = navigator.userAgent;
    const isChromium = /chrome|chromium|crios|edg|arc/i.test(ua);
    const isSafari = !isChromium && /safari/i.test(ua);
    setBrowser(isChromium ? "chromium" : isSafari ? "safari" : "other");
    track("block_banner_shown");
  }, []);

  if (!browser || browser === "other") return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setBrowser(null);
  }

  function turnOn() {
    track("block_banner_clicked", { browser });
    if (browser === "chromium" && CHROME_STORE_URL) {
      window.open(CHROME_STORE_URL, "_blank", "noopener");
      return;
    }
    setShowSteps(true);
  }

  const steps =
    browser === "chromium"
      ? [
          <>
            <a href="/extension.zip" className="font-semibold text-amber underline underline-offset-2" download>
              Download the extension
            </a>{" "}
            and unzip it
          </>,
          <>
            Open <span className="font-semibold text-ink">chrome://extensions</span> and switch on{" "}
            <span className="font-semibold text-ink">Developer mode</span> (top right)
          </>,
          <>
            Click <span className="font-semibold text-ink">Load unpacked</span> and pick the unzipped folder
          </>,
          <>Visit instagram.com — the feed now lands here instead</>,
        ]
      : [
          <>
            Open <span className="font-semibold text-ink">System Settings → Screen Time → App &amp; Website Activity</span>
          </>,
          <>
            Choose <span className="font-semibold text-ink">Downtime</span> or{" "}
            <span className="font-semibold text-ink">Always Blocked → Add Website</span>
          </>,
          <>
            Add <span className="font-semibold text-ink">instagram.com</span>
          </>,
          <>Safari will now stop Instagram everywhere except this app</>,
        ];

  return (
    <>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface px-5 py-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-amber text-[12px] font-bold text-white"
          >
            ✓
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[14px] font-semibold text-ink">
              Block Instagram in {browser === "chromium" ? "this browser" : "Safari"}
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
              Feed, reels, and profiles redirect here. Your DMs and login keep working.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={turnOn}
                className="rounded-btn bg-amber px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Turn on
              </button>
              <button
                onClick={dismiss}
                className="rounded-btn px-3 py-1.5 text-[13px] text-faint transition-colors hover:text-ink"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSteps && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setShowSteps(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bubble-in w-full max-w-sm rounded-3xl border border-line bg-bg px-6 py-7 shadow-2xl"
          >
            <h2 className="text-center text-xl">
              {browser === "chromium" ? "Install the blocker" : "Block Instagram in Safari"}
            </h2>
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
              onClick={() => {
                setShowSteps(false);
                dismiss();
              }}
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
