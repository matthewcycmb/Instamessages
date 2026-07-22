"use client";

import { useEffect, useState } from "react";
import { enablePush } from "@/lib/push-client";

type State = "hidden" | "install" | "enable" | "denied";

/**
 * Persistent until push actually works (design decision Q4): Safari on iOS
 * gets install steps (web push only exists inside the installed app),
 * everywhere else gets a one-tap Enable. Disappears once granted.
 */
export function PushBanner() {
  const [state, setState] = useState<State>("hidden");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      setState(ios && !standalone ? "install" : "hidden");
      return;
    }
    if (Notification.permission === "granted") {
      enablePush(); // already granted: silently make sure the server has this device
      setState("hidden");
    } else if (Notification.permission === "denied") {
      setState("denied");
    } else {
      setState("enable");
    }
  }, []);

  async function turnOn() {
    const result = await enablePush();
    setState(result === "enabled" ? "hidden" : result === "denied" ? "denied" : "enable");
  }

  if (state === "hidden") return null;

  return (
    <div className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-amber/10 px-3.5 py-2.5">
      <svg
        className="h-4 w-4 shrink-0 text-amber"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {state === "enable" && (
        <>
          <p className="flex-1 text-[13px] leading-snug text-muted">
            Know the moment friends message you.
          </p>
          <button
            onClick={turnOn}
            className="shrink-0 rounded-btn bg-amber px-3.5 py-1.5 text-[13px] text-white"
          >
            Turn on
          </button>
        </>
      )}
      {state === "install" && (
        <p className="flex-1 text-[13px] leading-snug text-muted">
          For notifications: tap <span className="font-semibold text-ink">Share</span>, then{" "}
          <span className="font-semibold text-ink">Add to Home Screen</span>, then open the app
          and turn them on.
        </p>
      )}
      {state === "denied" && (
        <p className="flex-1 text-[13px] leading-snug text-muted">
          Notifications are blocked for this app in your device settings.
        </p>
      )}
    </div>
  );
}
