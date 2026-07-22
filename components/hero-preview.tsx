/**
 * Non-interactive product preview for the landing page (desktop only).
 * Replicates the real messenger layout (per the reference screenshot):
 * username header + compose, search, notes row, Messages/Requests, thread
 * rows with timestamps, chat header with call/video/info, bubbles, and the
 * full composer. Placeholder people only. Fixed dark palette so it reads
 * as a product screenshot in both site themes.
 */

const C = {
  bg: "#0d0d10",
  panel: "#111114",
  line: "#26262a",
  pill: "#1c1c1f",
  selected: "#232327",
  ink: "#f5f5f7",
  muted: "#8e8e93",
  bubbleIn: "#26262a",
  bubbleOut: "#4b5cf0",
};

type Thread = {
  initial: string;
  name: string;
  preview: string;
  time: string;
  from: [string, string];
  active?: boolean;
};

const THREADS: Thread[] = [
  { initial: "M", name: "Maya Chen", preview: "Typing…", time: "1m", from: ["#bf5af2", "#8944ab"], active: true },
  { initial: "L", name: "Leo", preview: "You: haha yeah for sure", time: "3m", from: ["#64d2ff", "#0a84ff"] },
  { initial: "P", name: "Priya", preview: "You: omw", time: "22m", from: ["#ff9f0a", "#ff6482"] },
  { initial: "J", name: "Jordan", preview: "did you see this", time: "1h", from: ["#30d158", "#248a3d"] },
];

const NOTES: { initial: string; name: string; from: [string, string] }[] = [
  { initial: "+", name: "Your note", from: ["#3a3a3e", "#2c2c30"] },
  { initial: "J", name: "Justin", from: ["#64d2ff", "#0a84ff"] },
  { initial: "H", name: "Hayden", from: ["#ff9f0a", "#ff6482"] },
];

function Avatar({ initial, from, size }: { initial: string; from: [string, string]; size: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: `linear-gradient(180deg, ${from[0]}, ${from[1]})`,
      }}
    >
      {initial}
    </span>
  );
}

export function HeroPreview() {
  return (
    <div
      className="hidden w-[620px] shrink-0 overflow-hidden rounded-[18px] border shadow-2xl lg:block"
      style={{ background: C.bg, borderColor: C.line, color: C.ink }}
    >
      <div className="flex h-[420px]">
        {/* ── sidebar */}
        <div
          className="flex w-[230px] shrink-0 flex-col border-r p-3"
          style={{ borderColor: C.line, background: C.panel }}
        >
          {/* username + compose */}
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="text-[14px] font-bold">
              yourname <span style={{ color: C.muted }}>⌄</span>
            </span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>

          {/* search */}
          <div
            className="mb-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]"
            style={{ background: C.pill, color: C.muted }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            Search
          </div>

          {/* notes row */}
          <div className="mb-3 flex gap-3 px-1">
            {NOTES.map((n) => (
              <div key={n.name} className="flex w-[44px] flex-col items-center gap-1">
                <Avatar initial={n.initial} from={n.from} size={40} />
                <span className="w-full truncate text-center text-[9px]" style={{ color: C.muted }}>
                  {n.name}
                </span>
              </div>
            ))}
          </div>

          {/* Messages / Requests */}
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[12px] font-bold">Messages</span>
            <span className="text-[11px]" style={{ color: C.muted }}>
              Requests
            </span>
          </div>

          {/* threads */}
          <div className="space-y-0.5">
            {THREADS.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5"
                style={t.active ? { background: C.selected } : undefined}
              >
                <Avatar initial={t.initial} from={t.from} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold">{t.name}</div>
                  <div className="truncate text-[10.5px]" style={{ color: C.muted }}>
                    {t.preview} · {t.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── thread pane */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* header */}
          <div className="flex items-center gap-2.5 border-b px-3.5 py-2.5" style={{ borderColor: C.line }}>
            <Avatar initial="M" from={["#bf5af2", "#8944ab"]} size={30} />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold leading-tight">Maya Chen</div>
              <div className="text-[10.5px]" style={{ color: C.muted }}>
                @maya.chen
              </div>
            </div>
            <div className="flex items-center gap-3.5" style={{ color: C.ink }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m22 8-6 4 6 4V8Z" />
                <rect x="2" y="6" width="14" height="12" rx="2" />
              </svg>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
          </div>

          {/* bubbles */}
          <div className="flex flex-1 flex-col justify-end gap-[3px] px-3.5 pb-2">
            <div className="mb-1.5 text-center text-[9.5px] font-medium" style={{ color: C.muted }}>
              Today 10:36
            </div>
            <div className="flex justify-start">
              <span className="max-w-[70%] rounded-[15px] rounded-bl-[5px] px-3 py-1.5 text-[12px]" style={{ background: C.bubbleIn }}>
                you around this weekend?
              </span>
            </div>
            <div className="flex items-end gap-1.5">
              <Avatar initial="M" from={["#bf5af2", "#8944ab"]} size={18} />
              <span className="max-w-[70%] rounded-[15px] rounded-bl-[5px] px-3 py-1.5 text-[12px]" style={{ background: C.bubbleIn }}>
                thinking of grabbing food
              </span>
            </div>
            <div className="mt-1.5 flex justify-end">
              <span className="max-w-[70%] rounded-[15px] rounded-br-[5px] px-3 py-1.5 text-[12px] text-white" style={{ background: C.bubbleOut }}>
                yeah saturday works!
              </span>
            </div>
            <div className="flex justify-end">
              <span className="max-w-[70%] rounded-[15px] rounded-br-[5px] px-3 py-1.5 text-[12px] text-white" style={{ background: C.bubbleOut }}>
                where you thinking
              </span>
            </div>
            <div className="mt-0.5 text-right text-[9.5px]" style={{ color: C.muted }}>
              Seen just now
            </div>
          </div>

          {/* composer */}
          <div className="px-3.5 pb-3">
            <div
              className="flex items-center gap-2.5 rounded-full border px-3 py-2"
              style={{ borderColor: C.line }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01" />
                <path d="M15 9h.01" />
              </svg>
              <span className="flex-1 text-[12px]" style={{ color: C.muted }}>
                Message…
              </span>
              <div className="flex items-center gap-2.5" style={{ color: C.ink }}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <path d="M12 19v3" />
                </svg>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 1 1 8.5-8.5Z" />
                  <path d="M15 9c0 2-1.5 3-3 3s-3-1-3-3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
