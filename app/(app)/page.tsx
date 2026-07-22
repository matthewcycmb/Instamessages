import { currentAccount } from "@/lib/account";
import { ThreadList } from "@/components/thread-list";
import { ImportButton } from "@/components/import-button";
import { SettingsIcon } from "@/components/sidebar";
import { NewMessage } from "@/components/new-message";
import { PushBanner } from "@/components/push-banner";
import { OnboardingSteps } from "@/components/onboarding-steps";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; step?: string }>;
}) {
  const account = await currentAccount();
  const { error, step } = await searchParams;

  if (!account) {
    const parsed = Number(step);
    const initialStep = Number.isInteger(parsed) && parsed >= 1 && parsed <= 3 ? parsed : 0;
    return <OnboardingSteps error={error} initialStep={initialStep} />;
  }

  return (
    <>
      {/* Desktop: sidebar comes from the layout; this is the empty pane */}
      <div className="hidden flex-1 items-center justify-center md:flex">
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
