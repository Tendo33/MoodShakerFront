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
import { getClientIp, isSameOrigin } from "@/lib/http/request-context";

export async function POST(request: NextRequest) {
  const requestId = generateCocktailId();
  const startTime = Date.now();

  try {
    if (!isSameOrigin(request)) {
      return apiError(
        "FORBIDDEN_ORIGIN",
        "Cross-site requests are not allowed.",
        403,
        { requestId },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(
        "INVALID_PAYLOAD",
        "Request body must be valid JSON.",
        400,
        { requestId },
      );
    }

    const validated = validateCocktailRequest({
      agentType: AgentType.CLASSIC_BARTENDER,
      language: "en",
      ...(typeof body === "object" && body !== null ? body : {}),
    });

    if (!validated.success) {
      return apiError("INVALID_PAYLOAD", validated.message, 400, { requestId });
    }

    const { sessionId, language, agentType, answers, baseSpirits, specialRequests } =
      validated.data;
    // Uses the trusted-proxy-aware resolver: the previous implementation took
    // the left-most x-forwarded-for entry, which a client can set freely to
    // land in a fresh rate-limit bucket on every request.
    const ip = getClientIp(request);
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
        { requestId, headers: buildRateLimitHeaders(rateLimit) },
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
        { requestId },
      );
    }

    return apiError(
      "COCKTAIL_GENERATION_FAILED",
      "Unable to generate a cocktail recommendation right now.",
      500,
      { requestId },
    );
  }
}
