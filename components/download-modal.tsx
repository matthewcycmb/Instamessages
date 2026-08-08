"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { track } from "@/lib/analytics";
import { TESTFLIGHT_URL } from "@/lib/links";

const CARD: React.CSSProperties = {
  position: "relative",
  width: 460,
  maxWidth: "calc(100vw - 32px)",
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

/**
 * Two steps, opened by every "Download beta" button: email, then the
 * TestFlight link. The email is the only thing the site asks for and the
 * link is the only thing it owes back, so nothing sits between them.
 */
export function DownloadModal({
  onClose,
  inAppBrowser,
}: {
  onClose: () => void;
  inAppBrowser?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    // One trust-boundary check; client side is enough for a mailing list.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setErr("That email doesn't look right.");
      return;
    }
    setErr("");
    // No backend, by design. PostHog is the list: it already runs on the
    // site, it exports, and it keeps the address attached to the person.
    try {
      posthog.setPersonProperties?.({ email: value });
    } catch {}
    track("beta_email_submitted", { in_app_browser: !!inAppBrowser });
    setSent(true);
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

      <div style={CARD}>
        <Close onClose={onClose} />
        {inAppBrowser && <SafariNote />}

        {!sent ? (
          <>
            <div style={EYEBROW}>STEP 1 OF 2</div>
            <h2 style={H2}>Get the beta</h2>
            <p style={{ ...SUB, margin: "0 0 26px" }}>
              Konvo is on iPhone right now. Leave your email and the TestFlight
              link is on the next screen.
            </p>
            <form onSubmit={submitEmail}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: `1px solid ${err ? "#d64541" : "#e6e9ef"}`,
                  borderRadius: 12,
                  padding: "15px 16px",
                  marginBottom: err ? 8 : 16,
                  fontSize: 16,
                  fontFamily: "inherit",
                  color: "#0f1b33",
                  outline: "none",
                }}
              />
              {err && (
                <p style={{ fontSize: 13, color: "#d64541", margin: "0 0 12px" }}>{err}</p>
              )}
              <button type="submit" style={PRIMARY}>
                Continue
              </button>
            </form>
            <p style={{ fontSize: 12, color: "#98a1b0", margin: "16px 0 0" }}>
              One email when the full app launches. Nothing else, ever.
            </p>
          </>
        ) : (
          <>
            <div style={EYEBROW}>STEP 2 OF 2</div>
            <h2 style={H2}>You&apos;re in.</h2>
            <p style={{ ...SUB, margin: "0 0 22px" }}>
              TestFlight is Apple&apos;s own app for trying apps before release.
              If you don&apos;t have it yet, the link installs it first.
            </p>
            <a
              href={TESTFLIGHT_URL}
              target="_blank"
              rel="noopener"
              onClick={() => track("beta_testflight_opened")}
              style={{ ...PRIMARY, display: "block", textAlign: "center", lineHeight: "54px", textDecoration: "none" }}
            >
              Open in TestFlight
            </a>
            <p style={{ fontSize: 12, color: "#98a1b0", margin: "16px 0 0" }}>
              Tap Accept, then Install. Konvo lands on your home screen.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The biggest invisible drop-off: a link tapped inside Instagram opens in
 * Instagram's own browser, where TestFlight redemption usually fails. Say it
 * in their words, above the form.
 */
function SafariNote() {
  return (
    <div
      style={{
        background: "#fff4e5",
        border: "1px solid #f0d9b5",
        borderRadius: 12,
        color: "#6b4b16",
        padding: "11px 14px",
        fontSize: 14,
        lineHeight: 1.45,
        margin: "0 0 18px",
      }}
    >
      <strong style={{ fontWeight: 600 }}>Open this in Safari first.</strong> Tap
      the <strong style={{ fontWeight: 600 }}>•••</strong> at the top right, then{" "}
      <strong style={{ fontWeight: 600 }}>Open in browser</strong>. Installing
      from inside Instagram usually fails.
    </div>
  );
}

const PRIMARY: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
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
