import type { MetadataRoute } from "next";
import { getCocktailSlugs } from "@/lib/cocktail-data";
import { LOCALES, localizePathname } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/i18n/metadata";
import { createLogger } from "@/utils/logger";

const logger = createLogger("Sitemap");

/**
 * Rendered per request, not at build time.
 *
 * Next prerenders a sitemap statically by default. The build runs with a
 * placeholder `DATABASE_URL` and cannot reach a database, so `getCocktailSlugs()`
 * throws, the catch below logs it, and the sitemap ships with the static routes
 * only — zero cocktails, silently. Observed directly: a build with the database
 * asleep produced 6 URLs where a build that happened to catch it awake produced 32.
 *
 * A crawler reads this rarely, so a query per request costs nothing worth saving,
 * and it removes the dependency on build-time luck. Same failure mode as
 * `generateStaticParams` on a database-backed page, which this project already hit.
 */
export const dynamic = "force-dynamic";

/**
 * Sitemap covering both locales.
 *
 * The project had no sitemap and no `robots.txt`, so every cocktail page relied on
 * a crawler finding it by following links from the gallery.
 *
 * Each entry carries `alternates.languages` so a crawler is told the two locale
 * URLs are the same page rather than duplicates.
 */

/** Routes that exist in both locales, with how often they change. */
const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/gallery", changeFrequency: "daily", priority: 0.9 },
  { path: "/questions", changeFrequency: "monthly", priority: 0.8 },
];

function entriesFor(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale === "cn" ? "zh-CN" : "en"] =
      SITE_URL + localizePathname(path, locale);
  }

  return LOCALES.map((locale) => ({
    url: SITE_URL + localizePathname(path, locale),
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((route) =>
    entriesFor(route.path, route.changeFrequency, route.priority),
  );

  try {
    const slugs = await getCocktailSlugs();
    for (const slug of slugs) {
      entries.push(...entriesFor(`/cocktail/${slug}`, "weekly", 0.7));
    }
  } catch (error) {
    // A database outage should still leave a usable sitemap of static routes,
    // rather than returning a 500 that a crawler may cache as "no sitemap".
    logger.error("Could not list cocktails for the sitemap", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return entries;
}
