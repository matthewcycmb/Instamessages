export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** "2:41 PM" / "Yesterday" / "Jul 14" — iMessage-style list timestamps. */
export function listTimestamp(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((startOfToday.getTime() - date.getTime()) / 86_400_000) + 1;

  if (date >= startOfToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (days <= 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function bubbleTimestamp(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export type WindowState =
  | { open: true; msLeft: number; label: string }
  | { open: false; label: string };

/** Reply-window state from the last inbound message time. */
export function replyWindow(lastInboundAt: string | null): WindowState {
  if (!lastInboundAt) {
    return { open: false, label: "Waiting for them to message first" };
  }
  const msLeft = new Date(lastInboundAt).getTime() + REPLY_WINDOW_MS - Date.now();
  if (msLeft <= 0) return { open: false, label: "Reply window closed" };

  const hours = Math.floor(msLeft / 3_600_000);
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
  const label =
    hours > 0 ? `Replies close in ${hours}h ${minutes}m` : `Replies close in ${minutes}m`;
  return { open: true, msLeft, label };
}
