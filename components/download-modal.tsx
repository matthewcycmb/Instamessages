"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { CHROME_STORE_URL, MAC_APP_STORE_URL } from "@/lib/links";

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
 * The desktop install flow, opened by the Download Konvo buttons: the
 * extension first (it is what actually blocks instagram.com in the browser),
 * then the Mac App Store. The email step is gone (Aug 25): the store link
 * is public now, so there is nothing to wait for.
 *
 * The extension step's primary button starts as Add to Chrome. Once the
 * visitor taps it, or leaves the tab and comes back (installing happens in
 * the Web Store, so any return trip means they at least saw it), the same
 * blue button reads "I've added it, continue" and advances. localStorage
 * remembers across visits.
 */
export function DownloadModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"extension" | "platform">("extension");
  const [extAdded, setExtAdded] = useState(false);

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

  useEffect(() => {
    try {
      if (localStorage.getItem("konvoExtAdded")) setExtAdded(true);
    } catch {}
    const onVisibility = () => {
      try {
        if (document.visibilityState === "hidden") {
          localStorage.setItem("konvoExtAdded", "1");
        } else if (localStorage.getItem("konvoExtAdded")) {
          setExtAdded(true);
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function addToChrome() {
    track("extension_opened");
    try {
      localStorage.setItem("konvoExtAdded", "1");
    } catch {}
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

        {step === "extension" ? (
          <>
            <div style={EYEBROW}>STEP 1 OF 2</div>
            <h2 style={H2}>Add the chrome extension</h2>
            <p style={{ ...SUB, margin: "0 0 18px" }}>
              The app can&apos;t block instagram.com in your browser. The
              extension can.
            </p>
            <ListingCard />
            {extAdded ? (
              <button onClick={() => setStep("platform")} style={PRIMARY}>
                I&apos;ve added it, continue
              </button>
            ) : (
              <a
                href={CHROME_STORE_URL ?? "#"}
                target="_blank"
                rel="noopener"
                onClick={addToChrome}
                style={{ ...PRIMARY, display: "block", textAlign: "center", lineHeight: "54px", textDecoration: "none" }}
              >
                Add to Chrome
              </a>
            )}
          </>
        ) : (
          <>
            <div style={EYEBROW}>STEP 2 OF 2</div>
            <h2 style={H2}>Download for Mac</h2>
            <p style={{ ...SUB, margin: "0 0 22px" }}>
              Konvo: DMs Only is on the Mac App Store.
            </p>
            <a
              href={MAC_APP_STORE_URL}
              target="_blank"
              rel="noopener"
              onClick={() => track("mac_store_opened")}
              style={{ ...PRIMARY, display: "block", textAlign: "center", lineHeight: "54px", textDecoration: "none" }}
            >
              Download on the Mac App Store
            </a>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * What the Web Store listing looks like, so the visitor recognises the page
 * the button opens. Drawn in place (the icon is the real one) rather than a
 * screenshot that blurs on retina.
 */
function ListingCard() {
  const chip: React.CSSProperties = {
    background: "#f1f3f7",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 13,
    fontWeight: 500,
    color: "#0f1b33",
    whiteSpace: "nowrap",
  };
  return (
    <div
      style={{
        border: "1px solid #e6e9ef",
        borderRadius: 16,
        padding: "18px 20px",
        margin: "0 0 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img
          src="/icon-192.png"
          alt=""
          width={48}
          height={48}
          style={{ borderRadius: 11, display: "block" }}
        />
        <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f1b33" }}>
          Konvo: DMs Only
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <span style={chip}>Extension</span>
        <span style={chip}>Workflow &amp; Planning</span>
        <span style={{ ...chip, background: "none", padding: "7px 2px", color: "#5a6478" }}>3 users</span>
      </div>
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
