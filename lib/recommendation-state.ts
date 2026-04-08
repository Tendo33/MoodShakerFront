import type { RecommendationMeta } from "@/lib/cocktail-types";

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasRecoverableRecommendation(
  meta: RecommendationMeta | null | undefined,
): meta is RecommendationMeta {
  return Boolean(
    meta &&
      hasNonEmptyString(meta.recommendationId) &&
      hasNonEmptyString(meta.editToken),
  );
}
