"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Opening (or returning to) the app means the unread badge is seen.
    const clearBadge = () => {
      const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
      nav.clearAppBadge?.().catch(() => {});
    };
    clearBadge();
    const onVisible = () => {
      if (document.visibilityState === "visible") clearBadge();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}
