"use client";

/**
 * In-memory cache of thread data so switching conversations renders
 * instantly (no blank frame), with a background revalidate. Rows prime the
 * cache on hover, so by click time the data is usually already here.
 */

export type ThreadPayload = {
  conversation: unknown;
  messages: unknown[];
};

const cache = new Map<string, ThreadPayload>();
const inflight = new Map<string, Promise<ThreadPayload | null>>();

export function getCachedThread(id: string): ThreadPayload | undefined {
  return cache.get(id);
}

export function setCachedThread(id: string, data: ThreadPayload): void {
  cache.set(id, data);
}

/** Fetch and cache a thread. Deduped; safe to call on hover for every row. */
export function primeThread(id: string): Promise<ThreadPayload | null> {
  if (cache.has(id)) return Promise.resolve(cache.get(id)!);
  const existing = inflight.get(id);
  if (existing) return existing;

  const p = fetch(`/api/conversations/${id}/messages`)
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as ThreadPayload;
      cache.set(id, data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, p);
  return p;
}
