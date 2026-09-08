import test from "node:test";
import assert from "node:assert/strict";
import {
  createRequestId,
  getClientIp,
  isSameOrigin,
} from "../../lib/http/request-context";

function withHeaders(headers: Record<string, string>) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    headers: {
      get: (name: string) => normalized.get(name.toLowerCase()) ?? null,
    },
  };
}

test("getClientIp ignores a forged first hop behind one trusted proxy", () => {
  // Caddy appends the real peer address, so the forged entry sits to its left.
  const request = withHeaders({
    "x-forwarded-for": "1.1.1.1, 5.5.5.5",
  });

  assert.equal(getClientIp(request, 1), "5.5.5.5");
});

test("getClientIp ignores a forged first hop behind two trusted proxies", () => {
  const request = withHeaders({
    "x-forwarded-for": "1.1.1.1, 5.5.5.5, 9.9.9.9",
  });

  assert.equal(getClientIp(request, 2), "5.5.5.5");
});

test("getClientIp cannot be steered by padding the forwarded chain", () => {
  // An attacker prepending entries must not shift the trusted position.
  const request = withHeaders({
    "x-forwarded-for": "2.2.2.2, 3.3.3.3, 4.4.4.4, 5.5.5.5",
  });

  assert.equal(getClientIp(request, 1), "5.5.5.5");
});

test("getClientIp prefers cf-connecting-ip over the forwarded chain", () => {
  const request = withHeaders({
    "cf-connecting-ip": "5.5.5.5",
    "x-forwarded-for": "1.1.1.1, 2.2.2.2",
  });

  assert.equal(getClientIp(request, 1), "5.5.5.5");
});

test("getClientIp falls back to the right-most entry without a trusted proxy", () => {
  const request = withHeaders({
    "x-forwarded-for": "1.1.1.1, 5.5.5.5",
  });

  assert.equal(getClientIp(request, 0), "5.5.5.5");
});

test("getClientIp clamps an over-configured hop count", () => {
  const request = withHeaders({ "x-forwarded-for": "5.5.5.5" });

  assert.equal(getClientIp(request, 5), "5.5.5.5");
});

test("getClientIp uses x-real-ip when no forwarded chain exists", () => {
  const request = withHeaders({ "x-real-ip": "5.5.5.5" });

  assert.equal(getClientIp(request, 1), "5.5.5.5");
});

test("getClientIp returns unknown when no address headers are present", () => {
  assert.equal(getClientIp(withHeaders({}), 1), "unknown");
});

test("isSameOrigin accepts a matching origin", () => {
  const request = withHeaders({
    origin: "https://moodshaker.de",
    host: "moodshaker.de",
  });

  assert.equal(isSameOrigin(request), true);
});

test("isSameOrigin rejects a cross-site origin", () => {
  const request = withHeaders({
    origin: "https://evil.example",
    host: "moodshaker.de",
  });

  assert.equal(isSameOrigin(request), false);
});

test("isSameOrigin rejects a look-alike origin suffix", () => {
  const request = withHeaders({
    origin: "https://moodshaker.de.evil.example",
    host: "moodshaker.de",
  });

  assert.equal(isSameOrigin(request), false);
});

test("isSameOrigin allows non-browser callers that send no origin", () => {
  const request = withHeaders({ host: "moodshaker.de" });

  assert.equal(isSameOrigin(request), true);
});

test("isSameOrigin rejects a malformed origin header", () => {
  const request = withHeaders({ origin: "not-a-url", host: "moodshaker.de" });

  assert.equal(isSameOrigin(request), false);
});

test("createRequestId returns a stable-length hex id", () => {
  const first = createRequestId();
  const second = createRequestId();

  assert.match(first, /^[0-9a-f]{16}$/);
  assert.notEqual(first, second);
});
