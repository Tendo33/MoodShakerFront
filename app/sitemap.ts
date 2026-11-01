import type { MetadataRoute } from "next";
import { listPublishedSlugs } from "@/lib/db/drinks";
import { LOCALES } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/seo";
import { orEmpty } from "@/lib/summaries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const drinks = await orEmpty(listPublishedSlugs(), "sitemap");
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const path of ["/", "/questions", "/gallery"]) {
      entries.push({ url: absoluteUrl(path, locale), changeFrequency: "weekly" });
    }
    for (const drink of drinks) {
      entries.push({
        url: absoluteUrl(`/cocktail/${drink.slug}`, locale),
        lastModified: drink.publishedAt ?? undefined,
        changeFrequency: "monthly",
      });
    }
  }
  return entries;
}
