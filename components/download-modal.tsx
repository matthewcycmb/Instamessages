"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { track } from "@/lib/analytics";
import { CHROME_STORE_URL, MAC_DMG, TESTFLIGHT_URL, WINDOWS_EXE } from "@/lib/links";

const CARD: React.CSSProperties = {
  position: "relative",
  width: 460,
  maxWidth: "calc(100vw - 32px)",
  background: "#fff",
  borderRadius: 22,
  padding: "38px 38px 34px",
  maxHeight: "calc(100dvh - 32px)",
  overflowY: "auto",
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
 * The install flow, opened by the download buttons. Two shapes, because the
 * two platforms owe the visitor different things.
 *
 * Phone: email, then the TestFlight link. That is the whole product today.
 *
 * Desktop: email, then the extension, then the platform picker. The desktop
 * app cannot be handed over yet (signed but not notarized), so the platform
 * rows render disabled rather than serving a download Gatekeeper will refuse.
 */
export function DownloadModal({
  onClose,
  inAppBrowser,
  desktop,
}: {
  onClose: () => void;
  inAppBrowser?: boolean;
  desktop?: boolean;
}) {
  const [step, setStep] = useState<"email" | "extension" | "platform">("email");
  // The page behind the modal used to scroll under the finger, so the card
  // drifted around while you typed. Freeze the body for as long as it is up,
  // and put the scrollbar's width back so the layout does not jump.
  useEffect(() => {
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prev = { overflow: body.style.overflow, pad: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prev.overflow;
      body.style.paddingRight = prev.pad;
    };
  }, []);
  const sent = step !== "email";
  const setSent = (v: boolean) => setStep(v ? (desktop ? "extension" : "platform") : "email");
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
    track("beta_email_submitted", { in_app_browser: !!inAppBrowser, desktop: !!desktop });
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
            <div style={EYEBROW}>STEP 1 OF {desktop ? 3 : 2}</div>
            <h2 style={H2}>{desktop ? "Download Konvo" : "Get the beta"}</h2>
            <p style={{ ...SUB, margin: "0 0 26px" }}>
              {desktop
                ? "Enter your email to get started with Konvo."
                : "Konvo is on iPhone right now. Leave your email and the TestFlight link is on the next screen."}
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
        ) : step === "extension" ? (
          <>
            <div style={EYEBROW}>STEP 2 OF 3</div>
            <h2 style={H2}>Add the extension</h2>
            <p style={{ ...SUB, margin: "0 0 22px" }}>
              The app can&apos;t block instagram.com in your browser. The
              extension can.
            </p>
            <a
              href={CHROME_STORE_URL ?? "#"}
              target="_blank"
              rel="noopener"
              onClick={() => track("extension_opened")}
              style={{ ...PRIMARY, display: "block", textAlign: "center", lineHeight: "54px", textDecoration: "none" }}
            >
              Add to Chrome
            </a>
            <button
              onClick={() => setStep("platform")}
              style={{
                width: "100%", background: "none", border: 0, marginTop: 14,
                padding: 6, fontFamily: "inherit", fontSize: 15, fontWeight: 500,
                color: "#5a6478", cursor: "pointer",
              }}
            >
              I&apos;ve added it, continue
            </button>
          </>
        ) : desktop ? (
          <>
            <div style={EYEBROW}>STEP 3 OF 3</div>
            <h2 style={H2}>Select your platform</h2>
            <p style={{ ...SUB, margin: "0 0 6px" }}>
              Choose your operating system to download Konvo.
            </p>
            <PlatformRow os="MACOS" name="Universal" href={MAC_DMG} icon={<AppleMark />} />
            <PlatformRow os="WINDOWS" name="x64" href={WINDOWS_EXE} icon={<WindowsMark />} />
            <p style={{ fontSize: 12, color: "#98a1b0", margin: "18px 0 0" }}>
              The desktop app is still going through Apple&apos;s notarization.
              You&apos;re on the list, and the email above is how you&apos;ll hear
              the moment it opens.
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

/**
 * One operating system per row. `href` of null means the build exists but
 * cannot be handed over yet, so the row states why instead of pretending to
 * be a link - a download that Gatekeeper blocks is worse than no download.
 */
function PlatformRow({
  os,
  name,
  href,
  icon,
}: {
  os: string;
  name: string;
  href: string | null;
  icon: React.ReactNode;
}) {
  const inner = (
    <>
      <span style={{ width: 26, display: "flex", justifyContent: "center", flex: "none" }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#98a1b0" }}>
          {os}
        </span>
        <span style={{ display: "block", fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", color: "#0f1b33", marginTop: 2 }}>
          {name}
        </span>
      </span>
      {href ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0f1b33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      ) : (
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "#98a1b0" }}>SOON</span>
      )}
    </>
  );
  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "15px 4px",
    borderTop: "1px solid #e6e9ef",
    textDecoration: "none",
  };
  return href ? (
    <a href={href} style={{ ...row, cursor: "pointer" }}>{inner}</a>
  ) : (
    <div aria-disabled="true" style={{ ...row, opacity: 0.45, cursor: "default" }}>{inner}</div>
  );
}

function AppleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#0f1b33" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function WindowsMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0f1b33" aria-hidden>
      <path d="M3 5.6 10.2 4.6v6.9H3V5.6Zm8.4-1.2L21 3v8.5h-9.6V4.4ZM3 12.7h7.2v6.9L3 18.5v-5.8Zm8.4 0H21V21l-9.6-1.3v-7Z" />
    </svg>
  );
}

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
