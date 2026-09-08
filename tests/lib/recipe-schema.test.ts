import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBreadcrumbSchema,
  buildRecipeSchema,
  toIsoDuration,
} from "../../lib/seo/recipe-schema";
import type { Cocktail } from "../../lib/cocktail-types";

function cocktail(overrides: Partial<Cocktail> = {}): Cocktail {
  return {
    id: "c1",
    slug: "mojito",
    name: "莫吉托",
    nameAllLocales: { cn: "莫吉托", en: "Mojito" },
    description: "清爽的古巴经典",
    matchReason: null,
    servingGlass: "高球杯",
    timeRequired: "5 分钟",
    baseSpirit: "rum",
    baseSpiritLabel: "朗姆酒",
    alcoholLevel: "low",
    alcoholLevelLabel: "低度",
    flavorProfiles: ["refreshing", "sour"],
    flavorProfileLabels: ["清爽", "酸"],
    ingredients: [
      { name: "白朗姆酒", amount: "60", unit: "毫升", substitute: null },
      { name: "薄荷叶", amount: "10", unit: null, substitute: null },
    ],
    tools: [{ name: "捣棒", alternative: null }],
    steps: [
      { stepNumber: 1, description: "捣碎薄荷叶", tips: "轻压即可" },
      { stepNumber: 2, description: "加入朗姆酒", tips: null },
    ],
    imageUrl: "https://cdn.example.com/mojito.png",
    thumbnailUrl: null,
    ...overrides,
  };
}

test("reads a duration in either language", () => {
  for (const [input, want] of [
    ["5 分钟", "PT5M"],
    ["5 mins", "PT5M"],
    ["10 minutes", "PT10M"],
    ["1 小时", "PT1H"],
    ["2 hours", "PT2H"],
    ["3 hr", "PT3H"],
  ] as const) {
    assert.equal(toIsoDuration(input), want, input);
  }
});

test("returns null rather than guessing an unreadable duration", () => {
  // An invalid `prepTime` makes Google reject the entire recipe, so omitting the
  // field beats emitting a wrong one.
  for (const input of [null, undefined, "", "quick", "很快", "0 分钟", "-5 mins"]) {
    assert.equal(toIsoDuration(input), null, String(input));
  }
});

test("emits a Recipe with ingredients as single lines", () => {
  const schema = buildRecipeSchema(cocktail(), "cn");

  assert.equal(schema["@type"], "Recipe");
  assert.equal(schema.name, "莫吉托");
  assert.equal(schema.recipeCategory, "Drink");
  assert.equal(schema.inLanguage, "zh-CN");

  // A crawler reads one line per ingredient, not structured parts.
  assert.deepEqual(schema.recipeIngredient, ["60 毫升 白朗姆酒", "10 薄荷叶"]);
});

test("emits ordered HowToStep instructions", () => {
  const schema = buildRecipeSchema(cocktail(), "cn");
  const steps = schema.recipeInstructions as Array<Record<string, unknown>>;

  assert.equal(steps.length, 2);
  assert.equal(steps[0]["@type"], "HowToStep");
  assert.equal(steps[0].position, 1);
  assert.equal(steps[0].text, "捣碎薄荷叶");
  assert.equal(steps[1].position, 2);
});

test("states total time equal to prep time", () => {
  // A cocktail is not cooked; stating both stops Google inferring a missing
  // cookTime.
  const schema = buildRecipeSchema(cocktail(), "cn");

  assert.equal(schema.prepTime, "PT5M");
  assert.equal(schema.totalTime, "PT5M");
});

test("omits fields with no value rather than emitting empty ones", () => {
  const schema = buildRecipeSchema(
    cocktail({ imageUrl: null, tools: [], timeRequired: "unknown" }),
    "en",
  );

  assert.equal("image" in schema, false);
  assert.equal("tool" in schema, false);
  assert.equal("prepTime" in schema, false);
  assert.equal("totalTime" in schema, false);
});

test("uses the locale's own URL and language tag", () => {
  const cn = buildRecipeSchema(cocktail(), "cn");
  const en = buildRecipeSchema(cocktail(), "en");

  assert.match(String(cn.url), /\/cn\/cocktail\/mojito$/);
  assert.match(String(en.url), /\/en\/cocktail\/mojito$/);
  assert.equal(cn.inLanguage, "zh-CN");
  assert.equal(en.inLanguage, "en");
});

test("serializes to valid JSON", () => {
  // Emitted through JSON.stringify into a script tag; a circular or undefined
  // value would produce malformed structured data.
  const json = JSON.stringify([
    buildRecipeSchema(cocktail(), "cn"),
    buildBreadcrumbSchema(cocktail(), "cn"),
  ]);

  const parsed = JSON.parse(json);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0]["@context"], "https://schema.org");
});

test("breadcrumbs run home to gallery to cocktail", () => {
  const schema = buildBreadcrumbSchema(cocktail(), "en");
  const items = schema.itemListElement;

  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((i) => i.position),
    [1, 2, 3],
  );
  assert.equal(items[1].name, "Gallery");
  assert.equal(items[2].name, "莫吉托");
  assert.match(items[1].item, /\/en\/gallery$/);
});
