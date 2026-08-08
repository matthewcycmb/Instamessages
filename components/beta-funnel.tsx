"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { TESTFLIGHT_URL as TESTFLIGHT } from "@/lib/links";
import posthog from "posthog-js";

/**
 * The funnel behind the Instagram video: comment KONVO, get the link, land
 * here, leave an email, install the beta.
 *
 * Written for the phone first because that is where every visitor arrives -
 * an Instagram DM opens in Instagram's own browser on an iPhone. The desktop
 * layout exists to hand people back to their phone, since there is nothing
 * to install on a Mac.
 *
 * Not currently routed: the landing page is the front door again (app/page.tsx).
 * Swap the component there to bring this back.
 */

const INK = "#0f1b33";
const MUT = "#5a6478";
const ACCENT = "#0a84ff";
const SHELL = 1100;

type Device = "ios" | "android" | "desktop";

export function BetaFunnel({
  device,
  inAppBrowser,
}: {
  device: Device;
  inAppBrowser: boolean;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    // One trust-boundary check, client side is enough for a mailing list.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setErr("That email doesn't look right.");
      return;
    }
    setErr("");
    try {
      // PostHog is the list: no backend, no new secrets, and it exports.
      posthog.setPersonProperties?.({ email: value, beta_device: device });
    } catch {}
    track("beta_email_submitted", { device, in_app_browser: inAppBrowser });
    setDone(true);
  }

  return (
    <div
      style={{
        width: "100%",
        color: INK,
        minHeight: "100dvh",
        position: "relative",
        // The landing page's backdrop, kept identical so the funnel reads as
        // the same product and not a stripped-down form.
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.88) 74%, #fff 100%), url('/hero-bg.jpg')",
        backgroundSize: "cover, cover",
        backgroundPosition: "center top, center top",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundColor: "#fff",
      }}
    >
      {inAppBrowser && <SafariBanner />}

      <div
        style={{
          maxWidth: SHELL,
          margin: "0 auto",
          padding: "22px 20px 72px",
          boxSizing: "border-box",
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Wordmark />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(20,40,80,0.12)",
              borderRadius: 999,
              padding: "7px 14px",
              fontSize: 13.5,
              fontWeight: 500,
              color: "#2c3444",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#30a14e" }} />
            Free while in beta
          </span>
        </header>

        <div className="bf-grid">
          <div className="bf-copy">
            <h1
              style={{
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.04,
                margin: "38px 0 0",
              }}
              className="bf-h1"
            >
              Instagram DMs.
              <br />
              Nothing else.
            </h1>
            <p
              style={{
                fontSize: 17.5,
                lineHeight: 1.5,
                color: MUT,
                margin: "18px 0 0",
                maxWidth: 460,
              }}
            >
              Your Instagram messages, without the feed, Reels or Explore.
              Log in and your conversations are already there.
            </p>

            {device === "ios" ? (
              done ? (
                <Installed />
              ) : (
                <form onSubmit={submit} style={{ margin: "30px 0 0", maxWidth: 460 }}>
                  <label
                    htmlFor="bf-email"
                    style={{ display: "block", fontSize: 14.5, fontWeight: 600, marginBottom: 9 }}
                  >
                    Where should we send beta updates?
                  </label>
                  <div className="bf-row">
                    <input
                      id="bf-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: 54,
                        borderRadius: 13,
                        border: `1px solid ${err ? "#d1332e" : "rgba(20,40,80,0.16)"}`,
                        padding: "0 16px",
                        fontSize: 16.5,
                        color: INK,
                        outlineColor: ACCENT,
                        background: "#fff",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        height: 54,
                        border: 0,
                        borderRadius: 13,
                        background: ACCENT,
                        color: "#fff",
                        fontSize: 16.5,
                        fontWeight: 600,
                        padding: "0 24px",
                        boxShadow: "0 8px 20px rgba(10,132,255,0.26)",
                        cursor: "pointer",
                      }}
                    >
                      Get the beta
                    </button>
                  </div>
                  {err ? (
                    <p style={{ color: "#d1332e", fontSize: 14, margin: "9px 0 0" }}>{err}</p>
                  ) : (
                    <p style={{ color: MUT, fontSize: 13.5, margin: "10px 0 0" }}>
                      One email when the full app launches. Nothing else, ever.
                    </p>
                  )}
                </form>
              )
            ) : device === "android" ? (
              <NotYet
                title="iPhone only, for now"
                body="Konvo runs on iPhone today. Leave your email and you'll hear the moment Android is ready."
                onDone={submit}
                email={email}
                setEmail={setEmail}
                err={err}
                done={done}
              />
            ) : (
              <OnYourPhone />
            )}
          </div>

          <div className="bf-shot" aria-hidden>
            <PhoneShot />
          </div>
        </div>

        {device === "ios" && <HowTo />}
        <Security />

        <footer
          style={{
            marginTop: 64,
            paddingTop: 22,
            borderTop: "1px solid rgba(20,40,80,0.08)",
            display: "flex",
            gap: 20,
            fontSize: 14,
            color: MUT,
          }}
        >
          <a href="/privacy" style={{ color: "inherit" }}>
            Privacy
          </a>
          <a href="/terms" style={{ color: "inherit" }}>
            Terms
          </a>
          <span style={{ marginLeft: "auto" }}>Konvo</span>
        </footer>
      </div>

      <style>{`
        .bf-h1 { font-size: 44px; }
        .bf-grid { display: block; }
        .bf-row { display: flex; gap: 10px; }
        .bf-shot { display: none; }
        @media (min-width: 900px) {
          .bf-h1 { font-size: 58px; }
          .bf-grid {
            /* Sized to content and centred as a pair, rather than two
               fractions of a wide shell: fractions pushed the copy to the
               far left and the phone to the far right with a lake of empty
               space between them. */
            display: grid;
            grid-template-columns: minmax(0, 500px) 270px;
            gap: 40px;
            justify-content: center;
            align-items: center;
          }
          .bf-shot { display: block; }
        }
        @media (max-width: 420px) {
          .bf-h1 { font-size: 38px; }
          .bf-row { flex-direction: column; }
          .bf-row button { width: 100%; }
        }
      `}</style>
    </div>
  );
}

