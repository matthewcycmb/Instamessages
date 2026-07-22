"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

let started = false;

/**
 * Initializes PostHog in the browser and records a pageview on every route
 * change. Anonymous by default; call posthog.identify(...) once we know who
 * the user is (see analytics.ts). No-ops if the key isn't configured.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || started) return;
    started = true;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // we send them manually on route change
      capture_pageleave: true,
      person_profiles: "identified_only",
    });
  }, []);

  return (
    <>
      <PageviewTracker />
      {children}
    </>
  );
}

function PageviewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    // Collapse thread ids so /t/<uuid> aggregates as one page.
    const normalized = pathname.replace(/^\/t\/[^/]+/, "/t/[id]");
    posthog.capture("$pageview", { $current_url: window.location.origin + normalized });
  }, [pathname, search]);

  return null;
}
