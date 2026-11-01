import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderSchema } from "@/lib/domain/order";
import { localize, recipeSchema } from "@/lib/domain/recipe";
import { buildSlug } from "@/lib/domain/slug";
import { cn } from "@/lib/dictionaries/cn";
import { en } from "@/lib/dictionaries/en";
import { sampleRecipe } from "../fixtures/recipe";

describe("recipe", () => {
  it("validates the fixture and rejects a one-language field", () => {
    assert.ok(recipeSchema.safeParse(sampleRecipe).success);
    const missingEn = { ...sampleRecipe, name: { cn: "名字", en: "" } };
    assert.equal(recipeSchema.safeParse(missingEn).success, false);
  });

  it("localizes to one language and orders steps", () => {
    const view = localize(sampleRecipe, "cn");
    assert.equal(view.name, "黄昏金汤力");
    assert.equal(view.altName, "Dusk Gin & Tonic");
    assert.deepEqual(
      view.steps.map((step) => step.stepNumber),
      [1, 2],
    );
    assert.equal(view.ingredients[1].unit, null);
  });
});

describe("order", () => {
  const valid = { locale: "cn", mood: "blue", strength: "none", skill: "beginner", style: "creative" };

  it("defaults spirits and notes", () => {
    const parsed = orderSchema.parse(valid);
    assert.deepEqual(parsed.spirits, []);
    assert.equal(parsed.notes, "");
  });

  it("rejects codes outside the vocabulary and overlong notes", () => {
    assert.equal(orderSchema.safeParse({ ...valid, mood: "angry" }).success, false);
    assert.equal(orderSchema.safeParse({ ...valid, spirits: ["absinthe"] }).success, false);
    assert.equal(orderSchema.safeParse({ ...valid, notes: "x".repeat(301) }).success, false);
  });
});

describe("buildSlug", () => {
  it("slugs the English name and falls back when nothing latin remains", () => {
    assert.equal(buildSlug({ cn: "x", en: "Dusk Gin & Tonic" }, "id"), "dusk-gin-tonic");
    assert.equal(buildSlug({ cn: "莫吉托", en: "" }, "abc123"), "abc123");
    assert.equal(buildSlug({ cn: "", en: "Smith’s Sour" }, "id"), "smiths-sour");
  });
});

describe("dictionaries", () => {
  it("have the same shape in both languages", () => {
    const shape = (value: unknown): unknown =>
      typeof value === "object" && value !== null
        ? Object.fromEntries(
            Object.entries(value)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, child]) => [key, Array.isArray(child) ? child.length : shape(child)]),
          )
        : typeof value;
    assert.deepEqual(shape(cn), shape(en));
  });
});
