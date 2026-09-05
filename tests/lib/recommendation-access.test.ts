import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationAccessPayload,
  parseRecommendationAccessRequest,
} from "../../lib/recommendation-access";
import type { Cocktail } from "../../lib/cocktail-types";

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
  // Built as a variable rather than inline: the point of the test is to hand the
  // builder a record that *does* carry the token, and an inline literal would be
  // rejected by the excess property check before it ever ran.
  const cocktail: Cocktail = {
    id: "rec_123",
    slug: "negroni",
    name: "Negroni",
    nameAllLocales: { cn: "尼格罗尼", en: "Negroni" },
    description: "Bittersweet classic",
    matchReason: "Fits the mood",
    servingGlass: "Rocks",
    timeRequired: "3 mins",
    baseSpirit: "gin",
    baseSpiritLabel: "Gin",
    alcoholLevel: "medium",
    alcoholLevelLabel: "Medium",
    flavorProfiles: ["bitter", "herbal"],
    flavorProfileLabels: ["Bitter", "Herbal"],
    ingredients: [],
    tools: [],
    steps: [],
    imageUrl: null,
    thumbnailUrl: null,
  };

  const session = {
    id: "rec_123",
    sessionId: "sess_123",
    editToken: "secret-token",
    cocktail,
  };

  const payload = buildRecommendationAccessPayload(session);

  assert.deepEqual(payload.meta, {
    recommendationId: "rec_123",
    sessionId: "sess_123",
  });
  assert.equal("editToken" in payload.meta, false);
});
