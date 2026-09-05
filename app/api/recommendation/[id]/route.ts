import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildRecommendationAccessPayload,
  parseRecommendationAccessRequest,
} from "@/lib/recommendation-access";
import {
  getPublishedCocktailSlug,
  getRecommendationSessionById,
} from "@/lib/recommendation-sessions";
import { createRequestId, isSameOrigin } from "@/lib/http/request-context";
import { cocktailLogger } from "@/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = createRequestId();

  try {
    if (!isSameOrigin(request)) {
      return apiError(
        "FORBIDDEN_ORIGIN",
        "Cross-site requests are not allowed.",
        403,
        { requestId },
      );
    }

    const { id } = await params;

    if (!id) {
      return apiError("INVALID_ID", "Missing recommendation id.", 400, {
        requestId,
      });
    }

    const parsedRequest = await parseRecommendationAccessRequest(request);
    if (!parsedRequest.success) {
      return parsedRequest.response;
    }

    const { editToken } = parsedRequest.data;
    const recommendation = await getRecommendationSessionById(id, editToken);

    if (!recommendation) {
      return apiError(
        "FORBIDDEN",
        "You do not have access to this recommendation.",
        403,
        { requestId },
      );
    }

    // Only read when the recommendation claims to be published, so the common
    // private case still costs a single query.
    const publishedSlug = await getPublishedCocktailSlug(
      recommendation.publishedCocktailId,
    );

    return apiSuccess(
      buildRecommendationAccessPayload(recommendation, publishedSlug),
      200,
      { requestId },
    );
  } catch (error) {
    cocktailLogger.error(`Failed to load recommendation session [${requestId}]`, error);
    return apiError("LOAD_FAILED", "Failed to load recommendation.", 500, {
      requestId,
    });
  }
}
