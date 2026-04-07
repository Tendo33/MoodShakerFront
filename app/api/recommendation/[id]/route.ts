import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getRecommendationSessionById } from "@/lib/recommendation-sessions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const editToken = request.nextUrl.searchParams.get("editToken")?.trim();

  if (!id) {
    return apiError("INVALID_ID", "Missing recommendation id.", 400);
  }

  if (!editToken) {
    return apiError("MISSING_TOKEN", "Missing edit token.", 400);
  }

  const recommendation = await getRecommendationSessionById(id, editToken);

  if (!recommendation) {
    return apiError(
      "FORBIDDEN",
      "You do not have access to this recommendation.",
      403,
    );
  }

  return apiSuccess(
    {
      cocktail: recommendation.cocktail,
      meta: {
        recommendationId: recommendation.id,
        editToken,
        sessionId: recommendation.sessionId,
      },
    },
    200,
  );
}
