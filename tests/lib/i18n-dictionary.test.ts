import test from "node:test";
import assert from "node:assert/strict";
import { cn } from "../../locales/cn";
import { en } from "../../locales/en";
import { LOCALES } from "../../lib/i18n/config";
import {
  getDictionary,
  isTranslationKey,
  translate,
  translateDynamic,
} from "../../lib/i18n/dictionary";

test("both dictionaries expose exactly the same keys", () => {
  const cnKeys = Object.keys(cn).sort();
  const enKeys = Object.keys(en).sort();

  // The type system already enforces this; the test states the failure in terms
  // of which keys drifted rather than as a wall of assignability errors.
  assert.deepEqual(
    enKeys.filter((k) => !(k in cn)),
    [],
    "keys present in en but missing from cn",
  );
  assert.deepEqual(
    cnKeys.filter((k) => !(k in en)),
    [],
    "keys present in cn but missing from en",
  );
});

test("no translation is blank", () => {
  // A blank value used to behave like a missing key: `t()` fell through to
  // returning the key itself, so the UI showed `nav.home`.
  for (const locale of LOCALES) {
    const dictionary = getDictionary(locale);
    const blank = Object.entries(dictionary)
      .filter(([, value]) => value.trim().length === 0)
      .map(([key]) => key);

    assert.deepEqual(blank, [], `blank values in ${locale}`);
  }
});

test("translates a known key in each locale", () => {
  assert.equal(translate("cn", "nav.home"), cn["nav.home"]);
  assert.equal(translate("en", "nav.home"), en["nav.home"]);
});

test("recognises real keys only", () => {
  assert.equal(isTranslationKey("nav.home"), true);
  assert.equal(isTranslationKey("nav.nonexistent"), false);
  // Must not be fooled by inherited object properties.
  assert.equal(isTranslationKey("toString"), false);
  assert.equal(isTranslationKey("constructor"), false);
});

test("resolves a runtime-assembled key that exists", () => {
  assert.equal(
    translateDynamic("en", "gallery.spirit.gin"),
    en["gallery.spirit.gin"],
  );
});

test("returns null for an unknown runtime key instead of echoing it", () => {
  // The caller then decides what to render. Echoing put the literal string
  // `gallery.spirit.rum` on screen.
  assert.equal(translateDynamic("en", "gallery.spirit.absinthe"), null);
  assert.equal(translateDynamic("cn", "totally.made.up"), null);
});

test("does not resolve inherited properties as translations", () => {
  assert.equal(translateDynamic("cn", "toString"), null);
  assert.equal(translateDynamic("cn", "__proto__"), null);
});

test("tool substitute labels exist for both pages", () => {
  // `detail.alternative` was referenced as a default prop but existed in neither
  // dictionary, so the detail page rendered the key as visible text.
  for (const locale of LOCALES) {
    const dictionary = getDictionary(locale);
    assert.ok(dictionary["detail.alternative"]);
    assert.ok(dictionary["recommendation.alternative"]);
  }
});
