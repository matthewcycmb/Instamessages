import { headers } from "next/headers";
import { Landing } from "@/components/landing";
import { MacOnly } from "@/components/mac-only";

export default async function Home() {
  // Server-side UA sniff so the first paint shows the right screen.
  const ua = (await headers()).get("user-agent") ?? "";
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  const mac = /macintosh|mac os x/i.test(ua) && !/iphone|ipad|ipod/i.test(ua);

  // Phones get the real landing page (it stacks below 900px); only non-Mac
  // desktops still get the Mac-only screen, because the app they would
  // download genuinely does not run there.
  if (!mac && !mobile) return <MacOnly />;
  return <Landing />;
}
