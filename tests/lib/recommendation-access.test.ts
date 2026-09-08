import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationAccessPayload,
  parseRecommendationAccessRequest,
} from "../../lib/recommendation-access";
import type { Cocktail } from "../../lib/cocktail-types";
import { RecommendationStatus } from "../../lib/cocktail-types";

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

/**
 * Shared fixture, at module scope so every test here can use it.
 *
 * Built as a variable rather than inline because these tests hand the builder a
 * record that *does* carry an edit token, and an inline literal would be rejected
 * by the excess property check before the assertion ever ran.
 */
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

test("buildRecommendationAccessPayload does not expose the edit token", () => {
  const session = {
    id: "rec_123",
    sessionId: "sess_123",
    editToken: "secret-token",
    cocktail,
    status: RecommendationStatus.PRIVATE,
    publishedCocktailId: undefined,
  };

  const payload = buildRecommendationAccessPayload(session);

  assert.deepEqual(payload.meta, {
    recommendationId: "rec_123",
    sessionId: "sess_123",
    isPublished: false,
    publishedSlug: null,
  });
  // The edit token grants write access. It must never travel in a response, or a
  // shared link hands over the ability to publish and delete.
  assert.equal("editToken" in payload.meta, false);
});

test("reports publish state so a client can offer the right action", () => {
  const base = {
    id: "rec_1",
    sessionId: "sess_1",
    cocktail,
  };

  const published = buildRecommendationAccessPayload(
    { ...base, status: RecommendationStatus.PUBLISHED, publishedCocktailId: "c1" },
    "mojito",
  );
  assert.equal(published.meta.isPublished, true);
  assert.equal(published.meta.publishedSlug, "mojito");

  const private_ = buildRecommendationAccessPayload({
    ...base,
    status: RecommendationStatus.PRIVATE,
    publishedCocktailId: undefined,
  });
  assert.equal(private_.meta.isPublished, false);
});

test("treats PUBLISHED with no linked cocktail as not published", () => {
  // A status the client cannot act on: offering "withdraw" for a cocktail that
  // does not exist would fail every time.
  const payload = buildRecommendationAccessPayload({
    id: "rec_1",
    sessionId: "sess_1",
    cocktail,
    status: RecommendationStatus.PUBLISHED,
    publishedCocktailId: undefined,
  });

  assert.equal(payload.meta.isPublished, false);
});
