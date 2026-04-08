import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRateLimitHeaders,
  shouldFailClosedOnRateLimitError,
} from "../../lib/rate-limit";

test("buildRateLimitHeaders includes retry-after for blocked requests", () => {
  const headers = buildRateLimitHeaders({
    allowed: false,
    remaining: 0,
    retryAfterMs: 1500,
  }) as Record<string, string>;

  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.equal(headers["Retry-After"], "2");
});

test("buildRateLimitHeaders omits retry-after for allowed requests", () => {
  const headers = buildRateLimitHeaders({
    allowed: true,
    remaining: 2,
    retryAfterMs: 0,
  }) as Record<string, string>;

  assert.equal(headers["X-RateLimit-Remaining"], "2");
  assert.equal("Retry-After" in headers, false);
});

test("shouldFailClosedOnRateLimitError returns true for missing shared limiter schema in production", () => {
  const shouldFailClosed = shouldFailClosedOnRateLimitError(
    {
      code: "P2010",
      meta: {
        code: "42P01",
        message: 'relation "rate_limit_buckets" does not exist',
      },
    },
    "production",
  );

  assert.equal(shouldFailClosed, true);
});

test("shouldFailClosedOnRateLimitError keeps non-production environments on fallback mode", () => {
  const shouldFailClosed = shouldFailClosedOnRateLimitError(
    {
      code: "P2010",
      meta: {
        code: "42P01",
        message: 'relation "rate_limit_buckets" does not exist',
      },
    },
    "development",
  );

  assert.equal(shouldFailClosed, false);
});
