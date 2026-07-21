"use client";

import { useState } from "react";

/**
 * Pre-connect onboarding per design 2a/2b: Welcome → Step 1 (Creator
 * account) → Step 2 (Connect). Step visuals are optional: drop
 * creator.(mp4|gif|png) into public/onboarding/ and it appears.
 */
export function OnboardingSteps({
  error,
  initialStep = 0,
}: {
  error?: string;
  initialStep?: number;
}) {
  const [step, setStep] = useState(initialStep);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-10 pt-[max(1.1rem,env(safe-area-inset-top))]">
      {error && (
        <div className="mx-auto mb-6 w-full max-w-md rounded-2xl bg-ember/10 px-4 py-3 text-sm font-semibold text-ember">
          {error}
        </div>
      )}

      {step === 0 && (
        <div className="rise mx-auto flex w-full max-w-[380px] flex-1 flex-col items-center justify-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber">
            <ChatIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-7 text-[32px] leading-tight sm:text-[40px]">Instamessages</h1>
          <p className="mt-2 text-[17px] text-muted">
            Your Instagram DMs. Without Instagram.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-9 min-h-[52px] w-full rounded-btn bg-amber text-[17px] text-white transition-opacity hover:opacity-90"
          >
            Get started
          </button>
          <p className="mt-3.5 text-[13px] text-faint">Takes about 2 minutes.</p>
        </div>
      )}

      {step === 1 && (
        <StepChrome step={1} onBack={() => setStep(0)}>
          <div className="flex flex-col gap-10 md:flex-row md:items-center">
            <div className="min-w-0 md:max-w-[520px] md:flex-1">
              <h1 className="text-[28px] leading-[1.12] sm:text-[40px] sm:leading-[1.1]">
                Switch to a Creator account.
              </h1>

              <div className="mt-6 overflow-hidden rounded-2xl bg-surface">
                <StepRow n={1}>
                  Instagram → <strong className="font-semibold text-ink">Settings</strong>
                </StepRow>
                <StepRow n={2}>
                  Scroll down to find{" "}
                  <strong className="font-semibold text-ink">Account type and tools</strong>
                </StepRow>
                <StepRow n={3}>
                  <strong className="font-semibold text-ink">Switch to professional account</strong>
                </StepRow>
                <StepRow n={4} last>
                  Choose <strong className="font-semibold text-ink">Creator</strong> &amp; choose
                  any category
                </StepRow>
              </div>

              <div className="mt-4 md:hidden">
                <StepMedia base="/onboarding/creator" />
              </div>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href="https://www.instagram.com/accounts/convert_to_professional_account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid min-h-[50px] flex-1 place-items-center rounded-btn bg-surface text-[16px] font-semibold text-amber transition-opacity hover:opacity-80"
                >
                  Open Instagram settings
                </a>
                <button
                  onClick={() => setStep(2)}
                  className="min-h-[50px] flex-1 rounded-btn bg-amber text-[16px] text-white transition-opacity hover:opacity-90"
                >
                  Continue
                </button>
              </div>

              <details className="mt-5 text-center md:text-left">
                <summary className="text-[13px] text-faint">Why a Creator account?</summary>
                <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted md:mx-0">
                  Instagram only shares messages with apps on Creator accounts. Your profile stays
                  the same. You can switch back whenever you want.
                </p>
              </details>
              <details className="mt-2 text-center md:text-left">
                <summary className="text-[13px] text-faint">One more switch to check</summary>
                <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed text-muted md:mx-0">
                  If messages don&rsquo;t show up later: Instagram → Settings → Messages and story
                  replies → Message controls → allow access for connected tools.
                </p>
              </details>
            </div>

            <div className="hidden w-[400px] shrink-0 md:block">
              <StepMedia base="/onboarding/creator" />
            </div>
          </div>
        </StepChrome>
      )}

      {step === 2 && (
        <StepChrome step={2} onBack={() => setStep(1)}>
          <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
            <h1 className="text-[30px] leading-[1.1] sm:text-[40px]">Connect your Instagram.</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted sm:text-[16px]">
              Log in and approve. We read and reply to your DMs. We never post.
            </p>
            <a
              href="/api/auth/instagram/login"
              className="mt-8 grid min-h-[52px] w-full place-items-center rounded-btn bg-amber text-[17px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Connect Instagram
            </a>
            <p className="mt-3.5 text-center text-[13px] text-faint">
              We&rsquo;ll confirm your account is a Creator.
            </p>
          </div>
        </StepChrome>
      )}
    </main>
  );
}

function StepChrome({
  step,
  onBack,
  children,
}: {
  step: number;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rise flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center pt-6">{children}</div>
      <div className="mt-auto pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={onBack} className="text-[15px] font-medium text-amber">
            ‹ Back
          </button>
          <span className="text-[12px] font-medium tracking-wide text-faint">
            STEP {step} OF 2
          </span>
        </div>
        <div className="h-[3px] rounded-full bg-surface">
          <div
            className="h-[3px] rounded-full bg-amber transition-all"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StepRow({
  n,
  last,
  children,
}: {
  n: number;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 px-5 py-4 ${last ? "" : "border-b border-line"}`}
    >
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-amber text-[13px] font-semibold text-white">
        {n}
      </span>
      <span className="text-[15px] text-muted sm:text-[16px]">{children}</span>
    </div>
  );
}

/**
 * Optional step visual. Tries base.mp4 (muted loop), then base.gif, then
 * base.png from public/onboarding/. Renders a labeled placeholder frame if
 * nothing exists yet, per the design's image slots.
 */
function StepMedia({ base }: { base: string }) {
  const [idx, setIdx] = useState(0);
  const candidates = [`${base}.mp4`, `${base}.gif`, `${base}.png`];
  const advance = () => setIdx((i) => i + 1);

  if (idx >= candidates.length) {
    return (
      <div className="grid h-[170px] w-full place-items-center rounded-2xl border border-dashed border-line md:h-[280px]">
        <span className="px-6 text-center text-[12px] text-faint">
          Settings walkthrough GIF
        </span>
      </div>
    );
  }
  const src = candidates[idx];
  if (src.endsWith(".mp4")) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onError={advance}
        className="w-full rounded-2xl border border-line"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- optional asset, falls through on 404
    <img src={src} alt="" onError={advance} className="w-full rounded-2xl border border-line" />
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
