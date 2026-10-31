import type { Metadata } from "next";
import { HTML_LANG, LOCALES, localizePath, type Locale } from "@/lib/i18n";
import type { RecipeView } from "@/lib/domain/recipe";

export const SITE_URL = (process.env.SITE_URL || "https://moodshaker.de").replace(/\/$/, "");

export function absoluteUrl(path: string, locale: Locale): string {
  return SITE_URL + localizePath(path, locale);
}

export function pageMetadata(options: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const languages: Record<string, string> = { "x-default": absoluteUrl(options.path, "cn") };
  for (const locale of LOCALES) languages[HTML_LANG[locale]] = absoluteUrl(options.path, locale);

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: absoluteUrl(options.path, options.locale), languages },
    openGraph: {
      type: "website",
      siteName: "MoodShaker",
      title: options.title,
      description: options.description,
      url: absoluteUrl(options.path, options.locale),
      locale: HTML_LANG[options.locale].replace("-", "_"),
      ...(options.image && { images: [{ url: options.image }] }),
    },
    twitter: { card: options.image ? "summary_large_image" : "summary" },
    ...(options.noIndex && { robots: { index: false, follow: false } }),
  };
}

/** "5 分钟" / "5 min" → "PT5M". Null when no number can be found. */
export function toIsoDuration(text: string): string | null {
  const amount = Number(text.match(/\d+/)?.[0]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return /hour|hr|小时/i.test(text) ? `PT${amount}H` : `PT${amount}M`;
}

export function recipeJsonLd(recipe: RecipeView, slug: string, locale: Locale, image: string | null) {
  const prepTime = toIsoDuration(recipe.timeRequired);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    url: absoluteUrl(`/cocktail/${slug}`, locale),
    inLanguage: HTML_LANG[locale],
    recipeCategory: "Cocktail",
    recipeYield: "1",
    author: { "@type": "Organization", name: "MoodShaker", url: SITE_URL },
    ...(image && { image: [image] }),
    ...(prepTime && { prepTime, totalTime: prepTime }),
    recipeIngredient: recipe.ingredients.map((item) =>
      [item.amount, item.unit, item.name].filter(Boolean).join(" "),
    ),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      text: step.description,
    })),
    ...(recipe.tools.length > 0 && {
      tool: recipe.tools.map((tool) => ({ "@type": "HowToTool", name: tool.name })),
    }),
  };
}

/**
 * JSON for a `<script type="application/ld+json">` body. Published recipes are
 * model output, so `</script>` and friends must not be able to close the tag.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
