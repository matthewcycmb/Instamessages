"use client";

import { useEffect, useRef, useState } from "react";
import { ExtensionButton } from "./extension-button";
import { DownloadMacButton } from "./download-mac-button";
import { TerminalCommand } from "./terminal-install";
import { MobileComingSoon } from "./mobile-coming-soon";
import { MacOnly } from "./mac-only";

const EXT_ENGAGED_KEY = "im_ext_engaged";
const MAC_DOWNLOADED_KEY = "im_mac_downloaded";

// The signed-download flow is parked until Apple Developer enrollment; the
// Terminal command is the install path meanwhile. Flip back to true (and the
// download card returns) once the app is notarized.
const SHOW_DOWNLOAD = false;

type Env = "unknown" | "mobile" | "notmac" | "desktop-chromium" | "desktop-other";

/**
 * Landing screen (design 5a): dark, pitch + numbered install step cards on
 * the left, product mock on the right. The product is the native Mac
 * wrapper (caged instagram.com, normal login, no creator account); the
 * Chrome extension blocks Instagram in the browser.
 */
export function OnboardingSteps({
  error,
  initialEnv,
}: {
  error?: string;
  initialStep?: number;
  initialEnv?: Env;
}) {
  const [env, setEnv] = useState<Env>(initialEnv ?? "unknown");
  // Step 2 lights up once the user has gone off to install the extension
  // and come back; it turns green once they grab the Mac download.
  const [step2Active, setStep2Active] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const engaged = useRef(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    const mac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);
    const chromium = /chrome|chromium|crios|edg|arc/i.test(ua);
    setEnv(
      mobile
        ? "mobile"
        : !mac
          ? "notmac"
          : chromium
            ? "desktop-chromium"
            : "desktop-other"
    );

    if (localStorage.getItem(EXT_ENGAGED_KEY)) {
      engaged.current = true;
      setStep2Active(true);
    }
    if (localStorage.getItem(MAC_DOWNLOADED_KEY)) setDownloaded(true);
    const onReturn = () => {
      if (document.visibilityState === "visible" && engaged.current) {
        setStep2Active(true);
      }
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, []);

  function onExtensionEngage() {
    engaged.current = true;
    try {
      localStorage.setItem(EXT_ENGAGED_KEY, "1");
    } catch {
      /* private mode */
    }
  }

  function onDownloadEngage() {
    setDownloaded(true);
    try {
      localStorage.setItem(MAC_DOWNLOADED_KEY, "1");
    } catch {}
  }

  // Desktop-only for now: every mobile visit gets the handoff screen.
  if (env === "mobile") {
    return <MobileComingSoon />;
  }
  // The app is a macOS build; non-Mac desktops get a Mac-only notice.
  if (env === "notmac") {
    return <MacOnly />;
  }

  return (
    <main
      className="flex w-full flex-1 flex-col items-center justify-center lg:flex-row lg:items-center lg:gap-8"
      style={{ background: "#000", color: "#f5f5f7", minHeight: "100dvh", overflow: "hidden", position: "relative" }}
    >
      {error && (
        <div
          className="absolute left-1/2 top-6 z-10 w-[min(92vw,480px)] -translate-x-1/2 rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ background: "rgba(255,69,58,0.15)", color: "#ff453a" }}
        >
          {error}
        </div>
      )}

      {/* left: pitch + steps */}
      <div className="w-full max-w-[440px] flex-none px-6 py-12 lg:px-0 lg:py-0">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(180deg, #0a84ff, #0060df)",
              boxShadow: "0 8px 28px rgba(10,132,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChatIcon size={23} />
          </div>
          <span style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Instachat
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(30px, 5vw, 38px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.08,
            margin: "22px 0 8px",
          }}
        >
          Keep your DMs.
          <br />
          Block the rest.
        </h1>
        <p style={{ fontSize: 16, color: "#98989d", lineHeight: 1.5, margin: "0 0 24px" }}>
          {env === "desktop-chromium" ? "Two steps, then you're set." : "One step, then you're set."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {env === "desktop-chromium" && (
            <StepCard
              n={1}
              active={!step2Active}
              done={step2Active}
              icon={<ChromeLogo />}
              title="Add the Chrome extension"
              sub="Blocks Instagram in your browser."
              action={
                step2Active ? (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#30d158", flex: "none" }}>
                    Added
                  </span>
                ) : (
                  <ExtensionButton pill="Add" onEngage={onExtensionEngage} />
                )
              }
            />
          )}

          {/* Step 2: install the Mac app via Terminal (signed download parked) */}
          <div
            style={{
              background: "#1c1c1e",
              border: `1px solid ${env !== "desktop-chromium" || step2Active ? "#0a84ff" : "#2c2c2e"}`,
              borderRadius: 16,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <span
                style={{
                  width: 28,
                  height: 28,
                  flex: "none",
                  borderRadius: "50%",
                  background: env !== "desktop-chromium" || step2Active ? "#0a84ff" : "#2c2c2e",
                  color: env !== "desktop-chromium" || step2Active ? "#fff" : "#98989d",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {env === "desktop-chromium" ? 2 : 1}
              </span>
              <AppTile />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Install Instachat in your terminal</div>
                <div style={{ fontSize: 13, color: "#98989d", lineHeight: 1.5, marginTop: 3 }}>
                  Copy and paste this line in your terminal
                  <br />
                  (Cmd + space → type terminal):
                </div>
              </div>
            </div>
            <TerminalCommand />
          </div>

          <p style={{ fontSize: 13, color: "#636366", lineHeight: 1.5 }}>
            {env === "desktop-other"
              ? "The extension needs Chrome or Edge; the Mac app works everywhere."
              : "Your normal Instagram login works. No creator account, no setup."}
          </p>

          {SHOW_DOWNLOAD && (
            <StepCard
              n={99}
              active={!downloaded}
              done={downloaded}
              icon={<AppTile />}
              title="Download the Mac app"
              sub="Your DMs, without the feed."
              action={
                downloaded ? (
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#30d158", flex: "none" }}>
                    Downloaded
                  </span>
                ) : (
                  <DownloadMacButton onEngage={onDownloadEngage} />
                )
              }
            />
          )}
        </div>
      </div>

      {/* right: product shot */}
      <div
        className="hidden lg:flex"
        style={{ flex: "none", height: "100vh", alignItems: "center", overflow: "hidden" }}
      >
        <ProductMock />
      </div>
    </main>
  );
}

function StepCard({
  n,
  active,
  done,
  icon,
  title,
  sub,
  action,
}: {
  n: number;
  active?: boolean;
  done?: boolean;
  icon: React.ReactNode;
  title: string;
  sub: string;
  action: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#1c1c1e",
        border: `1px solid ${active ? "#0a84ff" : "#2c2c2e"}`,
        borderRadius: 16,
        padding: "16px 18px",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          flex: "none",
          borderRadius: "50%",
          background: done ? "#30d158" : active ? "#0a84ff" : "#2c2c2e",
          color: done || active ? "#fff" : "#98989d",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {done ? "✓" : n}
      </span>
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#98989d", whiteSpace: "nowrap" }}>{sub}</div>
      </div>
      {action}
    </div>
  );
}

function ChatIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

function ChromeLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 48 48" style={{ flex: "none" }} aria-hidden>
      <circle cx="24" cy="24" r="20" fill="#fff" />
      <path
        d="M24 4a20 20 0 0 1 17.32 10H24a10 10 0 0 0-9.4 6.6L7.4 9.4A19.96 19.96 0 0 1 24 4Z"
        fill="#ea4335"
      />
      <path d="M41.32 14A20 20 0 0 1 26 43.9L33.4 29a10 10 0 0 0-.72-11.1Z" fill="#fbbc05" />
      <path d="M14.6 20.6a10 10 0 0 0 9.06 13.38h.06L26 43.9A20 20 0 0 1 7.4 9.4Z" fill="#34a853" />
      <circle cx="24" cy="24" r="8" fill="#fff" />
      <circle cx="24" cy="24" r="6.4" fill="#4285f4" />
    </svg>
  );
}

function AppTile() {
  return (
    <span
      style={{
        width: 30,
        height: 30,
        flex: "none",
        borderRadius: 8,
        background: "linear-gradient(180deg, #0a84ff, #0060df)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ChatIcon size={15} />
    </span>
  );
}

/* Static product mock (design 5a right pane). Presentation only. */
function ProductMock() {
  const rows = [
    { init: "L", bg: "linear-gradient(180deg, #98989d, #55555a)", name: "Leo Park", sub: "You: see you there · 5h" },
    { init: "P", bg: "linear-gradient(180deg, #ff9f0a, #c25d18)", name: "weekend plans", sub: "Priya is active", online: true },
    { init: "J", bg: "linear-gradient(180deg, #5e9ccf, #33627e)", name: "Jordan Lee", sub: "Liked a message · 11h" },
    { init: "S", bg: "#3a3a3c", name: "Sam Rivera", sub: "haha true · 11h", dim: true },
    { init: "C", bg: "linear-gradient(180deg, #bf5af2, #7d3a9e)", name: "Chris Wong", sub: "You: okok · 12h" },
  ];
  const mayaBg = "linear-gradient(180deg, #64d2ff, #2f6ec2)";
  return (
    <div
      style={{
        width: 540,
        height: 500,
        background: "#101012",
        border: "1px solid #2c2c2e",
        borderRadius: 16,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        display: "grid",
        gridTemplateColumns: "215px 1fr",
        overflow: "hidden",
      }}
    >
      {/* sidebar */}
      <div style={{ borderRight: "1px solid #2c2c2e", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "16px 16px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            yourname{" "}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#98989d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <div style={{ padding: "0 16px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#26262a",
              borderRadius: 999,
              padding: "7px 12px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#636366" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span style={{ fontSize: 12, color: "#636366" }}>Search</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            padding: "4px 16px 8px",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>Messages</span>
          <span style={{ fontSize: 12, color: "#98989d" }}>Requests</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            margin: "0 6px",
            background: "#26262a",
            borderRadius: 10,
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              flex: "none",
              borderRadius: "50%",
              background: mayaBg,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            M
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Maya Chen</div>
            <div style={{ fontSize: 11, color: "#98989d" }}>sounds good · 5h</div>
          </div>
        </div>
        {rows.map((r) => (
          <div
            key={r.name}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px" }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                flex: "none",
                borderRadius: "50%",
                background: r.bg,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                color: r.dim ? "#98989d" : "#fff",
                position: "relative",
              }}
            >
              {r.init}
              {r.online && (
                <span
                  style={{
                    position: "absolute",
                    right: -1,
                    bottom: -1,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#30d158",
                    border: "2px solid #101012",
                  }}
                />
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
              <div
                style={{
                  fontSize: 11,
                  color: "#98989d",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* thread */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid #2c2c2e",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              flex: "none",
              borderRadius: "50%",
              background: mayaBg,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            M
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Maya Chen</div>
            <div style={{ fontSize: 11, color: "#98989d" }}>@maya.chen</div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 8-6 4 6 4V8Z" />
              <rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: "14px 16px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            justifyContent: "flex-end",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
            <MayaAvatar />
            <Bubble them radius="16px">what are you up to this week</Bubble>
          </div>
          <Bubble me radius="16px 16px 4px 16px" mt={8}>
            mostly work stuff honestly
          </Bubble>
          <Bubble me radius="16px 4px 16px 16px" mt={2}>
            but free after friday
          </Bubble>
          <div
            style={{
              fontSize: 10,
              color: "#636366",
              textAlign: "center",
              margin: "10px 0 2px",
              fontWeight: 500,
            }}
          >
            14:07
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
            <span style={{ width: 24, height: 24, flex: "none" }} />
            <Bubble them radius="16px 16px 16px 4px">Nice, dinner saturday?</Bubble>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, marginTop: 2 }}>
            <MayaAvatar />
            <Bubble them radius="4px 16px 16px 16px">There is a new place downtown</Bubble>
          </div>
          <Bubble me radius="16px" mt={10} max={75}>
            Yeah I am in, send me the spot
          </Bubble>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 7, marginTop: 8 }}>
            <MayaAvatar />
            <Bubble them radius="16px">will do 👌</Bubble>
          </div>
        </div>
        <div style={{ padding: "10px 14px 14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid #2c2c2e",
              borderRadius: 999,
              padding: "8px 14px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <path d="M9 9h.01" />
              <path d="M15 9h.01" />
            </svg>
            <span style={{ flex: 1, fontSize: 13, color: "#636366" }}>Message...</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v3" />
            </svg>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function MayaAvatar() {
  return (
    <span
      style={{
        width: 24,
        height: 24,
        flex: "none",
        borderRadius: "50%",
        background: "linear-gradient(180deg, #64d2ff, #2f6ec2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 600,
        color: "#fff",
      }}
    >
      M
    </span>
  );
}

function Bubble({
  children,
  them,
  me,
  radius,
  mt,
  max,
}: {
  children: React.ReactNode;
  them?: boolean;
  me?: boolean;
  radius: string;
  mt?: number;
  max?: number;
}) {
  void them;
  return (
    <div
      style={{
        maxWidth: `${max ?? 70}%`,
        alignSelf: me ? "flex-end" : undefined,
        background: me ? "#4c5cf2" : "#26262a",
        color: me ? "#fff" : "#f5f5f7",
        padding: "8px 12px",
        borderRadius: radius,
        fontSize: 13,
        lineHeight: 1.35,
        marginTop: mt,
      }}
    >
      {children}
    </div>
  );
}
