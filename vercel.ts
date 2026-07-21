import { type VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  crons: [
    // Weekly: refresh long-lived Instagram tokens + apply message retention.
    { path: "/api/cron/refresh-tokens", schedule: "0 9 * * 1" },
  ],
};
