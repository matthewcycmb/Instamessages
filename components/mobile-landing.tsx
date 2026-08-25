"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { APP_STORE_URL } from "@/lib/links";

/**
 * Mobile landing, styled after smashspeed.ca: sky photo background, sticky
 * translucent nav with a download pill and a hamburger menu, big left-aligned
 * hero, star rating row, Apple badge. It only renders for phone/tablet UAs
 * (plus ?mobile=1 for QA), so it owns its whole look inline with no media
 * queries.
 */

const INK = "#171d2e";
const SLATE = "#364156";

const PILL: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 38,
  padding: "0 18px",
  borderRadius: 999,
  background: "linear-gradient(180deg, #3d8bff 0%, #0a5cf0 100%)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  textDecoration: "none",
  boxShadow: "0 6px 16px rgba(20,60,150,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
};

export function MobileLanding() {
  const [menu, setMenu] = useState(false);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#b4d0ea url(/sky-bg.jpg) center top / cover no-repeat",
        color: INK,
      }}
    >
      {/* iOS rubber-band and the area behind Safari's bars show html/body,
          not the page; globals paints html white, which read as a white bleed
          above the hero. This style element renders after globals.css, so
          source order wins over both. */}
      <style>{`html,body{background:#b4d0ea}`}</style>

      {/* nav: transparent, the sky runs to the very top */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "14px 12px 0 18px",
          }}
        >
          <Wordmark />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a href={APP_STORE_URL} onClick={() => track("app_store_opened")} style={PILL}>
              Download
            </a>
            <button
              aria-label="Menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
              style={{ background: "none", border: 0, padding: 10, display: "flex", cursor: "pointer" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {menu && (
          <div
            onClick={() => setMenu(false)}
            style={{
              position: "absolute",
              top: "100%",
              left: 12,
              right: 12,
              marginTop: 8,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(23,29,46,0.08)",
              boxShadow: "0 18px 40px rgba(23,29,46,0.18)",
              overflow: "hidden",
            }}
          >
            <MenuLink href="/privacy" label="Privacy Policy" />
            <MenuLink href="/terms" label="Terms of Service" />
            <MenuLink href="mailto:jchanh@gmail.com" label="Contact Us" last />
          </div>
        )}
      </div>

      {/* hero: the extra top padding drops the title to where smashspeed's
          sits on a phone screen, per Matthew's side-by-side. */}
      <div style={{ padding: "104px 26px 0", textAlign: "center" }}>
        {/* nowrap + vw sizing keeps the title on one line on any phone. */}
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 9.6vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.06, whiteSpace: "nowrap" }}>
          <span style={{ color: "#0a5cf0" }}>Konvo:</span>
          {" "}DM&rsquo;s Only
        </h1>
        <p style={{ margin: "14px 0 0", fontSize: 17, lineHeight: 1.45, color: "#252b38" }}>
          Message on Instagram without
          <br />
          the feed, explore and reels.
        </p>

        <div
          aria-label="5 star rating"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 10, fontSize: 15 }}
        >
          <span style={{ display: "inline-flex", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <svg key={i} width="17" height="17" viewBox="0 0 24 24" fill="#f7b31d" aria-hidden="true">
                <path d="M12 2l2.9 6.26 6.6.72-4.9 4.55 1.34 6.47L12 16.77 6.06 20l1.34-6.47L2.5 8.98l6.6-.72z" />
              </svg>
            ))}
          </span>
          <span style={{ color: INK, fontWeight: 600 }}>Loved by 100+ users</span>
        </div>

        <a
          href={APP_STORE_URL}
          onClick={() => track("app_store_opened")}
          aria-label="Download on the App Store"
          style={{ display: "inline-block", marginTop: 10, lineHeight: 0 }}
        >
          <img src="/app-store-badge.webp" alt="Download on the App Store" style={{ height: 56, width: "auto", display: "block" }} />
        </a>

        <a
          href="https://www.instagram.com/matthewasherelol/"
          onClick={() => track("dm_link_clicked")}
          style={{ display: "block", marginTop: 14, fontSize: 15, lineHeight: 1.5, color: SLATE, textDecoration: "none" }}
        >
          Have questions? DM <span style={{ color: "#0a5cf0", fontWeight: 600 }}>@matthewasherelol</span>
          <br />
          I read and respond to all of my messages
        </a>
      </div>

      {/* app shot */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 42 }}>
        <img
          src="/mock-inbox.png"
          alt="Konvo inbox on iPhone"
          style={{ width: "min(78%, 320px)", height: "auto", filter: "drop-shadow(0 26px 50px rgba(23,29,46,0.35))" }}
        />
      </div>

      {/* fine print */}
      <div style={{ marginTop: "auto", padding: "46px 26px 34px", fontSize: 12.5, color: "#4c5870", textAlign: "center" }}>
        © 2026 Konvo{" · "}
        <a href="/privacy" style={{ color: "inherit" }}>
          Privacy
        </a>
        {" · "}
        <a href="/terms" style={{ color: "inherit" }}>
          Terms
        </a>
        <div style={{ marginTop: 6, color: "#5f6b84" }}>Not affiliated with Instagram.</div>
      </div>
    </div>
  );
}

function MenuLink({ href, label, last }: { href: string; label: string; last?: boolean }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "15px 18px",
        fontSize: 16,
        fontWeight: 500,
        color: INK,
        textDecoration: "none",
        borderBottom: last ? undefined : "1px solid #eef1f6",
      }}
    >
      {label}
    </a>
  );
}

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: "#0a5cf0",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </span>
      <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.03em" }}>Konvo</span>
    </div>
  );
}
