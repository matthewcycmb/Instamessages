import Link from "next/link";
import { ThreadList } from "./thread-list";
import { ImportButton } from "./import-button";
import { NewMessage } from "./new-message";

/** Desktop sidebar (design 3a split view). */
export function Sidebar({ username }: { username: string }) {
  return (
    <aside className="hidden h-full w-[340px] shrink-0 flex-col border-r border-line bg-surface/60 md:flex">
      <div className="flex items-center justify-between px-4 pb-3 pt-[max(1.1rem,env(safe-area-inset-top))]">
        <div>
          <div className="text-[22px] font-bold tracking-tight">Messages</div>
          <div className="text-[12px] text-faint">@{username}</div>
        </div>
        <div className="flex gap-2">
          <NewMessage />
          <ImportButton />
          <SettingsIcon />
        </div>
      </div>
      <ThreadList />
    </aside>
  );
}

export function SettingsIcon() {
  return (
    <Link
      href="/settings"
      aria-label="Settings"
      title="Settings"
      className="grid h-[34px] w-[34px] place-items-center rounded-full bg-surface transition-opacity hover:opacity-80"
    >
      <svg
        className="h-4 w-4 text-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    </Link>
  );
}
