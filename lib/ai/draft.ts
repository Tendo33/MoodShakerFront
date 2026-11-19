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
    // The reverse slip, Chinese in the English prose. A Chinese measure in an amount or a
    // unit ("1 片 orange peel") is the common case and not worth a second call: toRecipe
    // translates the ones it knows, and only the rest are sent back.
    const englishProse = {
      ...draft.en,
      ingredients: draft.en.ingredients.map(({ name, amount, unit, substitute }) => ({
        name,
        substitute,
        measure: toEnglishMeasure(`${amount} ${unit ?? ""}`),
      })),
    };
    const chinese = new Set(JSON.stringify(englishProse).match(/[\u4e00-\u9fff]+/g));
    if (chinese.size > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["en"],
        message: `the English version contains Chinese (${[...chinese].slice(0, 8).join(", ")}); write it in English`,
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

/** Chinese measures that turn up in the English version. A bare counter (个, 颗) has no English word. */
const EN_MEASURES: Record<string, string> = {
  加满: "to top",
  适量: "to taste",
  毫升: "ml",
  滴: "dash",
  片: "slice",
  枝: "sprig",
  块: "piece",
  角: "wedge",
  条: "strip",
  撮: "pinch",
  茶匙: "tsp",
  汤匙: "tbsp",
  吧勺: "barspoon",
  个: "",
  颗: "",
  只: "",
  根: "",
};

function toEnglishMeasure(value: string): string {
  return value.replace(/[\u4e00-\u9fff]+/g, (word) => EN_MEASURES[word] ?? word).trim();
}

/** "1 large ice cube", "crushed ice": ice the model listed as an ingredient in spite of the prompt. */
const ICE_ONLY = /^(?:(?:a|one|\d+)\s+)?(?:(?:large|big|clear|crushed|cracked|solid|standard)\s+)*ice(?:\s+(?:cubes?|spheres?|balls?|blocks?))?$/i;

/** Merges the two language versions into the stored shape. */
export function toRecipe(draft: Draft): Recipe {
  // Ice belongs in the steps. Left in the list it takes a line on the menu card
  // from a real ingredient. Both versions run in the same order, so one index serves.
  const kept = draft.en.ingredients.map((item) => !ICE_ONLY.test(item.name));
  const withoutIce = <T,>(items: T[]) => (kept.filter(Boolean).length >= 2 ? items.filter((_, index) => kept[index]) : items);
  const cn = { ...draft.cn, ingredients: withoutIce(draft.cn.ingredients) };
  const en = { ...draft.en, ingredients: withoutIce(draft.en.ingredients) };
  const pair = (a: string, b: string) => ({ cn: a, en: b });
  // Names head a line on the page; the model writes "gin" in one recipe and "Gin" in the next.
  const named = (a: string, b: string) => pair(a, b.charAt(0).toUpperCase() + b.slice(1));
  const optionalPair = (a: string | null, b: string | null) => (a && b ? { cn: a, en: b } : null);

  return {
    name: pair(cn.name, en.name),
    description: pair(cn.description, en.description),
    matchReason: pair(cn.matchReason, en.matchReason),
    servingGlass: named(cn.servingGlass, en.servingGlass),
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
        name: named(item.name, other.name),
        amount: pair(toChineseMeasure(item.amount), toEnglishMeasure(other.amount)),
        unit: optionalPair(cnUnit && toChineseMeasure(cnUnit), toEnglishMeasure(unit(other) ?? "") || null),
        substitute: optionalPair(item.substitute, other.substitute),
      };
    }),
    tools: cn.tools.map((tool, index) => ({
      name: named(tool.name, en.tools[index].name),
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
  const schema = z.toJSONSchema(draftSchema, { io: "input", target: "draft-7", reused: "inline" }) as Record<
    string,
    unknown
  >;
  delete schema.$schema;
  return toStrictSchema(schema);
}

/**
 * OpenAI strict structured outputs require every object to set
 * `additionalProperties: false` and list every property as required. Optional
 * fields in the draft are already nullable, so marking them required only means
 * the model sends `null` instead of leaving them out.
 */
function toStrictSchema(node: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...node };
  if (out.type === "object" && out.properties && typeof out.properties === "object") {
    const props = out.properties as Record<string, Record<string, unknown>>;
    out.properties = Object.fromEntries(Object.entries(props).map(([key, value]) => [key, toStrictSchema(value)]));
    out.required = Object.keys(props);
    out.additionalProperties = false;
  }
  if (out.items && typeof out.items === "object" && !Array.isArray(out.items)) {
    out.items = toStrictSchema(out.items as Record<string, unknown>);
  }
  return out;
}
