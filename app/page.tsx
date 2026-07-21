import Link from "next/link";
import { currentAccount } from "@/lib/account";
import { ThreadList } from "@/components/thread-list";
import { ImportButton } from "@/components/import-button";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const account = await currentAccount();
  const { error } = await searchParams;

  if (!account) return <ConnectScreen error={error} />;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="rise mb-5 flex items-end justify-between" style={{ animationDelay: "0ms" }}>
        <div>
          <h1 className="font-display text-3xl font-semibold italic tracking-tight">
            instamessages
          </h1>
          <p className="mt-0.5 text-sm text-muted">@{account.username}</p>
        </div>
        <nav className="flex items-center gap-2">
          <ImportButton />
          <Link
            href="/settings"
            className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-amber hover:text-ink"
          >
            Settings
          </Link>
        </nav>
      </header>

      <aside
        className="rise mb-4 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-muted"
        style={{ animationDelay: "80ms" }}
      >
        <span className="mr-1.5 font-semibold text-amber">Heads up:</span>
        Instagram&rsquo;s API never shows <span className="text-ink">group chats</span>. Check
        instagram.com/direct in a browser once or twice a week so plans don&rsquo;t slip past you.
      </aside>

      <div className="rise" style={{ animationDelay: "160ms" }}>
        <ThreadList />
      </div>
    </div>
  );
}

function ConnectScreen({ error }: { error?: string }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* ember glow behind the wordmark */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #e8963e 0%, #d9552f 45%, transparent 70%)" }}
      />

      {error && (
        <div className="rise relative mb-8 max-w-md rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}

      <p className="rise relative text-xs uppercase tracking-[0.3em] text-faint" style={{ animationDelay: "0ms" }}>
        deleted the app · kept the friends
      </p>

      <h1
        className="rise relative mt-4 font-display text-6xl font-semibold italic leading-none tracking-tight sm:text-7xl"
        style={{ animationDelay: "120ms" }}
      >
        insta<span className="text-amber">messages</span>
      </h1>

      <p className="rise relative mt-5 max-w-sm text-lg leading-relaxed text-muted" style={{ animationDelay: "240ms" }}>
        Your friends&rsquo; Instagram DMs, delivered here. No reels, no explore page, no feed —
        just the conversations.
      </p>

      <a
        href="/api/auth/instagram/login"
        className="rise relative mt-10 rounded-full px-8 py-3.5 text-base font-bold text-bubble-ink shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
        style={{
          animationDelay: "360ms",
          background: "linear-gradient(135deg, #e8963e, #d9552f)",
        }}
      >
        Connect Instagram
      </a>

      <p className="rise relative mt-6 max-w-xs text-xs leading-relaxed text-faint" style={{ animationDelay: "480ms" }}>
        Requires an Instagram creator or business account. Instagram only lets connected apps
        reply within 24&nbsp;hours — the app is honest about that everywhere.
      </p>
    </main>
  );
}
