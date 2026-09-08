import type {
  Cocktail,
  CocktailSummary,
  Ingredient,
  Step,
  StoredCocktailContent,
  Tool,
} from "@/lib/cocktail-types";
import {
  alcoholLevelLabel,
  baseSpiritLabel,
  coerceAlcoholLevel,
  coerceBaseSpirit,
  coerceFlavorProfiles,
  flavorProfileLabel,
} from "@/lib/domain/vocabulary";
import type { Locale } from "@/lib/i18n/config";
import { pickLocalized, pickLocalizedRequired } from "@/lib/i18n/localized";

/**
 * Turns stored bilingual content into one language.
 *
 * The only place this resolution happens. Database reads and freshly generated
 * recommendations both pass through here, so a cocktail cannot be displayed
 * differently depending on which path produced it.
 *
 * Before this existed, every display component chose between `name` and
 * `english_name` itself — via a hook only client components could call, so server
 * components silently rendered Chinese regardless of the requested locale.
 */

/** A cocktail as stored: locale-keyed content plus vocabulary codes. */
export interface StoredCocktail {
  id: string;
  slug: string;
  content: StoredCocktailContent;
  baseSpirit: string;
  alcoholLevel: string;
  flavorProfiles: string[];
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

function resolveIngredients(
  content: StoredCocktailContent,
  locale: Locale,
): Ingredient[] {
  if (!Array.isArray(content.ingredients)) return [];

  return content.ingredients.map((item) => ({
    name: pickLocalizedRequired(item.name, locale),
    amount: pickLocalizedRequired(item.amount, locale),
    unit: pickLocalized(item.unit, locale),
    substitute: pickLocalized(item.substitute, locale),
  }));
}

function resolveTools(content: StoredCocktailContent, locale: Locale): Tool[] {
  if (!Array.isArray(content.tools)) return [];

  return content.tools.map((item) => ({
    name: pickLocalizedRequired(item.name, locale),
    alternative: pickLocalized(item.alternative, locale),
  }));
}

function resolveSteps(content: StoredCocktailContent, locale: Locale): Step[] {
  if (!Array.isArray(content.steps)) return [];

  return content.steps
    .map((item, index) => ({
      stepNumber:
        typeof item.stepNumber === "number" && item.stepNumber > 0
          ? item.stepNumber
          : index + 1,
      description: pickLocalizedRequired(item.description, locale),
      tips: pickLocalized(item.tips, locale),
    }))
    .sort((a, b) => a.stepNumber - b.stepNumber);
}

/**
 * Resolves a stored cocktail for display.
 *
 * Vocabulary values are coerced rather than trusted: rows written before the
 * migration held display text such as `中度` where a code belongs, and coercing
 * keeps such a row filterable instead of invisible.
 */
export function resolveCocktail(
  stored: StoredCocktail,
  locale: Locale,
): Cocktail {
  const { content } = stored;

  const baseSpirit = coerceBaseSpirit(stored.baseSpirit);
  const alcoholLevel = coerceAlcoholLevel(stored.alcoholLevel);
  const flavorProfiles = coerceFlavorProfiles(stored.flavorProfiles);

  return {
    id: stored.id,
    slug: stored.slug,
    name: pickLocalizedRequired(content.name, locale),
    nameAllLocales: content.name,
    description: pickLocalizedRequired(content.description, locale),
    matchReason: pickLocalized(content.matchReason, locale),
    servingGlass: pickLocalizedRequired(content.servingGlass, locale),
    timeRequired: pickLocalizedRequired(content.timeRequired, locale),
    baseSpirit,
    baseSpiritLabel: baseSpiritLabel(baseSpirit, locale),
    alcoholLevel,
    alcoholLevelLabel: alcoholLevelLabel(alcoholLevel, locale),
    flavorProfiles,
    flavorProfileLabels: flavorProfiles.map((code) =>
      flavorProfileLabel(code, locale),
    ),
    ingredients: resolveIngredients(content, locale),
    tools: resolveTools(content, locale),
    steps: resolveSteps(content, locale),
    imageUrl: stored.imageUrl,
    thumbnailUrl: stored.thumbnailUrl,
  };
}

/** Narrows the `content` column, tolerating rows predating the current shape. */
export function readStoredContent(
  value: unknown,
): StoredCocktailContent | null {
  if (typeof value !== "object" || value === null) return null;

  const content = value as Partial<StoredCocktailContent>;
  return content.name ? (content as StoredCocktailContent) : null;
}

export function toCocktailSummary(cocktail: Cocktail): CocktailSummary {
  return {
    id: cocktail.id,
    slug: cocktail.slug,
    name: cocktail.name,
    description: cocktail.description,
    baseSpirit: cocktail.baseSpirit,
    baseSpiritLabel: cocktail.baseSpiritLabel,
    alcoholLevel: cocktail.alcoholLevel,
    alcoholLevelLabel: cocktail.alcoholLevelLabel,
    flavorProfiles: cocktail.flavorProfiles,
    flavorProfileLabels: cocktail.flavorProfileLabels,
    imageUrl: cocktail.imageUrl,
    thumbnailUrl: cocktail.thumbnailUrl,
  };
}
