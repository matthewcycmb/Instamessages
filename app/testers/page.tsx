import type { Metadata } from "next";
import { TerminalCommand } from "@/components/terminal-install";

export const metadata: Metadata = {
  title: "Test Instachat",
};

const WIN_EXE =
  "https://github.com/matthewcycmb/instamessages/releases/download/windows-preview/Instachat_0.1.0_x64-setup.exe";
const EXT_ZIP =
  "https://github.com/matthewcycmb/instachat-extension/releases/latest/download/instachat-extension.zip";

export default function TestersPage() {
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
        padding: "56px 20px 80px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "linear-gradient(180deg, #0a84ff, #0060df)",
              boxShadow: "0 8px 28px rgba(10,132,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            </svg>
          </div>
          <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em" }}>Instachat</span>
        </div>

        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.025em", margin: "24px 0 6px" }}>
          Test Instachat
        </h1>
        <p style={{ fontSize: 16, color: "#98989d", margin: "0 0 32px" }}>
          Pick your device below. Each takes about a minute.
        </p>

        {/* Mac */}
        <Card badge="🍎" title="On a Mac">
          <Step n={1}>
            Open <B>Terminal</B> (press <B>⌘ + Space</B>, type &ldquo;Terminal&rdquo;, hit Return).
          </Step>
          <Step n={2}>Paste this line and press Return:</Step>
          <TerminalCommand />
          <Note>The app installs and opens itself. Sign in to Instagram normally.</Note>
        </Card>

        {/* Windows */}
        <Card badge="🪟" title="On Windows">
          <Step n={1}>
            <Button href={WIN_EXE}>Download for Windows</Button>
          </Step>
          <Step n={2}>Open the downloaded file.</Step>
          <Step n={3}>
            If Windows shows a blue warning, click <B>More info</B> → <B>Run anyway</B>{" "}
            (it&rsquo;s a test build, so this is expected).
          </Step>
          <Note>Then it installs and opens. Sign in to Instagram normally.</Note>
        </Card>

        {/* Extension */}
        <Card badge="🧩" title="Chrome extension (any computer)">
          <Step n={1}>
            <Button href={EXT_ZIP}>Download the extension</Button> and unzip it.
          </Step>
          <Step n={2}>
            Open <B>chrome://extensions</B> in Chrome (or Edge / Brave).
          </Step>
          <Step n={3}>
            Turn on <B>Developer mode</B> (toggle, top-right).
          </Step>
          <Step n={4}>
            Click <B>Load unpacked</B> and choose the unzipped folder.
          </Step>
          <Note>Now open instagram.com &mdash; it blocks the feed and sends you to Instachat.</Note>
        </Card>

        <p style={{ fontSize: 13, color: "#48484a", textAlign: "center", marginTop: 28 }}>
          Something not working? Just reply and let me know.
        </p>
      </div>
    </main>
  );
}

function Card({
  badge,
  title,
  children,
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#1c1c1e",
        border: "1px solid #2c2c2e",
        borderRadius: 18,
        padding: "20px 20px 22px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }} aria-hidden>
          {badge}
        </span>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 10 }}>
      <span
        style={{
          width: 22,
          height: 22,
          flex: "none",
          borderRadius: "50%",
          background: "#0a84ff",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          marginTop: 1,
        }}
      >
        {n}
      </span>
      <div style={{ fontSize: 15, color: "#e5e5e7", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="transition-opacity hover:opacity-85"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 40,
        padding: "0 20px",
        borderRadius: 999,
        background: "#0a84ff",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {children}
    </a>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "#f5f5f7", fontWeight: 600 }}>{children}</span>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: "#98989d", lineHeight: 1.5, margin: "12px 0 0" }}>{children}</p>
  );
}
