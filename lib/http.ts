import { randomUUID } from "node:crypto";

/**
 * Small helpers shared by the route handlers. Every error response carries a
 * stable `code` and a `requestId` that matches the server log line; internal
 * messages never reach the client.
 */

type ApiErrorCode =
  | "FORBIDDEN_ORIGIN"
  | "INVALID_PAYLOAD"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PROVIDER_FAILED"
  | "RECIPE_INVALID"
  | "IMAGE_FAILED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL";

export function createRequestId(): string {
  return randomUUID().replaceAll("-", "").slice(0, 16);
}

export function ok<T>(data: T, init?: { headers?: HeadersInit }) {
  return Response.json({ ok: true, data }, { status: 200, headers: noStore(init?.headers) });
}

export function fail(
  code: ApiErrorCode,
  status: number,
  requestId: string,
  headers?: HeadersInit,
) {
  return Response.json(
    { ok: false, error: { code, requestId } },
    { status, headers: noStore(headers) },
  );
}

function noStore(headers?: HeadersInit): Headers {
  const result = new Headers(headers);
  result.set("Cache-Control", "no-store");
  return result;
}

export function rateLimitHeaders(result: { remaining: number; retryAfterSeconds: number; allowed: boolean }) {
  const headers: Record<string, string> = { "X-RateLimit-Remaining": String(result.remaining) };
  if (!result.allowed) headers["Retry-After"] = String(result.retryAfterSeconds);
  return headers;
}

interface HeaderCarrier {
  headers: { get(name: string): string | null };
}

/**
 * Client IP for rate limiting. `x-forwarded-for` is read from the right,
 * skipping only the hops we put there ourselves (TRUSTED_PROXY_HOPS); the
 * left-most entry is whatever the client chose to send.
 */
export function getClientIp(request: HeaderCarrier, hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 0)): string {
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;

  const chain = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    const trusted = Number.isFinite(hops) && hops > 0 ? hops : 1;
    return chain[Math.max(0, chain.length - trusted)];
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Browsers always send Origin on cross-site POSTs, so a mismatch means another site is calling. */
export function isSameOrigin(request: HeaderCarrier): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
