import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationAccessPayload,
  parseRecommendationAccessRequest,
} from "../../lib/recommendation-access";

test("parseRecommendationAccessRequest returns 400 for invalid JSON bodies", async () => {
  const result = await parseRecommendationAccessRequest({
    json: async () => {
      throw new SyntaxError("Unexpected token");
    },
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.response.status, 400);

    const payload = (await result.response.json()) as {
      error?: { code?: string; message?: string };
    };

    assert.equal(payload.error?.code, "INVALID_PAYLOAD");
    assert.equal(payload.error?.message, "Request body must be valid JSON.");
  }
});

test("buildRecommendationAccessPayload does not expose the edit token", () => {
  const payload = buildRecommendationAccessPayload({
    id: "rec_123",
    sessionId: "sess_123",
    editToken: "secret-token",
    cocktail: {
      id: "rec_123",
      name: "Negroni",
      description: "Bittersweet classic",
      match_reason: "Fits the mood",
      base_spirit: "Gin",
      alcohol_level: "medium",
      serving_glass: "Rocks",
      flavor_profiles: ["bitter", "herbal"],
      ingredients: [],
      tools: [],
      steps: [],
    },
  });

  assert.deepEqual(payload.meta, {
    recommendationId: "rec_123",
    sessionId: "sess_123",
  });
  assert.equal("editToken" in payload.meta, false);
});
