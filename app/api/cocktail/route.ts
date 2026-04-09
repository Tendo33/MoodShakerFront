import { NextRequest } from "next/server";
import { generateCocktailId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { AgentType } from "@/lib/cocktail-types";
import { generateCocktailRecommendation } from "@/lib/cocktail-generation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { buildRateLimitHeaders, consumeRateLimit } from "@/lib/rate-limit";
import { validateCocktailRequest } from "@/lib/request-validation";
import { createRecommendationSession } from "@/lib/recommendation-sessions";
import { DeploymentDependencyError } from "@/lib/runtime-errors";

function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  const requestId = generateCocktailId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validated = validateCocktailRequest({
      agentType: AgentType.CLASSIC_BARTENDER,
      language: "en",
      ...body,
    });

    if (!validated.success) {
      return apiError("INVALID_PAYLOAD", validated.message, 400);
    }

    const { sessionId, language, agentType, answers, baseSpirits, specialRequests } =
      validated.data;
    const ip = getRequestIp(request);
    const rateLimit = await consumeRateLimit(
      `cocktail:${ip}`,
      4,
      5 * 60 * 1000,
    );

    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Too many cocktail generation requests. Please try again shortly.",
        429,
        { headers: buildRateLimitHeaders(rateLimit) },
      );
    }

    cocktailLogger.info(`Processing cocktail request [${requestId}]`);

    const cocktail = await generateCocktailRecommendation({
      request: { answers, baseSpirits, sessionId, specialRequests },
      language,
      agentType,
    });

    const { session, meta } = await createRecommendationSession({
      sessionId,
      language,
      agentType,
      answers,
      baseSpirits,
      specialRequests,
      cocktail,
    });

    const duration = Date.now() - startTime;
    cocktailLogger.info(
      `Cocktail request completed [${requestId}] (${duration}ms)`,
    );

    return apiSuccess(
      {
        cocktail: session.cocktail,
        meta,
      },
      200,
      { headers: buildRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    cocktailLogger.error(
      `Cocktail request failed [${requestId}] (${duration}ms)`,
      error instanceof Error ? error.message : "Unknown error",
    );

    if (error instanceof DeploymentDependencyError) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Cocktail generation is temporarily unavailable while the service is starting up. Please try again shortly.",
        503,
      );
    }

    return apiError(
      "COCKTAIL_GENERATION_FAILED",
      "Unable to generate a cocktail recommendation right now.",
      500,
    );
  }
}
