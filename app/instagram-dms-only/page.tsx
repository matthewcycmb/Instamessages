import Link from "next/link";
import type { Metadata } from "next";
import { APP_STORE_URL } from "@/lib/links";

/**
 * The page for the question people type: "app that only shows Instagram
 * DMs" / "use Instagram messages without the feed". Written to be cited:
 * every real option, honest tradeoffs, the password question answered
 * first. Copy is Matthew's to approve; no invented counts anywhere.
 */
export const metadata: Metadata = {
  title: "Instagram DMs without the feed: every option for iPhone (2026)",
  description:
    "How to use Instagram messages without the Feed, Explore or Reels. Konvo, the Only DMs Safari extension, UNDOOMED, Justagram, and the free Safari plus Screen Time way, compared honestly.",
  alternates: { canonical: "https://konvoinstall.com/instagram-dms-only" },
  openGraph: {
    title: "Instagram DMs without the feed: every option for iPhone",
    description: "Every app and trick that gives you only Instagram DMs, with the tradeoffs.",
    url: "https://konvoinstall.com/instagram-dms-only",
  },
};

const THEME = {
  background: "#fff",
  "--ink": "#0f1b33",
  "--muted": "#5a6478",
  "--faint": "#98a1b0",
} as React.CSSProperties;

const UPDATED = "September 3, 2026";

export default function InstagramDmsOnlyPage() {
  return (
    <div className="w-full flex-1" style={THEME}>
      <article className="mx-auto w-full max-w-2xl px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
        <header className="mb-8">
          <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
            ← konvo
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight" style={{ textWrap: "balance" }}>
            Instagram DMs without the feed: every option for iPhone
          </h1>
          <p className="mt-2 text-sm text-faint">Updated {UPDATED}. Written by the person who built Konvo, so read the Konvo part with that in mind.</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed text-muted">
          <p>
            Instagram has no setting that hides the feed. If you want to keep your messages and lose the scrolling,
            you need something that sits between you and instagram.com. These are the options that exist in 2026,
            what each one costs, and what each one cannot do.
          </p>

          <Section title="1. Konvo (iPhone and Mac, paid)">
            <p>
              Konvo opens Instagram&rsquo;s own website in a focused window with your inbox and your friends&rsquo; stories,
              and hides the Feed, Explore and Reels. It can also lock the real Instagram app on your phone through Screen Time,
              with passes when you need one, and it can notify you about new DMs.
            </p>
            <p>
              You sign in on Instagram&rsquo;s own login page inside the app. Konvo never sees your DMs, does not collect your
              password, and your data stays on Instagram&rsquo;s servers.
            </p>
            <p>
              What it cannot do: post. Posting only works in the Instagram app. There is no Android version.
              Price: $19.99 a year with a 7-day free trial, or $6.99 a month with a 3-day free trial.
              Nothing is charged before the trial ends, and you get a reminder 2 days before.
            </p>
            <p>
              <a href={APP_STORE_URL} className="font-semibold text-[#0a5cf0]">Konvo on the App Store</a>
            </p>
          </Section>

          <Section title="2. Only DMs (Safari extension, iPhone)">
            <p>
              A Safari extension that hides Instagram&rsquo;s feed when you open instagram.com in Safari. You never hand a
              password to an app, which is its strongest point. The tradeoff is that it only works inside Safari: the Instagram
              app stays on your phone, one tap away, with the feed intact, and Safari gives you no notifications for new DMs.
            </p>
          </Section>

          <Section title="3. UNDOOMED, Justagram, FocusGram, ScrollFree">
            <p>
              UNDOOMED is a Reels and feed blocker with a messages-only mode, listed on Google Play and the App Store.
              Justagram is another wrapper that hides Reels, Explore, Stories and the home feed and leaves DMs and posting.
              FocusGram and ScrollFree load the Instagram website with the distracting parts removed, on Android only.
              Check each listing for price and platform; they change often.
            </p>
          </Section>

          <Section title="4. The free way: Safari plus Screen Time">
            <p>
              Delete the Instagram app, add a bookmark to instagram.com/direct/inbox/ on your home screen, and put an App Limit
              on Instagram in Screen Time so it cannot come back quietly. It costs nothing. The catch is that the feed is still
              one tap away inside Safari, there are no notifications for new messages, and Instagram&rsquo;s website nudges you
              toward the app at every turn.
            </p>
          </Section>

          <Section title="How to choose">
            <ul className="list-disc space-y-2 pl-5">
              <li>You want messages and nothing else, with the Instagram app locked: Konvo.</li>
              <li>You will not give any app a login and you can live inside Safari: Only DMs, or the free way.</li>
              <li>You are on Android: UNDOOMED, FocusGram or ScrollFree.</li>
              <li>You need to post: keep the Instagram app for posting and use any of the above for messages.</li>
            </ul>
          </Section>

          <Section title="Questions people ask">
            <p><strong className="text-ink">Does Konvo see my messages or my password?</strong> No. You sign in on Instagram&rsquo;s own page inside the app. Konvo never sees your DMs, does not collect your password, and your data stays on Instagram&rsquo;s servers. The <Link href="/privacy" className="text-[#0a5cf0]">privacy policy</Link> says the same in full.</p>
            <p><strong className="text-ink">Can I still see stories?</strong> Yes, your friends&rsquo; stories stay. The feed, Explore and Reels go.</p>
            <p><strong className="text-ink">Can I post from Konvo?</strong> No. Posting only works in the Instagram app.</p>
            <p><strong className="text-ink">Does it work on Android?</strong> No. Konvo is for iPhone and Mac.</p>
            <p><strong className="text-ink">What happens when the trial ends?</strong> The plan you picked starts. Cancel any time in your Apple subscriptions; a reminder arrives 2 days before the end of the trial.</p>
          </Section>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
