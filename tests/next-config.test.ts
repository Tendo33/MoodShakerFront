import test from "node:test";
import assert from "node:assert/strict";

test("next config includes baseline security headers", async () => {
  const mod = await import("../next.config.mjs");
  const config = mod.default;

  assert.equal(typeof config.headers, "function");

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

  assert.ok(headerMap["Content-Security-Policy"]);
  assert.equal(headerMap["X-Frame-Options"], "DENY");
  assert.equal(headerMap["X-Content-Type-Options"], "nosniff");
  assert.equal(
    headerMap["Referrer-Policy"],
    "strict-origin-when-cross-origin",
  );
  assert.ok(headerMap["Permissions-Policy"]);
});
