import { NextRequest } from "next/server";
import { generateCocktailId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { AgentType } from "@/lib/cocktail-types";
import {
  CocktailValidationError,
  generateCocktailRecommendation,
} from "@/lib/ai/cocktail-generation";
import { ProviderError } from "@/lib/ai/provider";
import { getLLMProvider } from "@/lib/ai/providers/openai-compatible";
import { apiError, apiSuccess } from "@/lib/api-response";
import { buildRateLimitHeaders, consumeRateLimit } from "@/lib/rate-limit";
import { validateCocktailRequest } from "@/lib/request-validation";
import { createRecommendationSession } from "@/lib/recommendation-sessions";
import { DeploymentDependencyError } from "@/lib/runtime-errors";
import { getClientIp, isSameOrigin } from "@/lib/http/request-context";

export async function POST(request: NextRequest) {
  const requestId = generateCocktailId();
  // Stamps `requestId` as a field on every line below, rather than interpolating it
  // into each message where a log aggregator cannot filter on it.
  const logger = cocktailLogger.forRequest(requestId);
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

    logger.info("Processing cocktail request");

    const cocktail = await generateCocktailRecommendation({
      provider: getLLMProvider(),
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
    // Duration as a field, not baked into the message: this is the number worth
    // graphing, and `(1843ms)` inside a string cannot be aggregated.
    logger.info("Cocktail request completed", { durationMs: duration });

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
    // The error object itself, not `error.message`. The logger serializes Error's
    // non-enumerable fields, so this keeps the stack and any `cause` — which the
    // previous `.message` extraction discarded at exactly the point they matter.
    logger.error("Cocktail request failed", { durationMs: duration, error });

    if (error instanceof DeploymentDependencyError) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Cocktail generation is temporarily unavailable while the service is starting up. Please try again shortly.",
        503,
        { requestId },
      );
    }

    // The provider itself failed, so this is an upstream outage rather than a
    // fault in our pipeline. Reported separately so the two are not conflated
    // when diagnosing.
    if (error instanceof ProviderError) {
      return apiError(
        "LLM_PROVIDER_FAILED",
        "The recommendation service is unavailable right now. Please try again shortly.",
        502,
        { requestId },
      );
    }

    // Output never satisfied the schema, even after the repair attempt. Nothing
    // was persisted: a partially defaulted record is worse than no record.
    if (error instanceof CocktailValidationError) {
      return apiError(
        "COCKTAIL_SCHEMA_INVALID",
        "The recommendation could not be produced in a usable form. Please try again.",
        502,
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
