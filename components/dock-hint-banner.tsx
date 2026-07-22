"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

const DISMISS_KEY = "im_dock_hint_dismissed";

/**
 * One-time hint for Mac users running the installed PWA: closing it removes
 * the Dock icon (not code-fixable from the web), but pinning keeps it one
 * click away. Only shows in standalone display-mode on macOS.
 */
export function DockHintBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const isMac = /mac/i.test(navigator.userAgent) && !/iphone|ipad|ipod/i.test(navigator.userAgent);
    if (standalone && isMac) {
      setShow(true);
      track("dock_hint_shown");
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface px-5 py-4 text-left">
      <p className="text-[14px] font-semibold text-ink">Keep Instamessages in your Dock</p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Right-click the Instamessages icon in the Dock →{" "}
        <span className="font-semibold text-ink">Options</span> →{" "}
        <span className="font-semibold text-ink">Keep in Dock</span>. It stays one click away even
        after you close the app.
      </p>
      <button
        onClick={dismiss}
        className="mt-2.5 rounded-btn bg-amber px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
      >
        Got it
      </button>
    </div>
  );
}
