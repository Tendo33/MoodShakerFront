import "server-only";

import type { DrinkRow } from "@/lib/db/schema";
import { localize } from "@/lib/domain/recipe";
import type { Mood } from "@/lib/domain/vocabulary";
import { listPublishedDrinks } from "@/lib/db/drinks";
import { localizePath, type Locale } from "@/lib/i18n";
import { logger } from "@/lib/log";

/** A published drink reduced to what list views render. */
export interface DrinkSummary {
  slug: string;
  name: string;
  altName: string;
  baseSpirit: DrinkRow["recipe"]["baseSpirit"];
  alcoholLevel: DrinkRow["recipe"]["alcoholLevel"];
  flavorProfiles: DrinkRow["recipe"]["flavorProfiles"];
  ingredients: { name: string; amount: string }[];
  mood: Mood | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export function summarize(row: DrinkRow, locale: Locale): DrinkSummary {
  const view = localize(row.recipe, locale);
  return {
    slug: row.slug ?? row.id,
    name: view.name,
    altName: view.altName,
    baseSpirit: view.baseSpirit,
    alcoholLevel: view.alcoholLevel,
    flavorProfiles: view.flavorProfiles,
    ingredients: view.ingredients.map((item) => ({
      name: item.name,
      amount: [item.amount, item.unit].filter(Boolean).join(" "),
    })),
    mood: row.order?.mood ?? null,
    imageUrl: row.imageUrl,
    thumbnailUrl: row.thumbnailUrl ?? row.imageUrl,
  };
}

/**
 * For sections that decorate a page rather than make it: a database hiccup
 * should cost the section, not the whole page.
 */
export async function orEmpty<T>(work: Promise<T[]>, scope: string): Promise<T[]> {
  try {
    return await work;
  } catch (error) {
    logger(scope).error("Optional section failed to load", { error });
    return [];
  }
}

/** A few published drinks for dead ends to point at. Never throws. */
export async function menuSuggestions(locale: Locale, count = 4) {
  const rows = await orEmpty(listPublishedDrinks({ limit: count }).then((page) => page.drinks), "suggestions");
  return rows.map((row) => {
    const drink = summarize(row, locale);
    return { href: localizePath(`/cocktail/${drink.slug}`, locale), name: drink.name, imageUrl: drink.thumbnailUrl, mood: drink.mood };
  });
}
