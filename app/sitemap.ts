import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://konvoinstall.com";
  return [
    { url: base, lastModified: new Date("2026-09-03"), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/instagram-dms-only`, lastModified: new Date("2026-09-03"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/privacy`, lastModified: new Date("2026-08-11"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date("2026-08-11"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
