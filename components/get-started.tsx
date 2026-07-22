"use client";

import { useEffect, useState } from "react";
import { InstallButton } from "./install-button";

type Env = "unknown" | "standalone" | "mobile-browser" | "desktop";

const LOGIN_HREF = "/api/auth/instagram/login";

/**
 * Landing CTA stack. Phones must install the app before logging in: iOS
 * gives the home-screen app its own cookie jar, so a Safari login never
 * reaches the installed app. Gating login to the installed app guarantees
 * that reopening it always lands in Messages.
 */
export function GetStarted() {
  const [env, setEnv] = useState<Env>("unknown");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const mobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    setEnv(standalone ? "standalone" : mobile ? "mobile-browser" : "desktop");
  }, []);

  if (env === "unknown") {
    return <div className="mt-9 min-h-[140px] w-full" aria-hidden />;
  }

  if (env === "standalone") {
    return (
      <>
        <div className="mt-9 flex w-full flex-col gap-2.5">
          <a
            href={LOGIN_HREF}
            className="grid min-h-[52px] w-full place-items-center rounded-btn bg-amber text-[17px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get started
          </a>
        </div>
        <p className="mt-3.5 text-[13px] text-faint">
          You&rsquo;ll sign in on instagram.com &mdash; if it asks about a
          professional account, tap Change. You&rsquo;ll land right back here.
        </p>
      </>
    );
  }

  if (env === "mobile-browser") {
    return (
      <>
        <div className="mt-9 flex w-full flex-col gap-2.5">
          <InstallButton />
        </div>
        <p className="mt-3.5 text-[13px] text-faint">
          Add the app to your home screen first, then open it there to get
          started.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mt-9 flex w-full flex-col gap-2.5">
        <InstallButton />
        <a
          href={LOGIN_HREF}
          className="grid min-h-[52px] w-full place-items-center rounded-btn border border-line text-[17px] font-semibold text-ink transition-colors hover:bg-surface"
        >
          Get started
        </a>
      </div>
      <p className="mt-3.5 text-[13px] text-faint">
        On a phone, add the app first and get started inside it.
      </p>
    </>
  );
}
