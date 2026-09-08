import test from "node:test";
import assert from "node:assert/strict";
import { resolveCocktail } from "../../lib/domain/resolve-cocktail";
import type { StoredCocktail } from "../../lib/domain/resolve-cocktail";

/**
 * A complete stored row. Individual tests override only the field under test, so a
 * failure points at one behavior rather than at fixture drift.
 */
function storedCocktail(overrides: Record<string, unknown> = {}) {
  const content = {
    name: { cn: "莫吉托", en: "Mojito" },
    description: { cn: "清爽的古巴经典", en: "A refreshing Cuban classic" },
    matchReason: { cn: "适合夏天", en: "Good for summer" },
    servingGlass: { cn: "高球杯", en: "Highball glass" },
    timeRequired: { cn: "5分钟", en: "5 mins" },
    ingredients: [
      {
        name: { cn: "白朗姆", en: "White rum" },
        amount: { cn: "45", en: "45" },
        unit: { cn: "毫升", en: "ml" },
        substitute: null,
      },
    ],
    tools: [
      {
        name: { cn: "捣棒", en: "Muddler" },
        alternative: { cn: "勺子", en: "Spoon" },
      },
    ],
    steps: [
      {
        stepNumber: 1,
        description: { cn: "捣碎薄荷", en: "Muddle the mint" },
        tips: null,
      },
    ],
    ...((overrides.content as Record<string, unknown>) ?? {}),
  };

  return {
    id: "c1",
    slug: "mojito",
    imageUrl: "https://img.example/mojito.png",
    baseSpirit: "rum",
    alcoholLevel: "low",
    flavorProfiles: ["refreshing"],
    ...overrides,
    content,
  } as unknown as StoredCocktail;
}

test("resolves every text field into the requested locale", () => {
  const en = resolveCocktail(storedCocktail(), "en");

  assert.equal(en.name, "Mojito");
  assert.equal(en.description, "A refreshing Cuban classic");
  assert.equal(en.matchReason, "Good for summer");
  assert.equal(en.servingGlass, "Highball glass");
  assert.equal(en.timeRequired, "5 mins");
  assert.equal(en.ingredients[0].name, "White rum");
  assert.equal(en.ingredients[0].unit, "ml");
  assert.equal(en.tools[0].name, "Muddler");
  assert.equal(en.tools[0].alternative, "Spoon");
  assert.equal(en.steps[0].description, "Muddle the mint");
});

test("the same row resolves into Chinese without refetching", () => {
  const cn = resolveCocktail(storedCocktail(), "cn");

  assert.equal(cn.name, "莫吉托");
  assert.equal(cn.description, "清爽的古巴经典");
  assert.equal(cn.ingredients[0].name, "白朗姆");
  assert.equal(cn.ingredients[0].unit, "毫升");
  assert.equal(cn.steps[0].description, "捣碎薄荷");
});

test("nameAllLocales keeps every locale, not just the requested one", () => {
  // The gallery needs this: search matches across locales, so a Chinese query has to
  // find a drink while the interface is in English.
  const en = resolveCocktail(storedCocktail(), "en");

  assert.deepEqual(en.nameAllLocales, { cn: "莫吉托", en: "Mojito" });
});

test("a step keeps its stored stepNumber", () => {
  const resolved = resolveCocktail(
    storedCocktail({
      content: {
        steps: [
          {
            stepNumber: 3,
            description: { cn: "摇匀", en: "Shake" },
            tips: null,
          },
        ],
      },
    }),
    "en",
  );

  assert.equal(resolved.steps[0].stepNumber, 3);
});

test("optional fields stay null rather than becoming empty strings", () => {
  // A UI that renders "" for a missing tip shows an empty bullet; null lets it skip
  // the row entirely.
  const resolved = resolveCocktail(
    storedCocktail({
      content: { matchReason: null },
    }),
    "en",
  );

  assert.equal(resolved.matchReason, null);
  assert.equal(resolved.ingredients[0].substitute, null);
  assert.equal(resolved.steps[0].tips, null);
});

test("vocabulary codes carry a label in the requested locale", () => {
  const en = resolveCocktail(storedCocktail(), "en");
  const cn = resolveCocktail(storedCocktail(), "cn");

  // The code is what the database stores and what filters match on; the label is
  // display text and must never be sent back as a filter value.
  assert.equal(en.baseSpirit, "rum");
  assert.equal(en.baseSpiritLabel, "Rum");
  assert.equal(en.alcoholLevel, "low");
  assert.equal(en.alcoholLevelLabel, "Low");
  assert.deepEqual(en.flavorProfiles, ["refreshing"]);
  assert.deepEqual(en.flavorProfileLabels, ["Refreshing"]);

  assert.equal(cn.baseSpirit, "rum");
  assert.notEqual(cn.baseSpiritLabel, "Rum");
});

test("an unrecognized base spirit degrades to `other` instead of throwing", () => {
  // Rows predate the current vocabulary, and a detail page that throws on an
  // unknown value is worse than one that shows a generic category.
  const resolved = resolveCocktail(
    storedCocktail({ baseSpirit: "moonshine" }),
    "en",
  );

  assert.equal(resolved.baseSpirit, "other");
});

test("a missing alcohol level degrades to `medium`", () => {
  const resolved = resolveCocktail(
    storedCocktail({ alcoholLevel: null }),
    "en",
  );

  assert.equal(resolved.alcoholLevel, "medium");
});

test("unknown flavor profiles are replaced, known ones kept", () => {
  const resolved = resolveCocktail(
    storedCocktail({ flavorProfiles: ["sweet", "tastes-like-tuesday"] }),
    "en",
  );

  assert.deepEqual(resolved.flavorProfiles, ["sweet", "other"]);
});

test("empty ingredient, tool, and step lists resolve to empty arrays", () => {
  const resolved = resolveCocktail(
    storedCocktail({
      content: { ingredients: [], tools: [], steps: [] },
    }),
    "en",
  );

  assert.deepEqual(resolved.ingredients, []);
  assert.deepEqual(resolved.tools, []);
  assert.deepEqual(resolved.steps, []);
});

test("identity fields pass through untouched", () => {
  const resolved = resolveCocktail(storedCocktail(), "en");

  assert.equal(resolved.id, "c1");
  assert.equal(resolved.slug, "mojito");
  assert.equal(resolved.imageUrl, "https://img.example/mojito.png");
});
