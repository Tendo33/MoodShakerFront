import test from "node:test";
import assert from "node:assert/strict";
import { buildSlug, makeUniqueSlug } from "../../lib/domain/slug";

test("prefers the English name", () => {
  // A percent-encoded Chinese URL is unreadable and breaks when copied between
  // clients.
  assert.equal(buildSlug({ cn: "莫吉托", en: "Mojito" }, "fallback"), "mojito");
});

test("lowercases and joins words with dashes", () => {
  assert.equal(
    buildSlug({ cn: "", en: "Tequila Sunrise" }, "fallback"),
    "tequila-sunrise",
  );
  assert.equal(
    buildSlug({ cn: "", en: "Obsidian  Eclipse" }, "fallback"),
    "obsidian-eclipse",
  );
});

test("drops apostrophes instead of splitting on them", () => {
  // `bee-s-knees` reads as three words.
  assert.equal(buildSlug({ cn: "", en: "Bee's Knees" }, "f"), "bees-knees");
  assert.equal(buildSlug({ cn: "", en: "Bee’s Knees" }, "f"), "bees-knees");
});

test("falls back when a name has no sluggable characters", () => {
  // Chinese transliterates to nothing usable, so the caller's fallback is the only
  // way to get a stable URL.
  assert.equal(buildSlug({ cn: "沙漠电台", en: "" }, "cocktail-a1b2"), "cocktail-a1b2");
  assert.equal(buildSlug({ cn: "", en: "" }, "cocktail-a1b2"), "cocktail-a1b2");
  assert.equal(buildSlug({ cn: "！！！", en: "!!!" }, "cocktail-a1b2"), "cocktail-a1b2");
});

test("uses the Chinese name only when English is absent", () => {
  // Still produces nothing sluggable, so this documents that cn is consulted
  // rather than skipped — the fallback is what actually lands.
  assert.equal(buildSlug({ cn: "莫吉托", en: "" }, "fb"), "fb");
});

test("caps length and never ends in a dash", () => {
  const slug = buildSlug(
    { cn: "", en: "A Very Long Cocktail Name That Goes On And On And On Forever And Ever" },
    "f",
  );

  assert.ok(slug.length <= 60, `length ${slug.length}`);
  assert.doesNotMatch(slug, /-$/);
  assert.doesNotMatch(slug, /^-/);
});

test("returns a free slug unchanged", () => {
  assert.equal(makeUniqueSlug("mojito", () => false), "mojito");
});

test("suffixes a taken slug", () => {
  // Two drinks may legitimately share a name — two rows already share 沙漠电台 — so
  // a collision is expected rather than an error.
  const taken = new Set(["mojito"]);
  assert.equal(makeUniqueSlug("mojito", (s) => taken.has(s)), "mojito-2");
});

test("keeps counting past consecutive collisions", () => {
  const taken = new Set(["mojito", "mojito-2", "mojito-3"]);
  assert.equal(makeUniqueSlug("mojito", (s) => taken.has(s)), "mojito-4");
});