/**
 * The single biggest drop-off on this page is invisible: an Instagram DM link
 * opens inside Instagram's own browser, where TestFlight redemption often
 * fails. Say so before anything else, in their words, at the top.
 */
function SafariBanner() {
  return (
    <div
      style={{
        background: "#fff4e5",
        borderBottom: "1px solid #f0d9b5",
        color: "#6b4b16",
        padding: "13px 18px",
        fontSize: 15,
        lineHeight: 1.45,
        textAlign: "center",
      }}
    >
      <strong style={{ fontWeight: 600 }}>Open this in Safari first.</strong> Tap
      the <strong style={{ fontWeight: 600 }}>•••</strong> at the top right, then{" "}
      <strong style={{ fontWeight: 600 }}>Open in browser</strong>. Installing
      from inside Instagram usually fails.
    </div>
  );
}

function Installed() {
  return (
    <div style={{ margin: "30px 0 0", maxWidth: 460 }}>
      <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 14px" }}>
        You&apos;re in. Two taps to go.
      </p>
      <a
        href={TESTFLIGHT}
        onClick={() => track("beta_testflight_opened")}
        style={{
          display: "block",
          textAlign: "center",
          textDecoration: "none",
          height: 56,
          lineHeight: "56px",
          borderRadius: 13,
          background: ACCENT,
          color: "#fff",
          fontSize: 17,
          fontWeight: 600,
          boxShadow: "0 8px 20px rgba(10,132,255,0.26)",
        }}
      >
        Open in TestFlight
      </a>
      <p style={{ color: MUT, fontSize: 13.5, margin: "12px 0 0" }}>
        TestFlight is Apple&apos;s own app for trying apps before release. If you
        don&apos;t have it yet, the link installs it first.
      </p>
    </div>
  );
}

