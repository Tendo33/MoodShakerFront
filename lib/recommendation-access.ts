import { apiError } from "@/lib/api-response";
import type { Cocktail, RecommendationSession } from "@/lib/cocktail-types";
// A value import, not type-only: the enum is compared against at runtime.
import { RecommendationStatus } from "@/lib/cocktail-types";
import {
  validateRecommendationAccessRequest,
  type ValidatedRecommendationAccessRequest,
} from "@/lib/request-validation";

export interface RecommendationAccessMeta {
  recommendationId: string;
  sessionId: string;
  /**
   * Whether this recommendation is in the public gallery.
   *
   * The response carried no publish state, so a client had no way to know whether
   * to offer "publish" or "withdraw" — which is part of why nothing ever wrote
   * `PUBLISHED` in the first place.
   */
  isPublished: boolean;
  /** Set when published, so the client can link to the public page. */
  publishedSlug: string | null;
}

export interface RecommendationAccessPayload {
  cocktail: Cocktail;
  meta: RecommendationAccessMeta;
}

export async function parseRecommendationAccessRequest(request: {
  json(): Promise<unknown>;
}): Promise<
  | { success: true; data: ValidatedRecommendationAccessRequest }
  | { success: false; response: Response }
> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: apiError(
        "INVALID_PAYLOAD",
        "Request body must be valid JSON.",
        400,
      ),
    };
  }

  const validated = validateRecommendationAccessRequest(body);
  if (!validated.success) {
    return {
      success: false,
      response: apiError("INVALID_PAYLOAD", validated.message, 400),
    };
  }

  return {
    success: true,
    data: validated.data,
  };
}

export function buildRecommendationAccessPayload(
  recommendation: Pick<
    RecommendationSession,
    "id" | "sessionId" | "cocktail" | "status" | "publishedCocktailId"
  >,
  /**
   * The public cocktail's slug, when it is published.
   *
   * Passed in rather than derived here: resolving it needs a database read, and
   * this module is a pure shaping helper used by more than one route.
   */
  publishedSlug: string | null = null,
): RecommendationAccessPayload {
  return {
    cocktail: recommendation.cocktail,
    meta: {
      recommendationId: recommendation.id,
      sessionId: recommendation.sessionId,
      // Keyed off the link rather than `status` alone: a status of PUBLISHED with
      // no linked cocktail is not something the client can act on.
      isPublished:
        recommendation.status === RecommendationStatus.PUBLISHED &&
        Boolean(recommendation.publishedCocktailId),
      publishedSlug,
    },
  };
}
