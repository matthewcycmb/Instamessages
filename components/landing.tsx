"use client";

import { useState } from "react";
import { DownloadModal } from "./download-modal";
import { track } from "@/lib/analytics";
import { APP_STORE_URL } from "@/lib/links";

/**
 * Landing page (design 10a). The mock was drawn on a 1200px canvas with bare
 * 148px side padding; rendered full-bleed on a 1440+ display it shouted. Every
 * band is capped to SHELL and centred, and the hero type is scaled to match.
 */
const SHELL = 1200;

const NAVLINK: React.CSSProperties = { color: "inherit", textDecoration: "none", cursor: "pointer" };


export function Landing({
  inAppBrowser = false,
  desktop = false,
}: {
  inAppBrowser?: boolean;
  desktop?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Phones get Apple's badge straight to the store; desktop keeps the
  // platform-picker modal.
  const cta = desktop
    ? (big?: boolean) => <DownloadButton onClick={openModal} label="Download Konvo" big={big} glow={big} />
    : () => <AppStoreBadge />;

  function openModal() {
    track("beta_cta_clicked");
    setOpen(true);
  }

  return (
    <div className="lp-page" style={{ width: "100%" }}>
      {/* hero band (10b): fixed-height split — copy left, app shot right. */}
      <div
        className="lp-hero-band"
        style={{ width: "100%" }}
      >
        <div
          className="lp-scrim"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 200,
            background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 62%, #fff 100%)",
            pointerEvents: "none",
          }}
        />

        {/* nav */}
        <div style={{ width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px", maxWidth: SHELL, margin: "0 auto", position: "relative" }}>
          <Wordmark />
          <div className="lp-nav" style={{ fontSize: 16, fontWeight: 500, color: "#2c3444" }}>
            <a href="#how" style={NAVLINK}>How it works</a>
            <a href="#blocked" style={NAVLINK}>What&apos;s blocked</a>
            <a href="#faq" style={NAVLINK}>FAQ</a>
          </div>
          <div className="lp-betabadge" style={{ display: "flex", alignItems: "center", gap: 9, borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#30a14e" }} />
            Now on the App Store
          </div>
        </div>

        {/* hero row */}
        <div className="lp-hero-row" style={{ flex: 1, maxWidth: SHELL, margin: "0 auto", width: "100%", boxSizing: "border-box", position: "relative" }}>
          <div className="lp-hero-copy">
            <h1 className="lp-h1" style={{ fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05, margin: 0 }}>
              Use Instagram
              <br />
              for messaging
            </h1>
            {/* The paragraph is desktop-only. On a phone the headline already
                says it, and a second wall of text pushed the button and the
                screenshots below the fold. */}
            <p className="lp-sub" style={{ fontSize: 20, lineHeight: 1.45, color: "#33405c", margin: "32px 0 40px" }}>
              Konvo blocks everything on Instagram except your messages.
              <br />
              No feed, no stories, no reels, no explore.
            </p>
            <p className="lp-lede">
              Konvo blocks your Instagram feed, explore and reels pages but
              keeps your messages.
            </p>
            {cta(true)}
          </div>
          <div className="lp-hero-art" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div className="lp-mocks">
              <img src="/mock-inbox.png" alt="Konvo inbox on iPhone" loading="eager" />
            </div>
            <img
              className="lp-macshot"
              src="/app.png"
              alt="Konvo app"
              style={{ width: "100%", maxWidth: 560, borderRadius: 14, boxShadow: "0 30px 80px rgba(20,50,110,0.3)" }}
            />
          </div>
        </div>
      </div>

      {/* setup steps */}
      <Section id="how" eyebrow="GETTING STARTED" title="How to set up">
        <div className="lp-row" style={{ alignItems: "stretch" }}>
          <StepCard n={1} title="Get the app" body="Konvo is on the App Store. Download it on your iPhone and open it.">
            <Chip>
              <span style={{ width: 17, height: 17, borderRadius: 5, background: "#0a5cf0", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <ChatGlyph size={10} stroke="#fff" width="2.8" />
              </span>
              Konvo for iPhone
            </Chip>
          </StepCard>
          <StepCard n={2} title="Sign in with Instagram" body="You sign in on Instagram's own page. Konvo opens your messages and nothing else.">
            <Chip>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f1b33" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#0f1b33" stroke="none" />
              </svg>
              Continue with Instagram
            </Chip>
          </StepCard>
          <StepCard n={3} title="Delete Instagram" body="Konvo replaces it. Your account, your messages and your followers stay exactly where they are.">
            <Chip>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f1b33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M6 6l1 14h10l1-14" />
              </svg>
              Off the phone
            </Chip>
          </StepCard>
        </div>
      </Section>

      {/* what changes */}
      <Section
        id="blocked"
        eyebrow="WHAT CHANGES"
        title="Everything goes except your messages."
      >
        <div className="lp-row lp-compare">
          <ListCard dot="#d64541" heading="Blocked" items={["Feed", "Stories", "Reels", "Explore", "Suggested posts"]} kind="x" />
          <ListCard
            dot="#30a14e"
            heading="Still works"
            items={["Direct messages", "Message requests", "Replies to your stories", "Photos and links people send you"]}
            kind="check"
          />
        </div>
      </Section>

      {/* after setup - desktop only: both panels are laptop screenshots, and
          on a phone they stacked into two more walls of image. */}
      <Section className="lp-aftersetup" eyebrow="AFTER SETUP" title="Two things change." titleMargin="12px 0 40px">
        <div className="lp-row">
          <div style={CARD}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em", color: "#0f1b33" }}>You open Konvo to talk</div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: "#5a6478", margin: "8px 0 22px" }}>
              Same people, same conversations. Nothing else to look at.
            </div>
            <img src="/app.png" alt="Konvo messages" style={{ width: "100%", display: "block", borderRadius: 12, border: "1px solid rgba(20,40,80,0.15)" }} />
          </div>
          <div style={CARD}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em", color: "#0f1b33" }}>Instagram does not open</div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: "#5a6478", margin: "8px 0 22px" }}>
              You&apos;ll type the address out of habit. This is what shows up.
            </div>
            <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", height: 300, border: "1px solid rgba(20,40,80,0.15)", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 12px", background: "#16191f" }}>
                <Dot /><Dot /><Dot />
                <span style={{ marginLeft: 10, flex: 1, background: "#22262d", borderRadius: 6, padding: "4px 9px", fontSize: 10, color: "#6b7280" }}>
                  instagram.com
                </span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", position: "relative" }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(180deg, #3d8bff, #0a5cf0)", display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 34px rgba(38,120,255,0.5)" }}>
                  <ChatGlyph size={22} stroke="#fff" width="2.4" />
                </span>
                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.2, color: "#fff", textAlign: "center", margin: "16px 0 0" }}>
                  Instagram is blocked.
                  <br />
                  But your DMs aren&apos;t.
                </div>
                <div style={{ fontSize: 12, color: "#8b93a1", marginTop: 8 }}>Check your messages in Konvo.</div>
                <div style={{ marginTop: 16, background: "#3d8bff", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 999, padding: "8px 20px" }}>
                  Open Konvo
                </div>
                <div style={{ fontSize: 10, color: "#5c6472", marginTop: 12 }}>Don&apos;t have the app? Get it here</div>
                <div style={{ position: "absolute", bottom: 10, fontSize: 9, color: "#3a3f47" }}>Blocked by Konvo</div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* faq */}
      <div id="faq" className="lp-below" style={{ width: "100%", boxSizing: "border-box", padding: "84px 24px 0", maxWidth: SHELL, margin: "0 auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#98a1b0" }}>QUESTIONS</div>
        <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.035em", color: "#0f1b33", margin: "12px 0 24px" }}>
          Frequently asked questions
        </h2>
        <div style={{ borderTop: "1px solid #e9ecf2" }}>
          {FAQ.map((q) => (
            <Faq key={q.q} q={q.q} a={q.a} />
          ))}
        </div>
      </div>

      {/* closing cta */}
      <div className="lp-cta-row lp-below" style={{ width: "100%", boxSizing: "border-box", padding: "104px 24px", maxWidth: SHELL, margin: "0 auto" }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.035em", color: "#0f1b33" }}>Message your friends.</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.035em", color: "#0a5cf0" }}>Skip the rest of Instagram.</div>
        </div>
        {cta()}
      </div>

      {open && <DownloadModal onClose={() => setOpen(false)} inAppBrowser={inAppBrowser} desktop={desktop} />}

      {/* footer */}
      <div className="lp-foot lp-below" style={{ width: "100%", boxSizing: "border-box", borderTop: "1px solid #e9ecf2", padding: "48px 24px 24px", maxWidth: SHELL, margin: "0 auto" }}>
        <Wordmark small />
        <div className="lp-foot-cols">
          <FooterCol
            title="Product"
            items={[
              { label: "How it works", href: "#how" },
              { label: "What's blocked", href: "#blocked" },
              { label: "FAQ", href: "#faq" },
            ]}
          />
          <FooterCol
            title="Support"
            items={[
              { label: "Contact", href: "mailto:jchanh@gmail.com" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ]}
          />
        </div>
      </div>
      <div className="lp-fineprint" style={{ width: "100%", boxSizing: "border-box", padding: "0 24px 40px", maxWidth: SHELL, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <span>© 2026 Konvo</span>
        <span className="lp-fineprint-links">
          <a href="/privacy" style={NAVLINK}>Privacy</a>
          {" · "}
          <a href="/terms" style={NAVLINK}>Terms</a>
        </span>
        <span className="lp-fineprint-affil">Not affiliated with Instagram.</span>
      </div>

    </div>
  );
}

const CARD: React.CSSProperties = {
  flex: 1,
  background: "#fff",
  border: "1px solid #e6e9ef",
  borderRadius: 20,
  boxShadow: "0 2px 10px rgba(20,50,110,0.04)",
  padding: 28,
};

const FAQ = [
  {
    q: "How much does it cost?",
    a: "Konvo is a paid app with a free trial. You see the plans inside the app after signing in, and you can cancel any time from your Apple subscriptions.",
  },
  {
    q: "Is it safe to log in?",
    a: "You sign in on Instagram's own page, the same one Safari shows, so your password goes to Instagram and not to us. There is no Konvo account and no Konvo password: the session lives on your phone, and we never store your messages. It shows up in Instagram's settings under Where you're logged in, and you can log it out from there any time.",
  },
  {
    q: "Do I lose my account?",
    a: "No. Konvo signs into the account you already have and shows the same messages. Nothing gets moved or deleted.",
  },
  {
    q: "Can I turn it off?",
    a: "Yes, in a few seconds. Delete Konvo and install Instagram again, and you are back where you started.",
  },
  {
    q: "Will people know I'm using it?",
    a: "No. Your messages send and read from your account, same as always.",
  },
  {
    q: "Does Konvo work on Android?",
    a: "Not yet. iPhone today, Android next. Leave your email and you'll hear when it's ready.",
  },

];

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #e9ecf2" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", cursor: "pointer" }}>
        <span style={{ fontSize: 18, fontWeight: 500, color: "#0f1b33" }}>{q}</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#5a6478"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {open && <p style={{ fontSize: 16, lineHeight: 1.6, color: "#5a6478", margin: "0 0 20px", maxWidth: "70ch" }}>{a}</p>}
    </div>
  );
}

function Section({
  id,
  className,
  eyebrow,
  title,
  sub,
  subWidth,
  titleMargin,
  children,
}: {
  id?: string;
  className?: string;
  eyebrow: string;
  title: string;
  sub?: string;
  subWidth?: string;
  titleMargin?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className={`lp-section${className ? " " + className : ""}`} style={{ width: "100%", boxSizing: "border-box", maxWidth: SHELL, margin: "0 auto" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#98a1b0" }}>{eyebrow}</div>
      <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.035em", color: "#0f1b33", margin: titleMargin ?? "12px 0 10px", textAlign: "center" }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 17, lineHeight: 1.55, color: "#5a6478", margin: "0 0 40px", textAlign: "center", maxWidth: subWidth }}>{sub}</p>
      )}
      {children}
    </div>
  );
}

function StepCard({ n, title, body, children }: { n: number; title: string; body: string; children: React.ReactNode }) {
  return (
    <div style={{ ...CARD, padding: "30px 28px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#0a5cf0", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
          {n}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#98a1b0" }}>STEP {n}</span>
      </div>
      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.03em", color: "#0f1b33", margin: "20px 0 8px" }}>{title}</div>
      <div style={{ fontSize: 16, lineHeight: 1.55, color: "#5a6478" }}>{body}</div>
      <div style={{ marginTop: 22 }}>{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#f4f7fc", border: "1px solid #e9ecf2", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#0f1b33" }}>
      {children}
    </div>
  );
}

function ListCard({ dot, heading, items, kind }: { dot: string; heading: string; items: string[]; kind: "x" | "check" }) {
  return (
    <div className="lp-listcard" style={{ ...CARD, padding: "26px 28px" }}>
      <div className="lp-listhead" style={{ display: "flex", alignItems: "center", gap: 9, paddingBottom: 8 }}>
        <span style={{ width: 8, height: 8, flex: "none", borderRadius: "50%", background: dot }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: "#0f1b33" }}>{heading}</span>
      </div>
      {items.map((label) => (
        <div key={label} className="lp-listrow" style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 0" }}>
          <span className="lp-listmark" style={{ width: 19, height: 19, flex: "none", borderRadius: "50%", background: kind === "x" ? "#fdeceb" : "#e7f6ec", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            {kind === "x" ? (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#d64541" strokeWidth="3.4" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1f8a44" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="lp-listlabel" style={{ fontSize: 16, color: "#0f1b33" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
      onClick={() => track("app_store_opened")}
      aria-label="Download on the App Store"
      style={{ display: "inline-block", lineHeight: 0 }}
    >
      <svg width="200" height="67" viewBox="0 0 120 40" role="img" aria-hidden="true">
        <rect x="0.5" y="0.5" width="119" height="39" rx="6.5" fill="#000" stroke="#a6a6a6" />
        <g transform="translate(9 9) scale(0.9)">
          <path fill="#fff" d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </g>
        <text x="35" y="15.5" fill="#fff" fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" fontSize="7.5">Download on the</text>
        <text x="34.5" y="31" fill="#fff" fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif" fontSize="17" fontWeight="500" letterSpacing="-0.3">App Store</text>
      </svg>
    </a>
  );
}

function DownloadButton({ onClick, label, big, glow }: { onClick: () => void; label: string; big?: boolean; glow?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        minHeight: big ? 62 : 58,
        padding: big ? "0 36px" : "0 32px",
        border: 0,
        borderRadius: 14,
        background: "linear-gradient(180deg, #3d8bff 0%, #0a5cf0 100%)",
        color: "#fff",
        fontFamily: "inherit",
        fontSize: big ? 20 : 18,
        fontWeight: 600,
        letterSpacing: big ? "-0.01em" : undefined,
        cursor: "pointer",
        boxShadow: glow
          ? "0 0 50px rgba(38,120,255,0.45), 0 12px 30px rgba(20,60,150,0.35), inset 0 1px 0 rgba(255,255,255,0.4)"
          : "0 8px 20px rgba(20,60,150,0.22), inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {label}
      <svg width={big ? 19 : 18} height={big ? 19 : 18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </button>
  );
}

function Wordmark({ small }: { small?: boolean }) {
  const box = small ? 22 : 26;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: box, height: box, borderRadius: small ? 6 : 7, background: "#0a5cf0", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <ChatGlyph size={small ? 12 : 14} stroke="#fff" width="2.6" />
      </span>
      <span
        className={small ? undefined : "lp-wordmark-text"}
        style={{ fontSize: small ? 17 : 22, fontWeight: 700, letterSpacing: small ? "-0.03em" : "-0.035em", color: small ? "#0f1b33" : undefined }}
      >
        Konvo
      </span>
    </div>
  );
}

function ChatGlyph({ size, stroke, width }: { size: number; stroke: string; width: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function Dot() {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3a3f47" }} />;
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f1b33", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "#5a6478" }}>
        {items.map((i) => (
          <a key={i.label} href={i.href} style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
            {i.label}
          </a>
        ))}
      </div>
    </div>
  );
}
