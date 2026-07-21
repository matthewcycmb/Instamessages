import { currentAccount } from "@/lib/account";
import { Sidebar } from "@/components/sidebar";

/**
 * Persistent shell for the inbox and threads: the desktop app window and
 * sidebar live here, so switching conversations only swaps the thread pane.
 * The sidebar never remounts, which is what makes navigation feel native.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await currentAccount();
  if (!account) return <>{children}</>; // logged out: onboarding renders full-bleed

  return (
    <div className="flex-1 md:flex md:min-h-dvh md:items-center md:justify-center md:p-8">
      <div className="flex w-full flex-col bg-bg md:h-[min(720px,calc(100dvh-4rem))] md:max-w-[1000px] md:flex-row md:overflow-hidden md:rounded-[20px] md:border md:border-line md:shadow-2xl">
        <Sidebar username={account.username} />
        <main className="flex h-dvh w-full flex-col md:h-full md:min-w-0 md:flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