/** Under the button, never in front of it: confident testers never read this. */
function HowTo() {
  const steps = [
    ["Install TestFlight", "It's Apple's free app for testing. The button above sends you to it."],
    ["Tap Accept, then Install", "Konvo appears in TestFlight. Installing puts it on your home screen."],
    ["Log in with Instagram", "Your DMs are already there. Nothing to set up."],
  ];
  return (
    <section style={{ marginTop: 56 }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
        Never used TestFlight?
      </h2>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
        {steps.map(([title, body], i) => (
          <li key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span
              style={{
                flex: "none",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#eef4ff",
                color: ACCENT,
                fontSize: 14.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i + 1}
            </span>
            <span>
              <span style={{ display: "block", fontSize: 16, fontWeight: 600 }}>{title}</span>
              <span style={{ display: "block", fontSize: 15, color: MUT, marginTop: 2 }}>{body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The most common tester objection, answered where they can link it. Every
 * claim here is checkable: the sign-in page is Instagram's, and the session
 * appears in Instagram's own "Where you're logged in" list.
 */
function Security() {
  const points: [string, string][] = [
    [
      "You sign in on Instagram's own page",
      "When you tap sign in, Konvo opens Instagram's real sign-in page, the same one Safari shows. Your password goes to Instagram, not to us.",
    ],
    [
      "Konvo has no server",
      "There is no Konvo account and no Konvo database. Your Instagram session lives only on your phone, exactly like it does in Safari.",
    ],
    [
      "You stay in control",
      "Your Konvo session shows up in Instagram's settings under “Where you're logged in”, and you can log it out from there any time, like any other device.",
    ],
  ];
  return (
    <section id="security" style={{ marginTop: 56 }}>
      <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 18px" }}>
        Is it safe to log in?
      </h2>
      <div style={{ display: "grid", gap: 14, maxWidth: 560 }}>
        {points.map(([title, body]) => (
          <div key={title}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 600 }}>{title}</span>
            <span style={{ display: "block", fontSize: 15, color: MUT, marginTop: 2, lineHeight: 1.5 }}>
              {body}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OnYourPhone() {
  return (
    <div style={{ margin: "30px 0 0", maxWidth: 460 }}>
      <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 10px" }}>
        Konvo is an iPhone app.
      </p>
      <p style={{ fontSize: 16, color: MUT, margin: "0 0 18px", lineHeight: 1.5 }}>
        Open this page on your iPhone to join the beta.
      </p>
      <div
        style={{
          border: "1px solid rgba(20,40,80,0.14)",
          borderRadius: 13,
          padding: "16px 18px",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        konvoinstall.com
      </div>
    </div>
  );
}

function NotYet({
  title,
  body,
  onDone,
  email,
  setEmail,
  err,
  done,
}: {
  title: string;
  body: string;
  onDone: (e: React.FormEvent) => void;
  email: string;
  setEmail: (v: string) => void;
  err: string;
  done: boolean;
}) {
  if (done) {
    return (
      <p style={{ margin: "30px 0 0", fontSize: 17, fontWeight: 600 }}>
        Thanks. You&apos;ll hear from us first.
      </p>
    );
  }
  return (
    <form onSubmit={onDone} style={{ margin: "30px 0 0", maxWidth: 460 }}>
      <p style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontSize: 15.5, color: MUT, margin: "0 0 16px", lineHeight: 1.5 }}>{body}</p>
      <div className="bf-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            height: 54,
            borderRadius: 13,
            border: `1px solid ${err ? "#d1332e" : "rgba(20,40,80,0.16)"}`,
            padding: "0 16px",
            fontSize: 16.5,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          style={{
            height: 54,
            border: 0,
            borderRadius: 13,
            background: ACCENT,
            color: "#fff",
            fontSize: 16.5,
            fontWeight: 600,
            padding: "0 24px",
            cursor: "pointer",
          }}
        >
          Notify me
        </button>
      </div>
      {err && <p style={{ color: "#d1332e", fontSize: 14, margin: "9px 0 0" }}>{err}</p>}
    </form>
  );
}

function PhoneShot() {
  return (
    <div
      style={{
        borderRadius: 34,
        overflow: "hidden",
        border: "1px solid rgba(20,40,80,0.1)",
        boxShadow: "0 30px 70px rgba(15,27,51,0.18)",
        background: "#000",
        aspectRatio: "390 / 780",
        maxWidth: 260,
        margin: "0 auto",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/phone-thread.webp"
        alt="Konvo showing an Instagram conversation with no feed"
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function Wordmark() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "linear-gradient(180deg, #0a84ff, #0060df)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </span>
      <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>Konvo</span>
    </span>
  );
}
