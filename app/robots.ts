import type { MetadataRoute } from "next";

const BASE_URL = "https://social-tracker-six.vercel.app";

// Explicit opt-in: this tracker has no login, so being crawlable is a
// deliberate choice (made with that tradeoff flagged), not an oversight.
// Named entries for the major AI crawlers are listed alongside the
// wildcard rule so intent is visible in the file itself, not just implied
// by the "*" allow.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
