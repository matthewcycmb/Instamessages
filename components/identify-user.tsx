"use client";

import { useEffect } from "react";
import { identify, track } from "@/lib/analytics";

/**
 * Ties analytics to the Instagram username and fires the signup event once
 * per browser. Lives on the inbox since connect now lands directly there.
 */
export function IdentifyUser({ username }: { username: string }) {
  useEffect(() => {
    identify(username);
    const key = "im:connected-tracked";
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      track("instagram_connected", { username });
    }
  }, [username]);
  return null;
}
