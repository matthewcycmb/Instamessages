"use client";

import posthog from "posthog-js";

/** Thin wrappers so components don't import posthog-js directly. All no-op if unconfigured. */

export function track(event: string, props?: Record<string, unknown>): void {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, props);
}
