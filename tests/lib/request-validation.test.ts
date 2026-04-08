import test from "node:test";
import assert from "node:assert/strict";
import { validateRecommendationAccessRequest } from "../../lib/request-validation";

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
