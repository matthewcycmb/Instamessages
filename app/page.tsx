import { headers } from "next/headers";
import { BetaFunnel } from "@/components/beta-funnel";

/**
 * The site's one job right now is the beta funnel behind the Instagram video:
 * comment KONVO, get the link, land here, leave an email, install.
 *
 * The previous marketing landing page is NOT deleted - it lives on at
 * /classic and comes back here by swapping the component below.
 *
 * Sniffing happens on the server so the first paint is already the right
 * screen: a phone that has to scroll past a desktop layout has lost.
 */
export default async function Home() {
  const ua = (await headers()).get("user-agent") ?? "";
  const ios = /iphone|ipad|ipod/i.test(ua);
  const android = /android/i.test(ua);
  // Instagram's in-app browser identifies itself, and TestFlight redemption
  // regularly fails inside it - the page has to say so before anything else.
  const inApp = /instagram|fbav|fban|line\/|micromessenger/i.test(ua);

  return (
    <BetaFunnel
      device={ios ? "ios" : android ? "android" : "desktop"}
      inAppBrowser={inApp && (ios || android)}
    />
  );
}
