import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentAccount } from "@/lib/account";
import { ThreadList } from "@/components/thread-list";
import { ImportButton } from "@/components/import-button";
import { SettingsIcon } from "@/components/sidebar";
import { NewMessage } from "@/components/new-message";
import { PushBanner } from "@/components/push-banner";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { IdentifyUser } from "@/components/identify-user";
import { BlockInstagramBanner } from "@/components/block-instagram-banner";
import { DockHintBanner } from "@/components/dock-hint-banner";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; utm_source?: string }>;
}) {
  const account = await currentAccount();
  const { error, utm_source } = await searchParams;

  if (!account) {
    // Older extension builds redirect here instead of /blocked.
    if (utm_source === "extension") redirect("/blocked");
    // Server-side UA sniff so the first paint already shows the right CTA
    // stack (no flash). The client only upgrades to "standalone" if the
    // page is running inside the installed app.
    const ua = (await headers()).get("user-agent") ?? "";
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    const chromium = /chrome|chromium|crios|edg|arc/i.test(ua);
    const initialEnv = mobile ? "mobile-browser" : chromium ? "desktop-chromium" : "desktop-other";
    return <OnboardingSteps error={error} initialEnv={initialEnv} />;
  }

  return (
    <>
      <IdentifyUser username={account.username} />
      {/* Desktop: sidebar comes from the layout; this is the empty pane */}
      <div className="hidden flex-1 flex-col items-center justify-center gap-5 px-6 md:flex">
        <DockHintBanner />
        <BlockInstagramBanner />
        <p className="text-[15px] text-faint">Select a conversation</p>
      </div>

      {/* Mobile: full-page list */}
      <div className="flex min-h-0 flex-1 flex-col pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] md:hidden">
        <header className="mb-3 flex items-center justify-between px-4">
          <div>
            <h1 className="text-[30px] font-bold tracking-tight">Messages</h1>
            <p className="text-[12px] text-faint">@{account.username}</p>
          </div>
          <div className="flex gap-2">
            <NewMessage />
            <ImportButton />
            <SettingsIcon />
          </div>
        </header>

        <PushBanner />
        <ThreadList />

        <p className="mt-3 px-4 text-center text-[11px] leading-relaxed text-faint">
          Group chats don&rsquo;t reach this app. That&rsquo;s Instagram&rsquo;s rule.
        </p>
      </div>
    </>
  );
}
