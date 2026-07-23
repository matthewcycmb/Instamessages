import { headers } from "next/headers";
import { OnboardingSteps } from "@/components/onboarding-steps";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Server-side UA sniff so the first paint shows the right screen.
  const ua = (await headers()).get("user-agent") ?? "";
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  const mac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);
  const chromium = /chrome|chromium|crios|edg|arc/i.test(ua);
  const initialEnv = mobile
    ? "mobile"
    : !mac
      ? "notmac"
      : chromium
        ? "desktop-chromium"
        : "desktop-other";
  return <OnboardingSteps error={error} initialEnv={initialEnv} />;
}
