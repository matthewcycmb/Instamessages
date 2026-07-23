"use client";

import { track } from "@/lib/analytics";

/** Step-2 pill: downloads the native Mac wrapper (the actual product). */
export function DownloadMacButton({
  outline,
  onEngage,
}: {
  outline?: boolean;
  onEngage?: () => void;
}) {
  return (
    <a
      href="/Instachat.dmg"
      download
      onClick={() => {
        track("mac_download_clicked");
        onEngage?.();
      }}
      className="cursor-pointer transition-opacity hover:opacity-85"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 40,
        padding: "0 18px",
        border: outline ? "1px solid #3a3a3c" : 0,
        borderRadius: 999,
        background: outline ? "none" : "#0a84ff",
        color: outline ? "#0a84ff" : "#fff",
        fontSize: 14,
        fontWeight: 600,
        flex: "none",
      }}
    >
      Download
    </a>
  );
}
