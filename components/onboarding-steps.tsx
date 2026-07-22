import { GetStarted } from "./get-started";
import { HeroPreview } from "./hero-preview";

/**
 * Landing screen. The CTA stack (GetStarted) gates phones behind install:
 * browsers only get Add to Home Screen, the installed app gets the login
 * button. On desktop it sits beside a product preview so visitors see what
 * it is.
 */
export function OnboardingSteps({ error }: { error?: string; initialStep?: number }) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-10 pt-[max(1.1rem,env(safe-area-inset-top))]">
      {error && (
        <div className="mx-auto mb-6 w-full max-w-md rounded-2xl bg-ember/10 px-4 py-3 text-sm font-semibold text-ember">
          {error}
        </div>
      )}

      <div className="rise flex flex-1 flex-col items-center justify-center gap-14 lg:flex-row lg:gap-16">
        <div className="flex w-full max-w-[380px] flex-col items-center text-center lg:items-start lg:text-left">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber">
            <svg
              className="h-8 w-8 text-white"
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
          </div>
          <h1 className="mt-7 text-[32px] leading-tight sm:text-[40px]">Instamessages</h1>
          <p className="mt-2 text-[17px] text-muted">
            Your Instagram DMs. Without Instagram.
          </p>
          <GetStarted />
        </div>

        <HeroPreview />
      </div>
    </main>
  );
}
