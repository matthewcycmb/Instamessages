import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app's cage fetches this file from the instagram.com origin, so it
  // needs CORS. No-store: a hotfix that clients cache defeats its purpose.
  async headers() {
    return [
      {
        source: "/cage-patch.json",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
