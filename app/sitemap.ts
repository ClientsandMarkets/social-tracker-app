import type { MetadataRoute } from "next";

const BASE_URL = "https://social-tracker-six.vercel.app";
const ROUTES = ["", "/list", "/backlog", "/archive"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.6,
  }));
}
