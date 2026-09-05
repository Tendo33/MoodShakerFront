/**
 * Content-Security-Policy construction.
 *
 * Separate from `proxy.ts` so the policy can be asserted directly in tests. The
 * property that matters is negative — that `script-src` does not allow
 * `unsafe-inline` — and a test is the only thing that keeps it from being added
 * back the next time an inline script needs to work.
 *
 * This replaces a static header in `next.config.mjs` whose `script-src` was
 * `'self' 'unsafe-inline'`: the header was present, passed a header scan, and
 * permitted exactly the inline injection a CSP exists to stop. A nonce is
 * per-request, so it cannot come from static config.
 */

/** Generates a per-request nonce. */
export function createNonce(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export interface CspOptions {
  nonce: string;
  /** Dev builds need `unsafe-eval` for React refresh; production must not have it. */
  isDevelopment?: boolean;
}

export function buildContentSecurityPolicy({
  nonce,
  isDevelopment = false,
}: CspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    // Lets scripts loaded by a trusted script inherit trust, so third-party
    // loaders keep working without listing every host. Browsers that honour the
    // nonce ignore the host allowlist entirely.
    "'strict-dynamic'",
    isDevelopment ? "'unsafe-eval'" : "",
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Inline styles stay allowed: Framer Motion writes element styles directly and
    // Tailwind's runtime injects a style tag. Inline styles cannot execute
    // JavaScript, so this is far narrower than the script hole it replaces.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // Generated cocktail images are fetched from provider CDNs over https.
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    isDevelopment ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}
