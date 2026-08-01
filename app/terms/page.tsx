import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Konvo",
};

const CONTACT_EMAIL = "jchanh@gmail.com";
const EFFECTIVE_DATE = "August 1, 2026";

// Same palette pin as /privacy: follow the hardcoded-light landing, not the
// app's dark-mode tokens.
const LANDING_THEME = {
  background: "#fff",
  "--ink": "#0f1b33",
  "--muted": "#5a6478",
  "--faint": "#98a1b0",
  "--amber": "#0a5cf0",
} as React.CSSProperties;

export default function TermsPage() {
  return (
    <div className="w-full flex-1" style={LANDING_THEME}>
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← konvo
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Terms of Use</h1>
        <p className="mt-2 text-sm text-faint">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted">
        <Section title="The agreement">
          <p>
            Konvo is licensed to you under Apple&rsquo;s{" "}
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              className="text-amber underline underline-offset-2"
            >
              Standard End User License Agreement
            </a>
            , which these terms supplement. By using Konvo you agree to both.
          </p>
        </Section>

        <Section title="Subscriptions">
          <p>
            Konvo on iOS is a paid app with auto-renewable subscriptions, billed and
            managed by Apple through your Apple ID:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Yearly, $29.99/year</span>, with a 7-day free
              trial. You are charged when the trial ends unless you cancel before.
            </li>
            <li>
              <span className="text-ink">Monthly, $4.99/month</span>, no trial.
            </li>
            <li>
              <span className="text-ink">Weekly, $1.99/week</span>, no trial.
            </li>
          </ul>
          <p className="mt-2">
            All plans renew automatically until canceled in Settings &rsaquo;
            Subscriptions on your device. Cancellation takes effect at the end of the
            current billing period. A subscription bought on one device unlocks Konvo on
            any device signed in to the same Apple ID; use Restore Purchases in the app
            after a reinstall. Refunds are handled by Apple through{" "}
            <a
              href="https://reportaproblem.apple.com"
              className="text-amber underline underline-offset-2"
            >
              reportaproblem.apple.com
            </a>
            .
          </p>
        </Section>

        <Section title="Instagram">
          <p>
            Konvo is not affiliated with, endorsed by, or sponsored by Instagram or Meta
            Platforms. You need your own Instagram account, and your use of Instagram
            inside Konvo remains governed by Instagram&rsquo;s own terms. Konvo shows
            Instagram&rsquo;s website with the feed, Reels, and Explore surfaces hidden;
            Instagram may change its site in ways that affect Konvo at any time.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Konvo is provided as is, without warranty of any kind. We are not liable for
            anything Instagram does to your account, for messages you send or receive, or
            for interruptions caused by changes to Instagram&rsquo;s website.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      </div>
    </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
