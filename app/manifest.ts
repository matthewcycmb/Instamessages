import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Instamessages",
    short_name: "Instamessages",
    description: "Your friends' Instagram DMs — without the feed.",
    start_url: "/",
    display: "standalone",
    background_color: "#16110d",
    theme_color: "#16110d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
