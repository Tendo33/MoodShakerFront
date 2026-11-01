import { z } from "zod";
import type { Locale, LocalizedText } from "@/lib/i18n";
import {
  ALCOHOL_LEVELS,
  BASE_SPIRITS,
  FLAVOR_PROFILES,
  type AlcoholLevel,
  type BaseSpirit,
  type FlavorProfile,
} from "@/lib/domain/vocabulary";

/**
 * The single definition of a recipe. The TypeScript type, the JSON Schema sent
 * to the model, and the validator for both model output and stored rows all
 * derive from this object, so they cannot drift apart.
 */

const text = z.object({ cn: z.string().trim().min(1), en: z.string().trim().min(1) });
const optionalText = text.nullable();

export const recipeSchema = z.object({
  name: text,
  description: text,
  matchReason: text,
  servingGlass: text,
  timeRequired: text,
  /** English description of the drink's look, used only to brief the image model. */
  appearance: z.string().trim().max(400).nullable().default(null),
  baseSpirit: z.enum(BASE_SPIRITS),
  alcoholLevel: z.enum(ALCOHOL_LEVELS),
  flavorProfiles: z.array(z.enum(FLAVOR_PROFILES)).min(1).max(5),
  ingredients: z
    .array(z.object({ name: text, amount: text, unit: optionalText, substitute: optionalText }))
    .min(1)
    .max(15),
  tools: z.array(z.object({ name: text, alternative: optionalText })).max(10),
  steps: z
    .array(z.object({ stepNumber: z.number().int().positive(), description: text, tips: optionalText }))
    .min(1)
    .max(15),
});

export type Recipe = z.infer<typeof recipeSchema>;

/** A recipe flattened to one language, ready to render. */
export interface RecipeView {
  name: string;
  /** The other language's name, shown as a subtitle on the menu card. */
  altName: string;
  description: string;
  matchReason: string;
  servingGlass: string;
  timeRequired: string;
  baseSpirit: BaseSpirit;
  alcoholLevel: AlcoholLevel;
  flavorProfiles: FlavorProfile[];
  ingredients: { name: string; amount: string; unit: string | null; substitute: string | null }[];
  tools: { name: string; alternative: string | null }[];
  steps: { stepNumber: number; description: string; tips: string | null }[];
}

export function localize(recipe: Recipe, locale: Locale): RecipeView {
  const pick = (value: LocalizedText) => value[locale];
  const pickOptional = (value: LocalizedText | null) => (value ? value[locale] : null);
  const other: Locale = locale === "cn" ? "en" : "cn";

  return {
    name: pick(recipe.name),
    altName: recipe.name[other],
    description: pick(recipe.description),
    matchReason: pick(recipe.matchReason),
    servingGlass: pick(recipe.servingGlass),
    timeRequired: pick(recipe.timeRequired),
    baseSpirit: recipe.baseSpirit,
    alcoholLevel: recipe.alcoholLevel,
    flavorProfiles: recipe.flavorProfiles,
    ingredients: recipe.ingredients.map((item) => ({
      name: pick(item.name),
      amount: pick(item.amount),
      unit: pickOptional(item.unit),
      substitute: pickOptional(item.substitute),
    })),
    tools: recipe.tools.map((item) => ({
      name: pick(item.name),
      alternative: pickOptional(item.alternative),
    })),
    steps: [...recipe.steps]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((step) => ({
        stepNumber: step.stepNumber,
        description: pick(step.description),
        tips: pickOptional(step.tips),
      })),
  };
}

/** Validation issues in a compact form the model can act on in a repair turn. */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 12)
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}
