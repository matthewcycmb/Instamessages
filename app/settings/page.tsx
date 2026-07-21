import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAccountId } from "@/lib/session";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const accountId = await getSessionAccountId();
  if (!accountId) redirect("/");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="Back"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>
      <SettingsForm />
    </div>
  );
}
