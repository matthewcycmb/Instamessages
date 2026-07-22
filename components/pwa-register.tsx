"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Remember installs permanently, wherever they happen (button or
    // omnibox), so the landing can show "already installed".
    const onInstalled = () => {
      try {
        localStorage.setItem("im_app_installed", "1");
      } catch {}
    };
    window.addEventListener("appinstalled", onInstalled);

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
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
