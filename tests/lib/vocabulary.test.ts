import test from "node:test";
import assert from "node:assert/strict";
import {
  ALCOHOL_LEVELS,
  BASE_SPIRITS,
  FLAVOR_PROFILES,
  coerceAlcoholLevel,
  coerceBaseSpirit,
  coerceFlavorProfiles,
} from "../../lib/domain/vocabulary";

test("maps stored base spirit values in both languages", () => {
  for (const [input, want] of [
    ["gin", "gin"],
    ["金酒", "gin"],
    ["伏特加", "vodka"],
    ["朗姆酒", "rum"],
    ["龙舌兰", "tequila"],
    ["威士忌", "whiskey"],
    ["Whisky", "whiskey"],
    ["白兰地", "brandy"],
  ] as const) {
    assert.equal(coerceBaseSpirit(input), want, input);
  }
});

test("falls back to a valid base spirit code", () => {
  assert.equal(coerceBaseSpirit(null), "other");
  assert.equal(coerceBaseSpirit(""), "other");
  assert.equal(coerceBaseSpirit("清酒"), "other");
  assert.ok(BASE_SPIRITS.includes(coerceBaseSpirit("nonsense")));

  // A spirit named anywhere in the value still counts: stored values were free
  // text like `绝对伏特加` (Absolut Vodka), not clean labels.
  assert.equal(coerceBaseSpirit("绝对伏特加"), "vodka");
});

test("maps alcohol level display text back to codes", () => {
  // The column held both codes and display strings, because
  // normalizeAlcoholLevel used to write `低度` / `中度` / `高度` into the data layer.
  for (const [input, want] of [
    ["low", "low"],
    ["低度", "low"],
    ["medium", "medium"],
    ["中度", "medium"],
    ["high", "high"],
    ["高度", "high"],
    ["无酒精", "none"],
    ["Non-alcoholic", "none"],
  ] as const) {
    assert.equal(coerceAlcoholLevel(input), want, input);
  }
});

test("defaults an unknown alcohol level to medium", () => {
  assert.equal(coerceAlcoholLevel(null), "medium");
  assert.equal(coerceAlcoholLevel("???"), "medium");
  assert.ok(ALCOHOL_LEVELS.includes(coerceAlcoholLevel("???")));
});

test("maps flavour codes through unchanged", () => {
  for (const code of FLAVOR_PROFILES) {
    assert.deepEqual(coerceFlavorProfiles([code]), [code]);
  }
});

test("maps free-text flavours onto codes", () => {
  for (const [input, want] of [
    ["Sweet", ["sweet"]],
    ["清爽", ["refreshing"]],
    ["薄荷香", ["herbal"]],
    ["干爽", ["refreshing"]],
    ["焦糖", ["sweet"]],
  ] as const) {
    assert.deepEqual(coerceFlavorProfiles([input]), want, input);
  }
});

test("splits a compound flavour into every code it names", () => {
  // `甜酸` names two flavours; collapsing it to one loses half the meaning.
  assert.deepEqual(coerceFlavorProfiles(["甜酸"]), ["sweet", "sour"]);
  assert.deepEqual(coerceFlavorProfiles(["Sweet & Sour"]), ["sweet", "sour"]);
});

test("does not read carbonation as sourness", () => {
  // `碳酸感` means carbonated and contains `酸`, so a plain substring scan tagged
  // it sour. Compound terms are consumed before the single-character hints.
  assert.deepEqual(coerceFlavorProfiles(["碳酸感"]), ["refreshing"]);
  assert.deepEqual(coerceFlavorProfiles(["气泡感"]), ["refreshing"]);
});

test("keeps unrecognised flavours as other rather than dropping them", () => {
  // A row must never end up with an empty profile list.
  for (const input of ["复杂", "浓郁", "醇厚"]) {
    assert.deepEqual(coerceFlavorProfiles([input]), ["other"], input);
  }
});

test("ranks recognised flavours above the other placeholder", () => {
  // `other` used to be added in encounter order, so a drink whose first stored
  // value was unrecognisable spent one of its five slots on the placeholder and
  // dropped a real flavour off the end.
  assert.deepEqual(coerceFlavorProfiles(["复杂", "bitter", "sweet", "herbal"]), [
    "bitter",
    "sweet",
    "herbal",
    "other",
  ]);

  // With five real flavours there is no room for the placeholder at all.
  assert.deepEqual(
    coerceFlavorProfiles(["复杂", "bitter", "smoky", "spicy", "herbal", "sour"]),
    ["bitter", "smoky", "spicy", "herbal", "sour"],
  );
});

test("always returns at least one flavour code", () => {
  assert.deepEqual(coerceFlavorProfiles([]), ["other"]);
  assert.deepEqual(coerceFlavorProfiles(null), ["other"]);
  assert.deepEqual(coerceFlavorProfiles(undefined), ["other"]);
  assert.deepEqual(coerceFlavorProfiles([""]), ["other"]);
  assert.deepEqual(coerceFlavorProfiles(["   "]), ["other"]);
});

test("deduplicates and caps flavours at the generation limit", () => {
  assert.deepEqual(coerceFlavorProfiles(["sweet", "甜", "Sweet"]), ["sweet"]);

  const many = coerceFlavorProfiles([
    "sweet",
    "sour",
    "bitter",
    "spicy",
    "fruity",
    "herbal",
    "smoky",
  ]);
  assert.equal(many.length, 5);
});

test("returns only valid codes for every real stored value", () => {
  // The exact distinct values found in the column before migration.
  const stored = [
    "Bitter", "Fruity", "Herbal", "Sour", "Spicy", "Sweet",
    "bitter", "creamy", "fruity", "herbal", "refreshing", "smoky",
    "sour", "spicy", "sweet",
    "复杂", "干爽", "甜", "甜酸", "浓郁", "清爽", "焦糖", "碳酸感", "薄荷香", "醇厚",
  ];

  for (const value of stored) {
    const codes = coerceFlavorProfiles([value]);
    assert.ok(codes.length > 0, value);
    for (const code of codes) {
      assert.ok(FLAVOR_PROFILES.includes(code), `${value} -> ${code}`);
    }
  }
});
