import test from "node:test";
import assert from "node:assert/strict";
import { hasRecoverableRecommendation } from "../../lib/recommendation-state";

test("hasRecoverableRecommendation requires both recommendation id and edit token", () => {
  assert.equal(
    hasRecoverableRecommendation({
      recommendationId: "rec_123",
      editToken: "",
      sessionId: "sess_123",
    }),
    false,
  );
});

test("hasRecoverableRecommendation returns true when local access data is intact", () => {
  assert.equal(
    hasRecoverableRecommendation({
      recommendationId: "rec_123",
      editToken: "secret-token",
      sessionId: "sess_123",
    }),
    true,
  );
});
