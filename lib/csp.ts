/**
 * Per-request CSP. Scripts need the request's nonce; `strict-dynamic` lets the
 * scripts Next loads with that nonce load their own chunks.
 */
export function buildContentSecurityPolicy(nonce: string, isDevelopment: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
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
