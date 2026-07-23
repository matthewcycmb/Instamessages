"use client";

import { useState } from "react";

const LINK = "https://instamessages.vercel.app";

/** Desktop-only for now: mobile visitors get a copy-the-link handoff (design 6a). */
export function MobileComingSoon() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(LINK);
    } catch {
      /* clipboard can fail in odd webviews; the visual state still guides */
    }
    setCopied(true);
  }

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "#000",
        color: "#f5f5f7",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(180deg, #0a84ff, #0060df)",
          boxShadow: "0 8px 28px rgba(10,132,255,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>
      <h2
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          margin: "28px 0 10px",
          textAlign: "center",
        }}
      >
        Instachat mobile
        <br />
        is <span style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>coming soon</span>.
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#98989d",
          lineHeight: 1.5,
          margin: "0 0 36px",
          textAlign: "center",
        }}
      >
        So copy the link and open it on your laptop.
      </p>
      <button
        onClick={copy}
        className="cursor-pointer"
        style={{
          width: "100%",
          maxWidth: 400,
          minHeight: 52,
          border: 0,
          borderRadius: 14,
          background: copied ? "#1c1c1e" : "#0a84ff",
          color: copied ? "#30d158" : "#fff",
          fontSize: 17,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
        }}
      >
        {copied ? (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Link copied
          </>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy link
          </>
        )}
      </button>
      <p style={{ fontSize: 13, color: "#636366", margin: "14px 0 0" }}>
        instamessages.vercel.app
      </p>
    </main>
  );
}
