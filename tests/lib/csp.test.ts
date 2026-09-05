import test from "node:test";
import assert from "node:assert/strict";
import {
  buildContentSecurityPolicy,
  createNonce,
} from "../../lib/security/csp";

/** Splits a policy into its directives for exact assertions. */
function directives(policy: string): Record<string, string> {
  return Object.fromEntries(
    policy.split(";").map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values.join(" ")];
    }),
  );
}

test("script-src never allows unsafe-inline", () => {
  // The whole point of the change. The previous static header in next.config.mjs
  // had `script-src 'self' 'unsafe-inline'`, which permits exactly the inline
  // injection a CSP exists to stop. This assertion is what keeps it from being
  // added back the next time an inline script needs to work.
  for (const isDevelopment of [true, false]) {
    const policy = buildContentSecurityPolicy({
      nonce: createNonce(),
      isDevelopment,
    });

    assert.doesNotMatch(
      directives(policy)["script-src"],
      /'unsafe-inline'/,
      `isDevelopment=${isDevelopment}`,
    );
  }
});

test("script-src carries the nonce it was given", () => {
  const policy = buildContentSecurityPolicy({ nonce: "abc123" });

  assert.match(directives(policy)["script-src"], /'nonce-abc123'/);
});

test("production never allows unsafe-eval", () => {
  const policy = buildContentSecurityPolicy({
    nonce: createNonce(),
    isDevelopment: false,
  });

  assert.doesNotMatch(directives(policy)["script-src"], /'unsafe-eval'/);
});

test("development allows unsafe-eval for React refresh", () => {
  // Dev-only: React refresh and the Next overlay compile with eval, so a policy
  // without it makes `pnpm dev` unusable and invites disabling CSP entirely.
  const policy = buildContentSecurityPolicy({
    nonce: createNonce(),
    isDevelopment: true,
  });

  assert.match(directives(policy)["script-src"], /'unsafe-eval'/);
});

test("upgrade-insecure-requests only in production", () => {
  // Would break http://localhost in development.
  assert.match(
    buildContentSecurityPolicy({ nonce: "n", isDevelopment: false }),
    /upgrade-insecure-requests/,
  );
  assert.doesNotMatch(
    buildContentSecurityPolicy({ nonce: "n", isDevelopment: true }),
    /upgrade-insecure-requests/,
  );
});

test("locks down the directives that enable common attacks", () => {
  const d = directives(
    buildContentSecurityPolicy({ nonce: createNonce(), isDevelopment: false }),
  );

  assert.equal(d["object-src"], "'none'");
  assert.equal(d["frame-ancestors"], "'none'");
  assert.equal(d["base-uri"], "'self'");
  assert.equal(d["form-action"], "'self'");
  assert.equal(d["default-src"], "'self'");
});

test("still allows the inline styles the UI depends on", () => {
  // Framer Motion writes element styles directly and Tailwind's runtime injects a
  // style tag. Inline styles cannot execute JavaScript, so this is a much narrower
  // allowance than the script one it replaces — but it has to stay.
  const d = directives(
    buildContentSecurityPolicy({ nonce: createNonce(), isDevelopment: false }),
  );

  assert.match(d["style-src"], /'unsafe-inline'/);
});

test("allows generated cocktail images from provider CDNs", () => {
  const d = directives(
    buildContentSecurityPolicy({ nonce: createNonce(), isDevelopment: false }),
  );

  assert.match(d["img-src"], /https:/);
  assert.match(d["img-src"], /data:/);
  assert.match(d["img-src"], /blob:/);
});

test("nonces are unique per call and safe for a header", () => {
  const nonces = new Set(Array.from({ length: 200 }, () => createNonce()));
  assert.equal(nonces.size, 200);

  for (const nonce of nonces) {
    // A nonce containing a quote or semicolon would break out of the directive.
    assert.match(nonce, /^[0-9a-f]+$/);
    assert.ok(nonce.length >= 32);
  }
});
