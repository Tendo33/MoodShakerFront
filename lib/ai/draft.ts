import { z } from "zod";
import { describeIssues, type Recipe } from "@/lib/domain/recipe";
import { ALCOHOL_LEVELS, BASE_SPIRITS, FLAVOR_PROFILES, type FlavorProfile } from "@/lib/domain/vocabulary";

/**
 * What the model is asked to write: the recipe twice, once per language, plus
 * the shared codes. Stored recipes keep `{ cn, en }` on every field, but asking
 * the model for that shape directly failed on almost every first attempt in
 * evaluation; models write nested `{ cn, en }` pairs as plain strings. Two whole
 * recipes are how a person writes bilingual copy, and they merge cleanly.
 */

const line = z.string().trim().min(1);
/** Models often send amounts as numbers ("amount": 50). */
const amount = z.union([z.string(), z.number()]).transform((value) => String(value).trim()).pipe(line);
const optionalLine = z
  .string()
  .nullish()
  .transform((value) => (value?.trim() ? value.trim() : null));

const side = z.object({
  name: line,
  description: line,
  matchReason: line,
  servingGlass: line,
  timeRequired: line,
  ingredients: z
    .array(z.object({ name: line, amount, unit: optionalLine, substitute: optionalLine }))
    .min(2)
    .max(10),
  tools: z.array(z.object({ name: line, alternative: optionalLine })).max(8),
  steps: z.array(z.object({ description: line, tips: optionalLine })).min(2).max(8),
});

export const draftSchema = z
  .object({
    baseSpirit: z.enum(BASE_SPIRITS),
    alcoholLevel: z.enum(ALCOHOL_LEVELS),
    // Unknown flavour words are dropped rather than costing a repair call.
    flavorProfiles: z
      .array(z.string())
      .transform((values) =>
        [...new Set(values.map((value) => value.trim().toLowerCase()))].filter((value): value is FlavorProfile =>
          (FLAVOR_PROFILES as readonly string[]).includes(value),
        ),
      )
      .pipe(z.array(z.enum(FLAVOR_PROFILES)).min(1).max(5)),
    appearance: line,
    cn: side,
    en: side,
  })
  .superRefine((draft, ctx) => {
    // Models writing casual Chinese drop English words into the prose ("整杯 drink").
    // Amounts and units are left out: toRecipe translates those itself.
    const prose = {
      ...draft.cn,
      ingredients: draft.cn.ingredients.map(({ name, substitute }) => ({ name, substitute })),
    };
    const latin = new Set(
      JSON.stringify(prose)
        .replace(/"[A-Za-z]+":/g, "")
        .match(/[A-Za-z][A-Za-z'-]+/g)
        ?.filter((word) => !/^(ml|null)$/i.test(word)),
    );
    if (latin.size > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["cn"],
        message: `the Chinese version contains English words (${[...latin].slice(0, 8).join(", ")}); write them in Chinese`,
      });
    }
    for (const list of ["ingredients", "tools", "steps"] as const) {
      if (draft.cn[list].length !== draft.en[list].length) {
        ctx.addIssue({
          code: "custom",
          path: ["en", list],
          message: `cn has ${draft.cn[list].length} ${list} and en has ${draft.en[list].length}; they must match one to one`,
        });
      }
    }
  });

export type Draft = z.infer<typeof draftSchema>;

/** Validates model output. Returns issues in a form the model can act on. */
export function parseDraft(value: unknown): { ok: true; draft: Draft } | { ok: false; issues: string } {
  const result = draftSchema.safeParse(value);
  return result.success ? { ok: true, draft: result.data } : { ok: false, issues: describeIssues(result.error) };
}

/** English amount phrases and units that turn up in the Chinese version. */
const CN_MEASURES: Record<string, string> = {
  "to top": "加满",
  top: "加满",
  "to fill": "加满",
  "to taste": "适量",
  "to rinse": "洗杯",
  rinse: "洗杯",
  dash: "滴",
  dashes: "滴",
  drop: "滴",
  drops: "滴",
  slice: "片",
  slices: "片",
  wheel: "片",
  leaf: "片",
  leaves: "片",
  sprig: "枝",
  sprigs: "枝",
  piece: "块",
  pieces: "块",
  cube: "块",
  cubes: "块",
  pinch: "撮",
  barspoon: "吧勺",
  "bar spoon": "吧勺",
  tsp: "茶匙",
  teaspoon: "茶匙",
  tbsp: "汤匙",
  tablespoon: "汤匙",
};

function toChineseMeasure(value: string): string {
  return value.replace(/[A-Za-z][A-Za-z ]*[A-Za-z]|[A-Za-z]/g, (word) => CN_MEASURES[word.toLowerCase()] ?? word);
}

/** Merges the two language versions into the stored shape. */
export function toRecipe(draft: Draft): Recipe {
  const { cn, en } = draft;
  const pair = (a: string, b: string) => ({ cn: a, en: b });
  const optionalPair = (a: string | null, b: string | null) => (a && b ? { cn: a, en: b } : null);

  return {
    name: pair(cn.name, en.name),
    description: pair(cn.description, en.description),
    matchReason: pair(cn.matchReason, en.matchReason),
    servingGlass: pair(cn.servingGlass, en.servingGlass),
    timeRequired: pair(cn.timeRequired, en.timeRequired),
    appearance: draft.appearance,
    baseSpirit: draft.baseSpirit,
    alcoholLevel: draft.alcoholLevel,
    flavorProfiles: draft.flavorProfiles,
    ingredients: cn.ingredients.map((item, index) => {
      const other = en.ingredients[index];
      // "加满 加满": a phrase amount sometimes comes back repeated as its unit.
      const unit = (side: { amount: string; unit: string | null }) => (side.unit === side.amount ? null : side.unit);
      const cnUnit = unit(item);
      return {
        name: pair(item.name, other.name),
        amount: pair(toChineseMeasure(item.amount), other.amount),
        unit: optionalPair(cnUnit && toChineseMeasure(cnUnit), unit(other)),
        substitute: optionalPair(item.substitute, other.substitute),
      };
    }),
    tools: cn.tools.map((tool, index) => ({
      name: pair(tool.name, en.tools[index].name),
      alternative: optionalPair(tool.alternative, en.tools[index].alternative),
    })),
    steps: cn.steps.map((step, index) => ({
      stepNumber: index + 1,
      description: pair(step.description, en.steps[index].description),
      tips: optionalPair(step.tips, en.steps[index].tips),
    })),
  };
}

/** JSON Schema for structured-output mode. Strict modes reject `$ref`, so refs are inlined. */
export function draftJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(draftSchema, { io: "input", target: "draft-7", reused: "inline" }) as Record<
    string,
    unknown
  >;
}
