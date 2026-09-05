import { randomUUID } from "node:crypto";

/** Generates a request id used to correlate logs with client-visible errors. */
export function createRequestId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}

interface HeaderCarrier {
  headers: { get(name: string): string | null };
}

function parseTrustedProxyHops(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

/**
 * Resolves the client IP that rate limiting can trust.
 *
 * `x-forwarded-for` grows left to right: each proxy appends the address it saw
 * as the connecting peer. Entries to the left of our own trusted proxies are
 * attacker-controlled, so the client address sits at `length - hops`.
 *
 * Example with TRUSTED_PROXY_HOPS=1 and a forged first hop:
 *   "1.1.1.1(forged), 5.5.5.5(real)" -> index 1 -> 5.5.5.5
 *
 * With `hops = 0` there is no trusted proxy and the whole chain is unverifiable.
 * Returning a constant would funnel every request into one rate-limit bucket,
 * so we fall back to the right-most entry and treat it as best effort. Set
 * TRUSTED_PROXY_HOPS to the real proxy depth in production.
 */
export function getClientIp(
  request: HeaderCarrier,
  hops: number = parseTrustedProxyHops(process.env.TRUSTED_PROXY_HOPS),
): string {
  // Written by Cloudflare and not forgeable by the client when traffic is
  // proxied through it, so it outranks the forwarded chain.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  const chain = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    const index = hops > 0 ? chain.length - hops : chain.length - 1;
    const clamped = Math.min(Math.max(index, 0), chain.length - 1);
    const candidate = chain[clamped];
    if (candidate) {
      return candidate;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  return "unknown";
}

/**
 * Rejects cross-site form posts.
 *
 * Browsers always attach `Origin` to POST requests and scripts cannot forge it,
 * so comparing it against the request host stops cross-site submissions. A
 * missing `Origin` means the caller is not a browser (curl, server-to-server),
 * which carries no CSRF risk here because these endpoints authenticate with an
 * `editToken` in the body rather than an ambient cookie.
 */
export function isSameOrigin(request: HeaderCarrier): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
