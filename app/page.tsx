import { headers } from "next/headers";
import { Landing } from "@/components/landing";
import { MobileLanding } from "@/components/mobile-landing";

/**
 * The in-app-browser sniff happens on the server so the warning is in the
 * first paint: an Instagram DM link opens in Instagram's own browser, where
 * TestFlight redemption usually fails.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mobile?: string }>;
}) {
  const ua = (await headers()).get("user-agent") ?? "";
  const inApp = /instagram|fbav|fban|line\/|micromessenger/i.test(ua);
  // Phones get the sky landing straight to the App Store; desktop keeps the
  // split-hero page. ?mobile=1 forces the phone view for desktop-browser QA.
  const mobile = /iphone|ipad|ipod|android/i.test(ua) || (await searchParams).mobile === "1";

  if (mobile) return <MobileLanding />;
  return <Landing inAppBrowser={inApp} desktop />;
}
