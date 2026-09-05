import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeFromAcceptLanguage,
  localeFromPathname,
  localizePathname,
} from "../../lib/i18n/config";

test("recognises supported locales only", () => {
  assert.equal(isLocale("cn"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("zh"), false);
  assert.equal(isLocale("EN"), false);
  assert.equal(isLocale(undefined), false);
  assert.equal(isLocale(null), false);
});

test("reads the locale from a path prefix", () => {
  assert.equal(localeFromPathname("/cn"), "cn");
  assert.equal(localeFromPathname("/en"), "en");
  assert.equal(localeFromPathname("/cn/gallery"), "cn");
  assert.equal(localeFromPathname("/en/cocktail/mojito"), "en");
  assert.equal(localeFromPathname("/cn?x=1"), "cn");
});

test("returns null when a path carries no locale prefix", () => {
  assert.equal(localeFromPathname("/"), null);
  assert.equal(localeFromPathname("/gallery"), null);
  assert.equal(localeFromPathname(""), null);
  assert.equal(localeFromPathname(null), null);
  // A path that merely starts with the letters must not count.
  assert.equal(localeFromPathname("/energy"), null);
  assert.equal(localeFromPathname("/cnn"), null);
});

test("picks a locale from Accept-Language by quality value", () => {
  assert.equal(localeFromAcceptLanguage("en"), "en");
  assert.equal(localeFromAcceptLanguage("en-GB"), "en");
  assert.equal(localeFromAcceptLanguage("zh-CN"), "cn");
  assert.equal(localeFromAcceptLanguage("zh-Hant-TW"), "cn");

  // Highest q wins regardless of order.
  assert.equal(localeFromAcceptLanguage("en;q=0.4,zh-CN;q=0.9"), "cn");
  assert.equal(localeFromAcceptLanguage("zh-CN;q=0.3,en;q=0.8"), "en");
});

test("skips unsupported languages instead of defaulting on the first one", () => {
  // The old check was `lower.startsWith("en") ? "en" : "cn"`, so this header
  // became Chinese even though English was acceptable and Chinese was absent.
  assert.equal(localeFromAcceptLanguage("fr,en;q=0.9"), "en");
  assert.equal(localeFromAcceptLanguage("de-DE,fr;q=0.7,zh;q=0.3"), "cn");
});

test("ignores entries the client refused", () => {
  assert.equal(localeFromAcceptLanguage("en;q=0"), null);
  assert.equal(localeFromAcceptLanguage("en;q=0,zh-CN;q=0.5"), "cn");
});

test("returns null when no supported language is acceptable", () => {
  assert.equal(localeFromAcceptLanguage("fr,de;q=0.8"), null);
  assert.equal(localeFromAcceptLanguage(""), null);
  assert.equal(localeFromAcceptLanguage(null), null);
});

test("treats a wildcard as the default locale", () => {
  assert.equal(localeFromAcceptLanguage("*"), DEFAULT_LOCALE);
  assert.equal(localeFromAcceptLanguage("fr;q=0.9,*;q=0.1"), DEFAULT_LOCALE);
});

test("adds a locale prefix to an unprefixed path", () => {
  assert.equal(localizePathname("/", "cn"), "/cn");
  assert.equal(localizePathname("/gallery", "en"), "/en/gallery");
  assert.equal(localizePathname("gallery", "en"), "/en/gallery");
});

test("replaces an existing locale prefix rather than stacking it", () => {
  assert.equal(localizePathname("/cn/gallery", "en"), "/en/gallery");
  assert.equal(localizePathname("/en", "cn"), "/cn");
  assert.equal(localizePathname("/cn", "cn"), "/cn");
});

test("does not mistake a path segment for a prefix when localizing", () => {
  assert.equal(localizePathname("/energy", "cn"), "/cn/energy");
  assert.equal(localizePathname("/cnn/report", "en"), "/en/cnn/report");
});

test("round-trips every locale through pathname helpers", () => {
  for (const locale of LOCALES) {
    const path = localizePathname("/cocktail/mojito", locale);
    assert.equal(localeFromPathname(path), locale);
  }
});
