"use client";

import { useState } from "react";
import { APP_STORE_URL } from "@/lib/links";

/**
 * The one button on the invite page. Inside the tap: copy the link (the
 * clipboard is how the app learns who sent it, with no fingerprinting),
 * count the tap on the server, then the App Store.
 */
export default function GetKonvo({ handle, link }: { handle: string; link: string }) {
  const [copied, setCopied] = useState(false);
  const go = () => {
    navigator.clipboard?.writeText(link).catch(() => {});
    if (handle) {
      fetch("/api/invite/tap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }), keepalive: true,
      }).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => { window.location.href = APP_STORE_URL; }, 600);
  };
  return (
    <button
      onClick={go}
      style={{
        display: "block", width: "100%", padding: 17, border: 0, borderRadius: 14,
        background: "#0a84ff", color: "#fff", font: '600 17px/1 -apple-system, system-ui, sans-serif',
      }}
    >
      {copied ? "Link copied. Opening the App Store" : "Get Konvo"}
    </button>
  );
}
