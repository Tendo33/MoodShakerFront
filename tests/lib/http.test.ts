import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getClientIp, isSameOrigin } from "@/lib/http";
import { localeFromAcceptLanguage, localizePath } from "@/lib/i18n";
import { serializeJsonLd, toIsoDuration } from "@/lib/seo";

const request = (headers: Record<string, string>) => ({
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
});

describe("i18n", () => {
  it("picks the highest-quality supported language", () => {
    assert.equal(localeFromAcceptLanguage("en-US,en;q=0.9,zh-CN;q=0.8"), "en");
    assert.equal(localeFromAcceptLanguage("fr;q=1,zh-TW;q=0.5"), "cn");
    assert.equal(localeFromAcceptLanguage("fr"), null);
    assert.equal(localeFromAcceptLanguage(null), null);
  });

  it("swaps or adds the locale segment", () => {
    assert.equal(localizePath("/", "en"), "/en");
    assert.equal(localizePath("/cn", "en"), "/en");
    assert.equal(localizePath("/cn/gallery", "en"), "/en/gallery");
    assert.equal(localizePath("/cocktail/x", "cn"), "/cn/cocktail/x");
  });
});

describe("getClientIp", () => {
  it("prefers cf-connecting-ip", () => {
    assert.equal(getClientIp(request({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" })), "1.1.1.1");
  });

  it("reads x-forwarded-for from the right, ignoring a spoofed first hop", () => {
    const headers = request({ "x-forwarded-for": "6.6.6.6, 9.9.9.9, 10.0.0.1" });
    assert.equal(getClientIp(headers, 0), "10.0.0.1");
    assert.equal(getClientIp(headers, 1), "10.0.0.1");
    assert.equal(getClientIp(headers, 2), "9.9.9.9");
  });
});

describe("isSameOrigin", () => {
  it("allows same-host and origin-less requests, rejects others", () => {
    assert.equal(isSameOrigin(request({ host: "moodshaker.de", origin: "https://moodshaker.de" })), true);
    assert.equal(isSameOrigin(request({ host: "moodshaker.de" })), true);
    assert.equal(isSameOrigin(request({ host: "moodshaker.de", origin: "https://evil.example" })), false);
    assert.equal(isSameOrigin(request({ host: "moodshaker.de", origin: "null" })), false);
  });
});

describe("seo", () => {
  it("keeps model text from closing the JSON-LD script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>", sep: "a\u2028b" });
    assert.doesNotMatch(out, /<\/script>/i);
    assert.doesNotMatch(out, /\u2028/);
    assert.deepEqual(JSON.parse(out), { name: "</script><script>alert(1)</script>", sep: "a\u2028b" });
  });

  it("converts recipe times to ISO 8601 durations", () => {
    assert.equal(toIsoDuration("5 分钟"), "PT5M");
    assert.equal(toIsoDuration("1 hour"), "PT1H");
    assert.equal(toIsoDuration("quick"), null);
  });
});
