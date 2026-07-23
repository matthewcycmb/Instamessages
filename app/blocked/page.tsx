import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram is blocked | Instachat",
};

/**
 * Where the browser extension sends every instagram.com attempt (design 4a).
 * The button deep-links into the native Mac app via its custom protocol;
 * the fallback line covers people who haven't downloaded it yet.
 */
export default function BlockedPage() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "#000",
        color: "#f5f5f7",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 460,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "linear-gradient(180deg, #0a84ff, #0060df)",
            boxShadow: "0 12px 40px rgba(10,132,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="42"
            height="42"
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
        <h1
          style={{
            fontSize: "clamp(32px, 7vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.08,
            margin: "32px 0 10px",
            textAlign: "center",
          }}
        >
          Instagram is blocked.
          <br />
          But your DMs aren&rsquo;t.
        </h1>
        <p style={{ fontSize: 17, color: "#98989d", margin: "0 0 36px", textAlign: "center" }}>
          Check your messages in Instachat.
        </p>
        <a
          href="instamessages://open"
          className="transition-opacity hover:opacity-85"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 54,
            padding: "0 36px",
            borderRadius: 999,
            background: "#0a84ff",
            color: "#fff",
            fontSize: 17,
            fontWeight: 600,
          }}
        >
          Open Instachat
        </a>
        <a
          href="/"
          style={{ fontSize: 14, color: "#636366", marginTop: 18 }}
          className="transition-colors hover:text-white"
        >
          Don&rsquo;t have the app? Get it here
        </a>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "#48484a" }}>Blocked by Instachat</span>
      </div>
    </main>
  );
}
