import test from "node:test";
import assert from "node:assert/strict";
import { apiError, apiSuccess } from "../../lib/api-response";

/** Reads a NextResponse's JSON body. */
async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

test("apiSuccess wraps the payload and defaults to 200", async () => {
  const response = apiSuccess({ slug: "mojito" });

  assert.equal(response.status, 200);
  assert.deepEqual(await body(response), {
    success: true,
    data: { slug: "mojito" },
  });
});

test("apiSuccess honours an explicit status", async () => {
  const response = apiSuccess({ id: "abc" }, 201);
  assert.equal(response.status, 201);
});

test("apiSuccess passes through extra headers", () => {
  const response = apiSuccess({ ok: true }, 200, {
    headers: { "X-RateLimit-Remaining": "4" },
  });

  assert.equal(response.headers.get("X-RateLimit-Remaining"), "4");
});

test("apiError reports the code and message the caller chose", async () => {
  const response = apiError("INVALID_SLUG", "Missing cocktail slug.", 400);

  assert.equal(response.status, 400);
  const payload = await body(response);
  assert.equal(payload.success, false);
  const error = payload.error as Record<string, unknown>;
  assert.equal(error.code, "INVALID_SLUG");
  assert.equal(error.message, "Missing cocktail slug.");
});

test("apiError includes requestId when given one", async () => {
  // This is what makes a user-reported 500 traceable: the same id appears in the
  // response body and on every log line for that request.
  const response = apiError("PUBLISH_FAILED", "Could not publish.", 500, {
    requestId: "req-abc123",
  });

  const error = (await body(response)).error as Record<string, unknown>;
  assert.equal(error.requestId, "req-abc123");
});

test("apiError omits requestId when not given one", async () => {
  const response = apiError("INVALID_ID", "Missing id.", 400);

  const error = (await body(response)).error as Record<string, unknown>;
  assert.ok(!("requestId" in error));
});

test("apiError carries rate-limit headers alongside the body", () => {
  // Rate-limited responses have to state their limits in headers, not only in the
  // body, so a client can back off without parsing JSON.
  const response = apiError("RATE_LIMITED", "Too many requests.", 429, {
    headers: {
      "X-RateLimit-Limit": "10",
      "X-RateLimit-Remaining": "0",
      "Retry-After": "42",
    },
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("X-RateLimit-Limit"), "10");
  assert.equal(response.headers.get("Retry-After"), "42");
});
