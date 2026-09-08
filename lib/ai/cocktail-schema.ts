import { z } from "zod";
import {
  ALCOHOL_LEVELS,
  BASE_SPIRITS,
  FLAVOR_PROFILES,
} from "@/lib/domain/vocabulary";

/**
 * The single definition of a generated cocktail.
 *
 * The TypeScript type, the JSON Schema sent to the provider, and the runtime
 * validator are all derived from this one object. Previously there were two
 * hand-maintained copies — the `Cocktail` interface and a JSON schema written as
 * a template string in `utils/prompts.ts` — and they had drifted: the prompt
 * schema had no `english_*` fields at all, so bilingual data was incomplete from
 * the moment of generation.
 */

/** Text that must be produced in both languages (R3.7). */
const localizedText = z.object({
  cn: z.string().min(1),
  en: z.string().min(1),
});

/** Optional bilingual text: absent entirely, or present in both languages. */
const optionalLocalizedText = localizedText.nullable();

export const ingredientSchema = z.object({
  name: localizedText,
  amount: localizedText,
  unit: optionalLocalizedText,
  substitute: optionalLocalizedText,
});

export const toolSchema = z.object({
  name: localizedText,
  alternative: optionalLocalizedText,
});

export const stepSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: localizedText,
  tips: optionalLocalizedText,
});

export const generatedCocktailSchema = z.object({
  name: localizedText,
  description: localizedText,
  matchReason: localizedText,
  servingGlass: localizedText,
  timeRequired: localizedText,

  // Closed vocabularies: codes only, so no boundary has to match display text.
  baseSpirit: z.enum(BASE_SPIRITS),
  alcoholLevel: z.enum(ALCOHOL_LEVELS),
  flavorProfiles: z.array(z.enum(FLAVOR_PROFILES)).min(1).max(5),

  ingredients: z.array(ingredientSchema).min(1).max(15),
  tools: z.array(toolSchema).max(10),
  steps: z.array(stepSchema).min(1).max(15),
});

export type GeneratedCocktail = z.infer<typeof generatedCocktailSchema>;
export type GeneratedIngredient = z.infer<typeof ingredientSchema>;
export type GeneratedTool = z.infer<typeof toolSchema>;
export type GeneratedStep = z.infer<typeof stepSchema>;

/**
 * JSON Schema for the provider's structured-output mode.
 *
 * `io: "input"` keeps optional/nullable fields shaped the way a caller must
 * send them. Refs are inlined because strict structured-output modes reject
 * `$ref`/`$defs`.
 */
export function buildCocktailJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(generatedCocktailSchema, {
    io: "input",
    target: "draft-7",
    reused: "inline",
  }) as Record<string, unknown>;
}

/**
 * Human-readable field guide for the prompt, generated from the schema.
 *
 * Hand-writing this a second time is what let the previous prompt omit the
 * bilingual fields entirely.
 */
export function describeCocktailSchema(): string {
  const lines = [
    "Every text field is an object with `cn` and `en` keys. Both are required",
    "and must express the same meaning idiomatically — do not machine-translate",
    "one into the other, and never leave one empty.",
    "",
    "Fields:",
    "  name              bilingual cocktail name",
    "  description       bilingual: origin or inspiration, plus flavour character",
    "  matchReason       bilingual: why this suits the stated mood and preferences",
    "  servingGlass      bilingual glassware name",
    "  timeRequired      bilingual, e.g. { cn: \"5 分钟\", en: \"5 mins\" }",
    `  baseSpirit        one code from: ${BASE_SPIRITS.join(" | ")}`,
    `  alcoholLevel      one code from: ${ALCOHOL_LEVELS.join(" | ")}`,
    `  flavorProfiles    1-5 codes from: ${FLAVOR_PROFILES.join(" | ")}`,
    "  ingredients       1-15 items: { name, amount, unit, substitute }",
    "                    unit and substitute may be null; when present, bilingual",
    "  tools             0-10 items: { name, alternative }",
    "  steps             1-15 items: { stepNumber, description, tips }",
    "                    stepNumber starts at 1 and increases by 1",
    "",
    "Return the enumerable fields as the codes listed above, never as display",
    "text. Return only the JSON object, with no prose or code fences.",
  ];

  return lines.join("\n");
}

export interface CocktailValidationSuccess {
  ok: true;
  cocktail: GeneratedCocktail;
}

export interface CocktailValidationFailure {
  ok: false;
  /** Compact issue list suitable for feeding back to the model. */
  issues: string;
}

/**
 * Validates provider output.
 *
 * Returns the failure instead of throwing so the caller can attach the issues to
 * a single repair attempt. Nothing reaches the database without passing here:
 * the previous implementation cast the parsed JSON straight to `Cocktail` and
 * defaulted missing fields, which is how a drink literally named
 * "Unknown Cocktail" ended up stored.
 */
export function validateGeneratedCocktail(
  value: unknown,
): CocktailValidationSuccess | CocktailValidationFailure {
  const result = generatedCocktailSchema.safeParse(value);

  if (result.success) {
    return { ok: true, cocktail: result.data };
  }

  const issues = result.error.issues
    .slice(0, 12)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");

  return { ok: false, issues };
}
