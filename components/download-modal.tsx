"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { CHROME_STORE_URL, INSTALL_CMD } from "@/lib/links";

const CARD: React.CSSProperties = {
  position: "relative",
  width: 460,
  background: "#fff",
  borderRadius: 22,
  padding: "38px 38px 34px",
  boxShadow: "0 30px 80px rgba(10,30,80,0.35)",
};
const EYEBROW: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.1em",
  color: "#98a1b0",
};
const H2: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: "-0.035em",
  lineHeight: 1.1,
  margin: "12px 0 10px",
  color: "#0f1b33",
};
const SUB: React.CSSProperties = { fontSize: 15, lineHeight: 1.5, color: "#5a6478" };
const ROW: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "15px 4px",
  borderBottom: "1px solid #e6e9ef",
  cursor: "pointer",
};
const ROW_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "#98a1b0",
};
const ROW_TITLE: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#0f1b33",
  marginTop: 2,
};

/** Three-step install flow, opened by every "Download Konvo" button. */
export function DownloadModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"email" | "extension" | "platform">("email");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    // No backend, by design. PostHog is already on the site, so the address
    // lands somewhere real instead of nowhere.
    if (email) track("download_email_entered", { $set: { email } });
    setStep("extension");
  }

  function addExtension() {
    track("extension_button_clicked");
    if (CHROME_STORE_URL) window.open(CHROME_STORE_URL, "_blank", "noopener");
    setStep("platform");
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(INSTALL_CMD);
    } catch {}
    track("install_command_copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,26,58,0.42)" }} />

      {step === "email" && (
        <div style={CARD}>
          <Close onClose={onClose} />
          <div style={EYEBROW}>STEP 1 OF 3</div>
          <h2 style={H2}>Download Konvo</h2>
          <p style={{ ...SUB, margin: "0 0 26px" }}>
            Enter your email to get started with Konvo.
          </p>
          <form onSubmit={submitEmail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: "1px solid #e6e9ef",
                borderRadius: 12,
                padding: "15px 16px",
                marginBottom: 16,
                fontSize: 16,
                fontFamily: "inherit",
                color: "#0f1b33",
                outline: "none",
              }}
            />
            <button type="submit" style={PRIMARY}>
              Continue
            </button>
          </form>
        </div>
      )}

      {step === "extension" && (
        <div style={CARD}>
          <Close onClose={onClose} />
          <div style={EYEBROW}>STEP 2 OF 3</div>
          <h2 style={H2}>Add the extension.</h2>
          <p style={{ ...SUB, margin: "0 0 22px" }}>
            The app can&apos;t block instagram.com in your browser. The
            extension can.
          </p>
          <div
            onClick={addExtension}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "1px solid #e6e9ef",
              borderRadius: 14,
              padding: 16,
              cursor: "pointer",
            }}
          >
            <ChromeLogo size={30} />
            <div style={{ flex: 1 }}>
              <div style={ROW_LABEL}>CHROME</div>
              <div style={ROW_TITLE}>Add Konvo to Chrome</div>
            </div>
            <Arrow />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, fontSize: 13, color: "#5a6478" }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid #e6e9ef",
                borderTopColor: "#0a5cf0",
                animation: "spin 0.9s linear infinite",
                display: "inline-block",
              }}
            />
            <span>The Chrome store opens in a new tab. Come back here after.</span>
          </div>
        </div>
      )}

      {step === "platform" && (
        <div style={CARD}>
          <Close onClose={onClose} />
          <div style={EYEBROW}>STEP 3 OF 3</div>
          <h2 style={H2}>Select your platform</h2>
          <p style={{ ...SUB, margin: "0 0 12px" }}>Choose your device to download Konvo.</p>
          <div style={{ borderTop: "1px solid #e6e9ef" }} />
          <div style={ROW} onClick={copyCommand}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0f1b33" style={{ flex: "none" }}>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={ROW_LABEL}>MACOS</div>
              <div style={ROW_TITLE}>{copied ? "Copied — paste it into Terminal" : "Copy the install command"}</div>
            </div>
            <Arrow />
          </div>
          <div style={{ ...ROW, cursor: "default", opacity: 0.45 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0f1b33" style={{ flex: "none" }}>
              <path d="M3 5.6 10.2 4.6v6.9H3V5.6Zm8.4-1.2L21 3v8.5h-9.6V4.4ZM3 12.7h7.2v6.9L3 18.5v-5.8Zm8.4 0H21V21l-9.6-1.3v-7Z" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={ROW_LABEL}>WINDOWS</div>
              <div style={ROW_TITLE}>Coming soon</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#98a1b0", margin: "18px 0 0" }}>
            The Mac build isn&apos;t notarized yet, so it installs from Terminal
            instead of a double click. We&apos;ll fix that before launch.
          </p>
        </div>
      )}
    </div>
  );
}

const PRIMARY: React.CSSProperties = {
  width: "100%",
  minHeight: 54,
  border: 0,
  borderRadius: 14,
  background: "linear-gradient(180deg, #3d8bff 0%, #0a5cf0 100%)",
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(20,60,150,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
};

function Close({ onClose }: { onClose: () => void }) {
  return (
    <span
      onClick={onClose}
      style={{
        position: "absolute",
        top: 20,
        right: 20,
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "#f1f3f7",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5a6478" strokeWidth="2" strokeLinecap="round">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </span>
  );
}

function Arrow() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0f1b33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ChromeLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flex: "none" }}>
      <circle cx="24" cy="24" r="20" fill="#fff" />
      <path d="M24 4a20 20 0 0 1 17.32 10H24a10 10 0 0 0-9.4 6.6L7.4 9.4A19.96 19.96 0 0 1 24 4Z" fill="#ea4335" />
      <path d="M41.32 14A20 20 0 0 1 26 43.9L33.4 29a10 10 0 0 0-.72-11.1Z" fill="#fbbc05" />
      <path d="M14.6 20.6a10 10 0 0 0 9.06 13.38h.06L26 43.9A20 20 0 0 1 7.4 9.4Z" fill="#34a853" />
      <circle cx="24" cy="24" r="8" fill="#fff" />
      <circle cx="24" cy="24" r="6.4" fill="#4285f4" />
    </svg>
  );
}
