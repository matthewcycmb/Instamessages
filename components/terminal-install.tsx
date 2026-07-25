"use client";

import { useState } from "react";

// See public/install.sh. curl (unlike a browser) doesn't quarantine the
// download, and the script strips quarantine off any older copy, so the app
// opens with no Gatekeeper "damaged" wall. The script also refuses to install
// on Intel Macs, which the arm64 build can't run. Retired once the app is
// notarized.
const CMD = "curl -fsSL https://instamessages.vercel.app/install.sh | bash";

/** Always-visible command box: the primary install path while unsigned. */
export function TerminalCommand() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CMD);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={copy}
        className="cursor-pointer transition-opacity hover:opacity-85"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "#000",
          border: "1px solid #2c2c2e",
          borderRadius: 8,
          padding: "9px 12px",
          textAlign: "left",
        }}
      >
        <code
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: "#0a84ff",
            fontFamily: "ui-monospace, monospace",
            whiteSpace: "nowrap",
            overflowX: "auto",
          }}
        >
          {CMD}
        </code>
        <span style={{ fontSize: 12, fontWeight: 600, color: copied ? "#30d158" : "#0a84ff", flex: "none" }}>
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </div>
  );
}
