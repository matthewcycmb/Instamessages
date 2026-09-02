import type { Metadata } from "next";
import GetKonvo from "./GetKonvo";

/**
 * The invite landing page (Sep 1): konvoinstall.com/i/<handle>. The share
 * sheet's Instagram extension takes only the URL, so the OG title carries
 * the casual line, not a tagline. Get Konvo copies the link (the app reads
 * it back at the paywall with a paste button) and goes to the App Store.
 */
type Ctx = { params: Promise<{ handle: string }> };

const clean = (h: string) => decodeURIComponent(h).replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "").slice(0, 30);

export async function generateMetadata(ctx: Ctx): Promise<Metadata> {
  const handle = clean((await ctx.params).handle);
  const title = handle ? `${handle} sent you 3 free days of Konvo` : "3 free days of Konvo";
  return {
    title,
    description: "instagram dms with no feed or reels. 3 days free with this link.",
    openGraph: { title, description: "instagram dms with no feed or reels. 3 days free with this link." },
  };
}

export default async function InvitePage(ctx: Ctx) {
  const handle = clean((await ctx.params).handle);
  const link = `https://konvoinstall.com/i/${handle}`;
  return (
    <main
      style={{
        minHeight: "100dvh", background: "#000", color: "#f5f5f7",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 28px 40px", fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={28} height={28} style={{ borderRadius: 7, display: "block" }} />
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>Konvo</span>
      </div>
      <h1 style={{ fontSize: 34, lineHeight: 1.12, letterSpacing: "-0.02em", fontWeight: 700, margin: "0 0 12px", textWrap: "balance" }}>
        {handle ? `${handle} sent you 3 free days of Konvo` : "3 free days of Konvo"}
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.4, color: "#8e8e93", margin: "0 0 32px" }}>
        Konvo only shows your Instagram messages and blocks the Feed, Explore and Reels pages. Install Konvo, sign in and paste this link to get 3 days for free.
      </p>
      <GetKonvo handle={handle} link={link} />
    </main>
  );
}
