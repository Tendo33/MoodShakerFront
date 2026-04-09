import test from "node:test";
import assert from "node:assert/strict";
import {
  validateCocktailRequest,
  validateImageRequest,
  validateRecommendationAccessRequest,
} from "../../lib/request-validation";

test("validateCocktailRequest trims accepted values", () => {
  const result = validateCocktailRequest({
    answers: {
      "1": "classic",
      "2": "medium",
      "3": "beginner",
    },
    baseSpirits: ["gin", "rum"],
    sessionId: "  session_123  ",
    specialRequests: "  extra mint please  ",
    agentType: "classic_bartender",
    language: "en",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.sessionId, "session_123");
    assert.equal(result.data.specialRequests, "extra mint please");
  }
});

test("validateCocktailRequest rejects unexpected answer keys", () => {
  const result = validateCocktailRequest({
    answers: {
      "1": "classic",
      "2": "medium",
      "3": "beginner",
      extra: "oops",
    },
    baseSpirits: ["gin"],
    sessionId: "session_123",
    agentType: "classic_bartender",
    language: "en",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Unexpected answer key.");
  }
});

test("validateCocktailRequest rejects unsupported answer values", () => {
  const result = validateCocktailRequest({
    answers: {
      "1": "martini",
      "2": "medium",
      "3": "beginner",
    },
    baseSpirits: ["gin"],
    sessionId: "session_123",
    agentType: "classic_bartender",
    language: "en",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Invalid answer value.");
  }
});

test("validateCocktailRequest rejects too many base spirits", () => {
  const result = validateCocktailRequest({
    answers: {
      "1": "classic",
      "2": "medium",
      "3": "beginner",
    },
    baseSpirits: ["gin", "rum", "vodka", "whiskey", "tequila", "brandy"],
    sessionId: "session_123",
    agentType: "classic_bartender",
    language: "en",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Too many base spirits.");
  }
});

test("validateCocktailRequest rejects overly long special requests", () => {
  const result = validateCocktailRequest({
    answers: {
      "1": "classic",
      "2": "medium",
      "3": "beginner",
    },
    baseSpirits: ["gin"],
    sessionId: "session_123",
    specialRequests: "x".repeat(301),
    agentType: "classic_bartender",
    language: "en",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Special requests must be 300 characters or fewer.");
  }
});

test("validateImageRequest rejects overly long prompt", () => {
  const result = validateImageRequest({
    recommendationId: "rec_123",
    editToken: "secret-token",
    prompt: "x".repeat(1601),
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Prompt must be 1600 characters or fewer.");
  }
});

test("validateRecommendationAccessRequest rejects missing edit token", () => {
  const result = validateRecommendationAccessRequest({});
  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Edit token is required.");
  }
});

test("validateRecommendationAccessRequest trims the edit token", () => {
  const result = validateRecommendationAccessRequest({
    editToken: "  secret-token  ",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.editToken, "secret-token");
  }
});

test("validateRecommendationAccessRequest rejects overly long edit token", () => {
  const result = validateRecommendationAccessRequest({
    editToken: "x".repeat(257),
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.equal(result.message, "Edit token must be 256 characters or fewer.");
  }
});
