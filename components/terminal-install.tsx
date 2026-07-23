"use client";

import { useState } from "react";

// curl (unlike a browser) doesn't quarantine the download, so the app opens
// with no Gatekeeper "damaged" wall. Points at the same zip the button serves.
const CMD =
  "curl -fsSL https://instamessages.vercel.app/Instachat-mac.zip -o /tmp/instachat.zip && rm -rf /Applications/Instachat.app && ditto -xk /tmp/instachat.zip /Applications && xattr -cr /Applications/Instachat.app && open /Applications/Instachat.app";

/**
 * Secondary install path: one Terminal line that downloads and opens the app
 * cleanly, skipping the unsigned-app "damaged" dialog. Removed once the app
 * is notarized (then the plain download opens on a double-click).
 */
export function TerminalInstall() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CMD);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer transition-colors hover:text-white"
        style={{ background: "none", border: 0, color: "#636366", fontSize: 13, padding: 0 }}
      >
        Prefer Terminal? Install with one line {open ? "▾" : "▸"}
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            background: "#1c1c1e",
            border: "1px solid #2c2c2e",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <p style={{ fontSize: 13, color: "#98989d", lineHeight: 1.5, margin: "0 0 8px" }}>
            Opens Terminal-clean &mdash; no security warning. Paste into{" "}
            <span style={{ color: "#f5f5f7" }}>Terminal</span> (Spotlight →
            &ldquo;Terminal&rdquo;) and press Return:
          </p>
          <button
            onClick={copy}
            className="cursor-pointer transition-opacity hover:opacity-85"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
              width: "100%",
              background: "#000",
              border: "1px solid #2c2c2e",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "left",
            }}
          >
            <code
              style={{
                fontSize: 12,
                color: "#0a84ff",
                fontFamily: "ui-monospace, monospace",
                lineHeight: 1.5,
                wordBreak: "break-all",
              }}
            >
              {CMD}
            </code>
            <span style={{ fontSize: 12, color: copied ? "#30d158" : "#636366", flex: "none" }}>
              {copied ? "Copied" : "Copy"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
