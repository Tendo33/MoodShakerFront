import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildRecommendationAccessPayload,
  parseRecommendationAccessRequest,
} from "@/lib/recommendation-access";
import { getRecommendationSessionById } from "@/lib/recommendation-sessions";
import { cocktailLogger } from "@/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return apiError("INVALID_ID", "Missing recommendation id.", 400);
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
      );
    }

    return apiSuccess(buildRecommendationAccessPayload(recommendation), 200);
  } catch (error) {
    cocktailLogger.error("Failed to load recommendation session", error);
    return apiError("LOAD_FAILED", "Failed to load recommendation.", 500);
  }
}
