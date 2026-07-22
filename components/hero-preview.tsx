/**
 * Non-interactive product preview for the landing page (desktop only).
 * A scaled replica of the Messages split view with placeholder people, so
 * visitors see exactly what the app is without exposing real conversations.
 */

type Thread = {
  initial: string;
  name: string;
  preview: string;
  from: [string, string];
  active?: boolean;
};

const THREADS: Thread[] = [
  { initial: "M", name: "Maya Chen", preview: "sat works! where u thinking", from: ["#bf5af2", "#8944ab"], active: true },
  { initial: "L", name: "Leo", preview: "You: haha yeah for sure", from: ["#64d2ff", "#0a84ff"] },
  { initial: "P", name: "Priya", preview: "You: omw", from: ["#ff9f0a", "#ff6482"] },
  { initial: "J", name: "Jordan", preview: "did you see this", from: ["#30d158", "#248a3d"] },
];

const BUBBLES = [
  { text: "you around this weekend?", me: false },
  { text: "thinking of grabbing food", me: false },
  { text: "yeah saturday works!", me: true },
  { text: "where you thinking", me: true },
] as const;

export function HeroPreview() {
  return (
    <div className="hidden w-[560px] shrink-0 overflow-hidden rounded-[18px] border border-line bg-bg shadow-2xl lg:block">
      <div className="flex h-[380px]">
        {/* sidebar */}
        <div className="flex w-[210px] shrink-0 flex-col border-r border-line bg-surface/50 p-3">
          <div className="mb-2 text-[15px] font-bold tracking-tight">Messages</div>
          <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] text-faint">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Search
          </div>
          <div className="space-y-0.5">
            {THREADS.map((t) => (
              <div
                key={t.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${t.active ? "bg-amber" : ""}`}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: `linear-gradient(180deg, ${t.from[0]}, ${t.from[1]})` }}
                >
                  {t.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[12px] font-semibold ${t.active ? "text-white" : ""}`}>
                    {t.name}
                  </div>
                  <div className={`truncate text-[11px] ${t.active ? "text-white/75" : "text-muted"}`}>
                    {t.preview}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
              style={{ background: "linear-gradient(180deg, #bf5af2, #8944ab)" }}
            >
              M
            </span>
            <div>
              <div className="text-[12px] font-semibold leading-tight">Maya Chen</div>
              <div className="text-[10px] text-amber">Replies close in 6h 12m</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-1 p-3">
            {BUBBLES.map((b, i) => (
              <div key={i} className={`flex ${b.me ? "justify-end" : "justify-start"}`}>
                <span
                  className={`max-w-[75%] px-3 py-1.5 text-[12px] leading-snug ${
                    b.me
                      ? "rounded-[14px] rounded-br-[4px] bg-amber text-white"
                      : "rounded-[14px] rounded-bl-[4px] bg-surface-2 text-ink"
                  }`}
                >
                  {b.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 pb-3">
            <div className="flex flex-1 items-center justify-between rounded-full border border-line px-3 py-1.5">
              <span className="text-[11px] text-faint">Message</span>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-amber text-[10px] text-white">↑</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
