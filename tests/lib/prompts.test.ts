import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildImagePrompt } from "@/lib/ai/prompts";
import { sampleRecipe } from "../fixtures/recipe";

describe("buildImagePrompt", () => {
  it("briefs a campaign still from the appearance, and stays faithful to it", () => {
    const prompt = buildImagePrompt(sampleRecipe);

    assert.match(prompt, /"Dusk Gin & Tonic"/);
    assert.match(prompt, /Highball glass/);
    assert.match(prompt, /Clear, sparkling, lots of ice, lime wheel/);
    assert.doesNotMatch(prompt, /made with/);
    assert.match(prompt, /high-end advertising shot/);
    assert.match(prompt, /three-quarter view/);
    assert.match(prompt, /specular catchlights/);
    assert.match(prompt, /rim light/);
    assert.match(prompt, /condensation on the glass only/);
    assert.match(prompt, /Ice only when it calls for ice/);
    assert.match(prompt, /if it says no ice, the glass has none/);
    assert.match(prompt, /No garnish that is not listed, and none at all when none is listed/);
    assert.match(prompt, /No invented ingredient/);
  });

  it("keeps the pure white cut-out that multiply compositing needs", () => {
    const prompt = buildImagePrompt(sampleRecipe);

    assert.match(prompt, /pure white \(#FFFFFF\) background/);
    assert.match(prompt, /Seamless pure white from edge to edge/);
    assert.match(prompt, /no table, no surface, no horizon, no gradient, no vignette, no cast shadow, no reflection under the glass/);
    assert.match(prompt, /No props, no hands, no text/);
    assert.doesNotMatch(prompt, /eye level/);
    assert.doesNotMatch(prompt, /even studio light/);
  });

  it("falls back to the first five ingredients when appearance is missing or blank", () => {
    const named = (en: string) => ({
      name: { cn: en, en },
      amount: { cn: "1", en: "1" },
      unit: null,
      substitute: null,
    });
    const ingredients = ["Gin", "Lime juice", "Soda", "Mint", "Sugar", "Bitters"].map(named);
    const missing = buildImagePrompt({ ...sampleRecipe, appearance: null, ingredients });
    const blank = buildImagePrompt({ ...sampleRecipe, appearance: "  \n", ingredients });

    for (const prompt of [missing, blank]) {
      assert.match(prompt, /made with Gin, Lime juice, Soda, Mint, Sugar\./);
      assert.doesNotMatch(prompt, /Bitters/);
      assert.doesNotMatch(prompt, /lime wheel/);
    }
  });
});
