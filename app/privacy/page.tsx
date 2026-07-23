import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Instachat",
};

const CONTACT_EMAIL = "jchanh@gmail.com";
const EFFECTIVE_DATE = "July 23, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← instachat
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-faint">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted">
        <Section title="What Instachat is">
          <p>
            Instachat is a desktop app that opens Instagram&rsquo;s own website in a focused
            window showing only direct messages, plus a browser extension that redirects
            instagram.com&rsquo;s feed, reels, and profile pages to this site. You sign in to
            Instagram directly with Instagram; Instachat is not affiliated with Meta.
          </p>
        </Section>

        <Section title="What we collect">
          <p>
            <span className="text-ink">Nothing.</span> Instachat has no accounts, no server-side
            storage, and no database. Your Instagram login happens directly between you and
            instagram.com inside the app; your credentials and messages never pass through or
            get stored on our servers. The browser extension contains only static redirect
            rules &mdash; it runs no code on any page, and reads and transmits no data.
          </p>
        </Section>

        <Section title="Analytics">
          <p>
            This website (the landing page only) uses PostHog to count anonymous page visits
            and button clicks, so we can see whether the setup steps work. The desktop app and
            the extension contain no analytics.
          </p>
        </Section>

        <Section title="Third parties">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Meta Platforms</span>: your Instagram session inside
              the app is governed by{" "}
              <a
                href="https://www.facebook.com/privacy/policy"
                className="text-amber underline underline-offset-2"
              >
                Meta&rsquo;s privacy policy
              </a>
              .
            </li>
            <li>
              <span className="text-ink">Vercel</span>: hosts this website.
            </li>
          </ul>
        </Section>

        <Section title="Contact">
          <p>
            Questions or requests:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
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
