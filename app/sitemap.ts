import type { MetadataRoute } from "next";

const baseUrl = "https://nepick.kr";

const routes = [
  "",
  "/auth/login",
  "/auth/terms",
  "/home",
  "/record",
  "/mypick",
  "/profile",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
