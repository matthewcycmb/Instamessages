"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

let started = false;

/**
 * Initializes PostHog in the browser. Anonymous by default; call
 * posthog.identify(...) once we know who the user is (see analytics.ts).
 * No-ops if the key isn't configured.
 *
 * Pageviews are posthog-js's job, not ours. A manual <PageviewTracker> used to
 * send them from a child effect — which React runs *before* the parent effect
 * that calls init(), so every capture was dropped and production recorded zero
 * pageviews. "history_change" covers the first load and SPA route changes.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || started) return;
    started = true;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <>{children}</>;
}
