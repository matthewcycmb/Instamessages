"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type State = "installed" | "promptable" | "ios" | "manual";

/**
 * Install-as-app helper. Android/Chrome fires beforeinstallprompt, so we can
 * show a real install button. iOS never does; Apple only allows install via
 * Share → Add to Home Screen, so we show instructions there.
 */
export function InstallApp() {
  const [state, setState] = useState<State>("manual");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setState("installed");
      return;
    }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setState(isIos ? "ios" : "manual");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setState("promptable");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setState("installed");
    setDeferred(null);
  }

  if (state === "installed") {
    return <p className="text-sm text-muted">Installed. You&rsquo;re using the app. ✓</p>;
  }

  if (state === "promptable") {
    return (
      <button
        onClick={install}
        className="rounded-btn bg-amber px-5 py-2.5 text-sm text-white transition-opacity hover:opacity-90"
      >
        Install Instachat
      </button>
    );
  }

  if (state === "ios") {
    return (
      <ol className="space-y-2">
        {["Open this site in Safari", "Tap the Share button", "Tap “Add to Home Screen”"].map(
          (item, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-muted">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              {item}
            </li>
          )
        )}
      </ol>
    );
  }

  return (
    <p className="text-sm text-muted">
      In your browser&rsquo;s menu, choose &ldquo;Install app&rdquo; or &ldquo;Add to Home
      Screen&rdquo;. It then opens full-screen like a native app.
    </p>
  );
}
