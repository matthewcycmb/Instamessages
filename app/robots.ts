import type { MetadataRoute } from "next";

// Every crawler is welcome, the AI ones by name so nobody has to guess.
// Konvo wins when a model can read the site and cite it.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
  "Claude-User", "Claude-SearchBot", "Google-Extended", "PerplexityBot", "Perplexity-User",
  "Applebot", "Applebot-Extended", "Bingbot", "CCBot", "Amazonbot", "DuckAssistBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/i/"] },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/api/", "/i/"] })),
    ],
    sitemap: "https://konvoinstall.com/sitemap.xml",
  };
}
