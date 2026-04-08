import { apiError } from "@/lib/api-response";
import type { Cocktail, RecommendationSession } from "@/lib/cocktail-types";
import {
  validateRecommendationAccessRequest,
  type ValidatedRecommendationAccessRequest,
} from "@/lib/request-validation";

export interface RecommendationAccessMeta {
  recommendationId: string;
  sessionId: string;
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
  recommendation: Pick<RecommendationSession, "id" | "sessionId" | "cocktail">,
): RecommendationAccessPayload {
  return {
    cocktail: recommendation.cocktail,
    meta: {
      recommendationId: recommendation.id,
      sessionId: recommendation.sessionId,
    },
  };
}
