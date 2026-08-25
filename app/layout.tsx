import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
import { HumanBehaviorInit } from "./HumanBehaviorInit";

export const metadata: Metadata = {
  title: "Konvo: DM’s Only",
  description: "Message on Instagram without the Feed, Explore, or Reels.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#b4d0ea",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <HumanBehaviorInit />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
