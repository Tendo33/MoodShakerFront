import type { Cocktail } from "@/lib/cocktail-types";
import { type Locale, localizePathname } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/i18n/metadata";

/**
 * schema.org `Recipe` data for a cocktail.
 *
 * The project emitted no structured data, so a cocktail page was just prose to a
 * search engine: no ingredient list, no steps, no eligibility for recipe rich
 * results. A drink is a `Recipe` in schema.org terms, with `recipeCategory`
 * marking it as a drink.
 *
 * Emitted as a `<script type="application/ld+json">`, which is data rather than
 * executable code — the CSP nonce does not apply to it and it is not affected by
 * `script-src`.
 */

/**
 * Converts free-text prep time into an ISO 8601 duration.
 *
 * Stored values are human strings in either language (`5 分钟`, `5 mins`,
 * `1 小时`), so the number and the unit both have to be read out. Returns null
 * rather than guessing when neither is recognisable: an invalid `prepTime` makes
 * Google reject the whole recipe, so omitting the field is strictly better than
 * emitting a wrong one.
 */
export function toIsoDuration(text: string | null | undefined): string | null {
  if (!text) return null;

  // The sign has to be part of the match: `\d+` alone reads `-5 mins` as 5 and
  // turns a nonsensical duration into a valid-looking `PT5M`.
  const amount = text.match(/-?\d+/);
  if (!amount) return null;

  const value = Number(amount[0]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const isHours = /hour|hr|小时|時間/i.test(text);
  return isHours ? `PT${value}H` : `PT${value}M`;
}

interface RecipeSchema {
  "@context": "https://schema.org";
  "@type": "Recipe";
  [key: string]: unknown;
}

export function buildRecipeSchema(
  cocktail: Cocktail,
  locale: Locale,
): RecipeSchema {
  const url = SITE_URL + localizePathname(`/cocktail/${cocktail.slug}`, locale);
  const prepTime = toIsoDuration(cocktail.timeRequired);

  const schema: RecipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: cocktail.name,
    description: cocktail.description,
    url,
    inLanguage: locale === "cn" ? "zh-CN" : "en",
    recipeCategory: "Drink",
    keywords: [cocktail.baseSpiritLabel, ...cocktail.flavorProfileLabels].join(
      ", ",
    ),
    recipeYield: "1 serving",
    author: {
      "@type": "Organization",
      name: "MoodShaker",
      url: SITE_URL,
    },
    // Amount and unit belong in the same string: a crawler reads
    // `recipeIngredient` as one line per ingredient, not as structured parts.
    recipeIngredient: cocktail.ingredients.map((ingredient) =>
      [ingredient.amount, ingredient.unit, ingredient.name]
        .filter(Boolean)
        .join(" ")
        .trim(),
    ),
    recipeInstructions: cocktail.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      text: step.description,
      ...(step.tips ? { itemListElement: step.tips } : {}),
    })),
  };

  if (cocktail.imageUrl) schema.image = [cocktail.imageUrl];
  if (prepTime) {
    schema.prepTime = prepTime;
    // A cocktail is not cooked, so total time is prep time. Stating both keeps
    // Google from inferring a missing `cookTime`.
    schema.totalTime = prepTime;
  }
  if (cocktail.tools.length > 0) {
    schema.tool = cocktail.tools.map((tool) => ({
      "@type": "HowToTool",
      name: tool.name,
    }));
  }

  return schema;
}

/**
 * `BreadcrumbList` for a cocktail page.
 *
 * Gives a search result a readable path instead of a bare URL.
 */
export function buildBreadcrumbSchema(cocktail: Cocktail, locale: Locale) {
  const items = [
    { name: "MoodShaker", path: "/" },
    { name: locale === "cn" ? "鸡尾酒图鉴" : "Gallery", path: "/gallery" },
    { name: cocktail.name, path: `/cocktail/${cocktail.slug}` },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: SITE_URL + localizePathname(item.path, locale),
    })),
  };
}
