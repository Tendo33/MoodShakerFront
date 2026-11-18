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
    assert.match(prompt, /luxury drinks campaign/);
    assert.match(prompt, /100mm lens at f\/8/);
    assert.match(prompt, /three-quarter view/);
    assert.match(prompt, /jewel-like/);
    assert.match(prompt, /caustic ribbons caught inside the glass and nowhere else/);
    assert.match(prompt, /food stylist's care/);
    assert.match(prompt, /Unless the description says otherwise/);
    assert.match(prompt, /wears a faint condensation/);
    assert.match(prompt, /no more than four fifths of the frame's height/);
    assert.match(prompt, /Ice only when it calls for ice/);
    assert.match(prompt, /if it says no ice, the glass has none/);
    assert.match(prompt, /When it does not describe the ice's finish, the ice is clear and crystalline/);
    assert.match(prompt, /No garnish that is not listed, and none at all when none is listed/);
    assert.match(prompt, /No invented ingredient/);
  });

  it("keeps the pure white cut-out that multiply compositing needs", () => {
    const prompt = buildImagePrompt(sampleRecipe);

    assert.match(prompt, /pure white \(#FFFFFF\) background/);
    assert.match(prompt, /Seamless pure white from edge to edge/);
    assert.match(prompt, /no table, no surface, no horizon, no gradient, no vignette, no cast shadow, no reflection under the glass, no halo/);
    assert.match(prompt, /No props, no hands, no text/);
    assert.doesNotMatch(prompt, /eye level/);
    assert.doesNotMatch(prompt, /even studio light/);
  });

  it("falls back to the first five ingredients when appearance is missing or blank", () => {
    const named = (cn: string, en: string) => ({
      name: { cn, en },
      amount: { cn: "1", en: "1" },
      unit: null,
      substitute: null,
    });
    const ingredients = [
      named("金酒", "Gin"),
      named("青柠汁", "Lime juice"),
      named("苏打水", "Soda"),
      named("薄荷", "Mint"),
      named("糖", "Sugar"),
      named("苦精", "Bitters"),
    ];
    const omitted = buildImagePrompt({
      name: sampleRecipe.name,
      servingGlass: sampleRecipe.servingGlass,
      ingredients,
    });
    const missing = buildImagePrompt({ ...sampleRecipe, appearance: null, ingredients });
    const blank = buildImagePrompt({ ...sampleRecipe, appearance: "  \n", ingredients });

    for (const prompt of [omitted, missing, blank]) {
      assert.match(prompt, /made with Gin, Lime juice, Soda, Mint, Sugar\./);
      assert.doesNotMatch(prompt, /Bitters|苦精|金酒/);
      assert.doesNotMatch(prompt, /lime wheel/);
    }
  });
});
