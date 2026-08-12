import { headers } from "next/headers";
import { Landing } from "@/components/landing";

/**
 * The front door is the landing page again, with one job: email, then the
 * TestFlight link. The stripped beta funnel is still in the tree at
 * components/beta-funnel.tsx and comes back by swapping the component below.
 *
 * The in-app-browser sniff happens on the server so the warning is in the
 * first paint: an Instagram DM link opens in Instagram's own browser, where
 * TestFlight redemption usually fails.
 */
export default async function Home() {
  const ua = (await headers()).get("user-agent") ?? "";
  const inApp = /instagram|fbav|fban|line\/|micromessenger/i.test(ua);
  // Desktop gets the three-step install (email, extension, platform); a phone
  // gets the TestFlight beta, which is the only thing it can actually run.
  const mobile = /iphone|ipad|ipod|android/i.test(ua);

  return <Landing inAppBrowser={inApp} desktop={!mobile} />;
}
