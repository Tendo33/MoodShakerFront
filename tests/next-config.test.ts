import test from "node:test";
import assert from "node:assert/strict";

test("next config includes baseline security headers", async () => {
  const mod = await import("../next.config.mjs");
  const config = mod.default;

  // `assert.ok` rather than `assert.equal(typeof ...)`: only the former is typed
  // as an assertion, so the call below narrows instead of erroring on a possibly
  // undefined `headers`.
  assert.ok(typeof config.headers === "function");

  const headerEntries = await config.headers();
  const rootHeaders = headerEntries.find(
    (entry: { source: string }) => entry.source === "/(.*)",
  );

  assert.ok(rootHeaders);

  const headerMap = Object.fromEntries(
    rootHeaders.headers.map((header: { key: string; value: string }) => [
      header.key,
      header.value,
    ]),
  );

  // No Content-Security-Policy here on purpose: it is built per-request in
  // `proxy.ts` so it can carry a nonce, and is asserted in tests/lib/csp.test.ts.
  // A static header cannot have a nonce, which is why the one that used to live
  // here fell back to `script-src 'unsafe-inline'`.
  assert.equal(headerMap["Content-Security-Policy"], undefined);
  assert.equal(headerMap["X-Frame-Options"], "DENY");
  assert.equal(headerMap["X-Content-Type-Options"], "nosniff");
  assert.equal(
    headerMap["Referrer-Policy"],
    "strict-origin-when-cross-origin",
  );
  assert.ok(headerMap["Permissions-Policy"]);
});
