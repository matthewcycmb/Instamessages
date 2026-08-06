import { headers } from "next/headers";
import { Landing } from "@/components/landing";
import { MacOnly } from "@/components/mac-only";

/**
 * The original marketing landing page, kept exactly as it was while the home
 * route runs the beta funnel. Nothing here is deprecated: swap the component
 * in app/page.tsx to put it back on the front door.
 */
export default async function Classic() {
  const ua = (await headers()).get("user-agent") ?? "";
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  const mac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);

  if (!mac && !mobile) return <MacOnly />;
  return <Landing />;
}
