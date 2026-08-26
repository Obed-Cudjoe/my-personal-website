import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = [
    "", "/shop", "/about", "/faq", "/contact", "/terms", "/privacy",
    "/refunds", "/delivery", "/free/free-prompts", "/free/free-chapter",
  ];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "daily" : "monthly",
    priority: r === "" ? 1 : 0.7,
  }));
  for (const p of catalog.all()) {
    entries.push({
      url: `${base}/products/${p.productType}/${p.id}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }
  return entries;
}
