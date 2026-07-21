import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Instamessages",
};

const CONTACT_EMAIL = "jchanh@gmail.com";
const EFFECTIVE_DATE = "July 21, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
          ← instamessages
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-faint">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted">
        <Section title="What Instamessages is">
          <p>
            Instamessages is a personal messaging client. It connects to your own Instagram
            professional account through Meta&rsquo;s official Instagram API so you can read and
            reply to your Instagram direct messages without installing the Instagram app.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Your Instagram account basics</span>: username and
              account ID, plus the access token Instagram issues when you connect. The token is
              stored server-side only and is never shared with your browser.
            </li>
            <li>
              <span className="text-ink">Your direct messages</span>: the contents of 1:1
              conversations on your account (text, timestamps, and attachment links), received
              from Meta&rsquo;s webhooks and conversation API so they can be shown to you.
            </li>
            <li>
              <span className="text-ink">Push subscription</span>: if you enable notifications,
              the push endpoint your browser generates, used only to notify you of new messages.
            </li>
          </ul>
        </Section>

        <Section title="How it's used">
          <p>
            For one purpose: showing your own messages to you and letting you reply. Data is
            never sold, shared with third parties, used for advertising, or used to train
            anything. Messages are stored in a private database (Supabase/PostgreSQL) with
            access restricted to your account.
          </p>
        </Section>

        <Section title="Retention and deletion">
          <p>
            You control retention in <span className="text-ink">Settings</span>: keep messages
            forever or auto-delete after 30/90/365 days. You can delete everything at any time
            with <span className="text-ink">Settings → Delete all stored messages</span>, which
            permanently removes all stored conversations and messages. Disconnecting your
            account and requesting full deletion of the account record itself can be done by
            emailing the address below.
          </p>
        </Section>

        <Section title="Data deletion instructions">
          <p>
            To delete your data: open the app → Settings → &ldquo;Delete all stored
            messages&rdquo;, then email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>{" "}
            to remove your account record and access token. Requests are honored within 30 days.
          </p>
        </Section>

        <Section title="Third parties">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Meta Platforms</span>: messages are sent and received
              through Meta&rsquo;s Instagram API under{" "}
              <a
                href="https://www.facebook.com/privacy/policy"
                className="text-amber underline underline-offset-2"
              >
                Meta&rsquo;s privacy policy
              </a>
              .
            </li>
            <li>
              <span className="text-ink">Supabase</span>: database hosting.
            </li>
            <li>
              <span className="text-ink">Vercel</span>: application hosting.
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
