import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../../proxy";
// Imported rather than written out, so renaming the cookie cannot leave these
// tests passing against a name the middleware no longer reads.
import { LOCALE_COOKIE } from "../../lib/i18n/config";

function request(
  path: string,
  init: { cookie?: string; acceptLanguage?: string } = {},
) {
  const headers = new Headers();
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.acceptLanguage) headers.set("accept-language", init.acceptLanguage);

  return new NextRequest(new URL(`https://moodshaker.de${path}`), { headers });
}

/** Reads the redirect target, or null when the request was passed through. */
function redirectTarget(response: Response): string | null {
  if (response.status < 300 || response.status >= 400) return null;
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

test("keeps sitemap and robots at the root", () => {
  // A crawler looks for these at the origin root and does not follow a redirect
  // to a localized copy. Redirecting them to /cn/sitemap.xml makes both files
  // effectively missing, silently.
  for (const path of ["/sitemap.xml", "/robots.txt"]) {
    const response = proxy(request(path));
    assert.equal(redirectTarget(response), null, path);
  }
});

test("redirects an unprefixed page to a locale", () => {
  assert.equal(redirectTarget(proxy(request("/gallery"))), "/cn/gallery");
});

test("passes through a path that already names a locale", () => {
  for (const path of ["/cn", "/en/gallery", "/cn/cocktail/mojito"]) {
    assert.equal(redirectTarget(proxy(request(path))), null, path);
  }
});

test("honours a stored locale over the Accept-Language header", () => {
  // An explicit choice must outrank a browser guess, or switching language never
  // sticks for a user whose browser says otherwise.
  const response = proxy(
    request("/gallery", {
      cookie: `${LOCALE_COOKIE}=en`,
      acceptLanguage: "zh-CN,zh;q=0.9",
    }),
  );

  assert.equal(redirectTarget(response), "/en/gallery");
});

test("ignores a cookie holding an unsupported locale", () => {
  const response = proxy(
    request("/gallery", { cookie: `${LOCALE_COOKIE}=fr` }),
  );

  assert.equal(redirectTarget(response), "/cn/gallery");
});

test("falls back to Accept-Language when no choice is stored", () => {
  assert.equal(
    redirectTarget(proxy(request("/gallery", { acceptLanguage: "en-US,en" }))),
    "/en/gallery",
  );
});

test("passes image requests through untouched", () => {
  for (const path of ["/logo.png", "/images/hero.webp", "/icon.svg"]) {
    assert.equal(redirectTarget(proxy(request(path))), null, path);
  }
});

test("sets a Content-Security-Policy on a localized page", () => {
  const response = proxy(request("/cn"));
  const csp = response.headers.get("content-security-policy");

  assert.ok(csp, "no CSP header");
  assert.match(csp, /script-src[^;]*'nonce-[0-9a-f]+'/);
  assert.doesNotMatch(
    csp.match(/script-src[^;]*/)?.[0] ?? "",
    /'unsafe-inline'/,
  );
});

test("issues a different nonce per request", () => {
  const nonces = new Set(
    Array.from({ length: 20 }, () => {
      const csp = proxy(request("/cn")).headers.get("content-security-policy");
      return csp?.match(/'nonce-([0-9a-f]+)'/)?.[1];
    }),
  );

  // A reused nonce is no better than 'unsafe-inline'.
  assert.equal(nonces.size, 20);
});
