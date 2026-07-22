"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { bubbleTimestamp, replyWindow } from "@/lib/format";
import { getCachedThread, setCachedThread } from "@/lib/thread-cache";
import { GradientAvatar } from "./gradient-avatar";

type Attachment = { type?: string; payload?: { url?: string; title?: string }; url?: string };

type Msg = {
  id: string;
  mid: string | null;
  is_from_me: boolean;
  text: string | null;
  attachments: Attachment[] | null;
  sent_at: string;
};

type Convo = {
  id: string;
  peer_username: string | null;
  peer_name: string | null;
  peer_avatar_url: string | null;
  last_inbound_at: string | null;
};

const GAP_MS = 3_600_000; // new timestamp cluster after 1h of silence

export function Chat({ conversationId }: { conversationId: string }) {
  const cached = getCachedThread(conversationId);
  const [convo, setConvo] = useState<Convo | null>((cached?.conversation as Convo) ?? null);
  const [messages, setMessages] = useState<Msg[]>((cached?.messages as Msg[]) ?? []);
  const [loaded, setLoaded] = useState(Boolean(cached));
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [, forceTick] = useState(0); // re-render for the live countdown
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const appendMessage = useCallback((msg: Msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id || (msg.mid && m.mid === msg.mid))) return prev;
      return [...prev, msg].sort((a, b) => a.sent_at.localeCompare(b.sent_at));
    });
  }, []);

  // Cache-first load: render instantly from cache, revalidate in background.
  useEffect(() => {
    let cancelled = false;
    const hit = getCachedThread(conversationId);
    if (hit) {
      setConvo(hit.conversation as Convo);
      setMessages(hit.messages as Msg[]);
      setLoaded(true);
    } else {
      setConvo(null);
      setMessages([]);
      setLoaded(false);
    }
    (async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setConvo(data.conversation);
      setMessages(data.messages ?? []);
      setLoaded(true);
      setCachedThread(conversationId, data);
      fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Keep the cache current so returning to this thread is instant.
  useEffect(() => {
    if (convo) setCachedThread(conversationId, { conversation: convo, messages });
  }, [conversationId, convo, messages]);

  // Realtime: subscribe to INSERTs on this conversation via a minted JWT.
  useEffect(() => {
    let active = true;

    (async () => {
      const tokenRes = await fetch("/api/realtime-token");
      if (!tokenRes.ok || !active) return;
      const { token } = await tokenRes.json();

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      supabase.realtime.setAuth(token);
      supabaseRef.current = supabase;

      supabase
        .channel(`messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const msg = payload.new as Msg & { is_from_me: boolean };
            appendMessage(msg);
            if (!msg.is_from_me) {
              setConvo((c) => (c ? { ...c, last_inbound_at: msg.sent_at } : c));
              fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(
                () => {}
              );
            }
          }
        )
        .subscribe();
    })();

    return () => {
      active = false;
      supabaseRef.current?.removeAllChannels();
    };
  }, [conversationId, appendMessage]);

  // Tick the countdown every 30s.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      if (data.message) appendMessage(data.message);
      setText("");
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  const name = convo?.peer_name || (convo?.peer_username ? `@${convo.peer_username}` : "…");
  const win = replyWindow(convo?.last_inbound_at ?? null);
  const lastMsg = messages[messages.length - 1];

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center gap-2.5 border-b border-line px-4 pb-3 pt-[max(0.85rem,env(safe-area-inset-top))]">
        <Link href="/" aria-label="Back to messages" className="-ml-1 p-1 text-amber md:hidden">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <GradientAvatar name={name} url={convo?.peer_avatar_url ?? null} size={36} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight">{name}</h1>
          <p className={`truncate text-[12px] ${win.open ? "text-amber" : "text-faint"}`}>
            {convo?.peer_name && convo?.peer_username ? `@${convo.peer_username} · ` : ""}
            {win.label}
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-end gap-[2px] overflow-y-auto px-4 py-4">
        {!loaded && messages.length === 0 && (
          <div className="space-y-2 pb-2">
            <div className="h-9 w-44 animate-pulse rounded-[18px] bg-surface-2/70" />
            <div className="h-9 w-56 animate-pulse rounded-[18px] bg-surface-2/70" />
            <div className="ml-auto h-9 w-40 animate-pulse rounded-[18px] bg-amber/25" />
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const gapBefore =
            !prev || new Date(m.sent_at).getTime() - new Date(prev.sent_at).getTime() > GAP_MS;
          const gapAfter =
            !next || new Date(next.sent_at).getTime() - new Date(m.sent_at).getTime() > GAP_MS;
          const groupedWithPrev = !gapBefore && prev?.is_from_me === m.is_from_me;
          const groupedWithNext = !gapAfter && next?.is_from_me === m.is_from_me;
          return (
            <div key={m.id} className={groupedWithPrev ? "" : "mt-3 first:mt-0"}>
              {gapBefore && (
                <p className="mb-2.5 pt-1 text-center text-[11px] font-medium text-faint">
                  {bubbleTimestamp(m.sent_at)}
                </p>
              )}
              <Bubble msg={m} groupedWithPrev={groupedWithPrev} groupedWithNext={groupedWithNext} />
            </div>
          );
        })}
        {lastMsg?.is_from_me && (
          <p className="mt-1 text-right text-[11px] text-faint">Delivered</p>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1.5">
        {sendError && <p className="mb-2 text-sm font-semibold text-ember">{sendError}</p>}
        {win.open ? (
          <div className="flex items-end rounded-[22px] border border-line py-1.5 pl-4 pr-1.5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message"
              className="max-h-32 min-h-[28px] flex-1 resize-none bg-transparent py-0.5 text-[15px] placeholder:text-faint focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber transition-opacity hover:opacity-90 disabled:opacity-30"
              aria-label="Send"
            >
              <svg
                className="h-3.5 w-3.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m5 12 7-7 7 7" />
                <path d="M12 19V5" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface px-4 py-3 text-center text-[13px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Replies are closed for now.</span> Instagram
            gives connected apps 24 hours after their last message. The box unlocks the moment{" "}
            {name === "…" ? "they" : name} messages you again.
          </div>
        )}
      </footer>
    </div>
  );
}

function Bubble({
  msg,
  groupedWithPrev,
  groupedWithNext,
}: {
  msg: Msg;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
}) {
  const attachments = msg.attachments ?? [];
  // iMessage grouping: the corner facing an adjacent same-sender bubble tightens to 4px.
  const r = (tight: boolean) => (tight ? "4px" : "18px");
  const borderRadius = msg.is_from_me
    ? `18px ${r(groupedWithPrev)} ${r(groupedWithNext)} 18px`
    : `${r(groupedWithPrev)} 18px 18px ${r(groupedWithNext)}`;

  return (
    <div className={`flex ${msg.is_from_me ? "justify-end" : "justify-start"}`}>
      <div
        style={{ borderRadius }}
        className={`max-w-[75%] px-3.5 py-2 text-[15px] leading-[1.35] md:max-w-[55%] ${
          msg.is_from_me ? "bg-amber text-white" : "bg-surface-2 text-ink"
        }`}
      >
        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
        {attachments.map((a, i) => (
          <AttachmentView key={i} attachment={a} fromMe={msg.is_from_me} />
        ))}
      </div>
    </div>
  );
}

function shareLabel(type: string): string {
  if (type.includes("story")) return "Shared a story";
  if (type.includes("reel")) return "Shared a reel";
  if (type === "share") return "Shared a post";
  return "Shared an attachment";
}

function AttachmentView({ attachment, fromMe }: { attachment: Attachment; fromMe: boolean }) {
  const url = attachment.payload?.url ?? attachment.url;
  const type = attachment.type ?? "";

  if (url && (type.includes("image") || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url))) {
    // eslint-disable-next-line @next/next/no-img-element -- expiring Instagram CDN URL
    return <img src={url} alt="Attachment" className="mt-1 max-h-72 rounded-xl" />;
  }
  if (url) {
    // Phones get an inert label: tapping through would open instagram.com
    // (stories/reels/posts), the exact surface this app exists to avoid.
    // Desktop keeps the link.
    return (
      <>
        <p
          className={`mt-1 block text-[13px] italic md:hidden ${
            fromMe ? "text-white/70" : "text-faint"
          }`}
        >
          {shareLabel(type)} &middot; view on desktop
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-1 hidden text-[14px] font-semibold underline underline-offset-2 md:block ${
            fromMe ? "text-white" : "text-amber"
          }`}
        >
          {type ? `View ${type.replace(/_/g, " ")}` : "View attachment"}
        </a>
      </>
    );
  }
  return (
    <p className={`mt-1 text-[13px] italic ${fromMe ? "text-white/70" : "text-faint"}`}>
      Attachment unavailable
    </p>
  );
}
