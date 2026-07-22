"use client";

import { useEffect, useState } from "react";
import { InstallButton } from "./install-button";
import { ExtensionButton } from "./extension-button";

type Env = "unknown" | "standalone" | "mobile-browser" | "desktop-chromium" | "desktop-other";

const LOGIN_HREF = "/api/auth/instagram/login";

/**
 * Landing CTA stack. Install is mandatory everywhere: browsers only get
 * install steps (phones: the app; desktop Chromium: extension first, then
 * the app) — the login button exists only inside the installed app. iOS
 * needs this because the home-screen app has its own cookie jar; on desktop
 * it enforces the product rule that Instachat is used as an app.
 */
export function GetStarted() {
  const [env, setEnv] = useState<Env>("unknown");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const mobile = /iphone|ipad|ipod|android/i.test(ua);
    const chromium = /chrome|chromium|crios|edg|arc/i.test(ua);
    setEnv(
      standalone
        ? "standalone"
        : mobile
          ? "mobile-browser"
          : chromium
            ? "desktop-chromium"
            : "desktop-other"
    );
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

  if (env === "desktop-chromium") {
    return (
      <>
        <div className="mt-9 flex w-full flex-col gap-2.5">
          <ExtensionButton step={1} />
          <InstallButton step={2} />
        </div>
        <p className="mt-3.5 text-[13px] text-faint">
          Both are required. Then open the app and tap Get started to connect
          your Instagram.
        </p>
      </>
    );
  }

  // Desktop, non-Chromium (Safari/Firefox): no extension exists; app only.
  return (
    <>
      <div className="mt-9 flex w-full flex-col gap-2.5">
        <InstallButton />
      </div>
      <p className="mt-3.5 text-[13px] text-faint">
        Install the app, then open it and tap Get started to connect your
        Instagram.
      </p>
    </>
  );
}
