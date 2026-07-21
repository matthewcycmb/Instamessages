"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { bubbleTimestamp, replyWindow } from "@/lib/format";

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

export function Chat({ conversationId }: { conversationId: string }) {
  const [convo, setConvo] = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
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

  // Initial load + mark read.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setConvo(data.conversation);
      setMessages(data.messages ?? []);
      fetch(`/api/conversations/${conversationId}/read`, { method: "POST" }).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

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

  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="Back to conversations"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold leading-tight">{name}</h1>
          <p className={`text-xs ${win.open ? "text-amber" : "text-faint"}`}>{win.label}</p>
        </div>
        {win.open && (
          <span className="h-2 w-2 rounded-full bg-amber" aria-hidden title="Reply window open" />
        )}
      </header>

      <main className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showStamp =
            !prev || new Date(m.sent_at).getTime() - new Date(prev.sent_at).getTime() > 3_600_000;
          return (
            <div key={m.id}>
              {showStamp && (
                <p className="py-3 text-center text-[11px] uppercase tracking-widest text-faint">
                  {bubbleTimestamp(m.sent_at)}
                </p>
              )}
              <Bubble msg={m} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {sendError && <p className="mb-2 text-sm text-ember">{sendError}</p>}
        {win.open ? (
          <div className="flex items-end gap-2">
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
              placeholder={`Message ${name}`}
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-line bg-surface px-4 py-2.5 text-[15px] placeholder:text-faint focus:border-amber focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-bold text-bubble-ink transition-transform hover:scale-105 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #e8963e, #d9552f)" }}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center text-sm leading-relaxed text-muted">
            <span className="font-bold text-ink">Reply window closed.</span> Instagram only lets
            connected apps reply within 24 hours of their last message — the composer unlocks the
            moment {name === "…" ? "they" : name} messages you again.
          </div>
        )}
      </footer>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const attachments = msg.attachments ?? [];
  return (
    <div className={`bubble-in flex ${msg.is_from_me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug ${
          msg.is_from_me ? "rounded-br-lg text-bubble-ink" : "rounded-bl-lg bg-surface-2 text-ink"
        }`}
        style={
          msg.is_from_me ? { background: "linear-gradient(135deg, #e8963e, #d9552f)" } : undefined
        }
      >
        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
        {attachments.map((a, i) => (
          <AttachmentView key={i} attachment={a} fromMe={msg.is_from_me} />
        ))}
      </div>
    </div>
  );
}

function AttachmentView({ attachment, fromMe }: { attachment: Attachment; fromMe: boolean }) {
  const url = attachment.payload?.url ?? attachment.url;
  const type = attachment.type ?? "";

  if (url && (type.includes("image") || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url))) {
    // eslint-disable-next-line @next/next/no-img-element -- expiring Instagram CDN URL
    return <img src={url} alt="Attachment" className="mt-1 max-h-72 rounded-2xl" />;
  }
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-1 block text-sm underline underline-offset-2 ${fromMe ? "" : "text-amber"}`}
      >
        {type ? `View ${type.replace(/_/g, " ")}` : "View attachment"}
      </a>
    );
  }
  return <p className={`mt-1 text-sm italic ${fromMe ? "opacity-70" : "text-faint"}`}>Attachment unavailable</p>;
}
