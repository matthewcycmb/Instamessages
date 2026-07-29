import { headers } from "next/headers";
import { Landing } from "@/components/landing";
import { MobileComingSoon } from "@/components/mobile-coming-soon";
import { MacOnly } from "@/components/mac-only";

export default async function Home() {
  // Server-side UA sniff so the first paint shows the right screen.
  const ua = (await headers()).get("user-agent") ?? "";
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  const mac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);

  // The redesign is desktop-only (min-width 1200px, as drawn); mobile and
  // non-Mac keep the screens they already had.
  if (mobile) return <MobileComingSoon />;
  if (!mac) return <MacOnly />;
  return <Landing />;
}
