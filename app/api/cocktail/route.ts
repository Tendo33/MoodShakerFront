import { NextRequest, NextResponse } from "next/server";
import { generateCocktailId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import type { BartenderRequest } from "@/lib/cocktail-types";
import { AgentType } from "@/lib/cocktail-types";
import { generateCocktailRecommendation } from "@/lib/cocktail-generation";

/**
 * POST /api/cocktail
 * Handler for generating cocktail recommendations.
 */
export async function POST(request: NextRequest) {
  const requestId = generateCocktailId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      answers,
      baseSpirits,
      sessionId,
      specialRequests,
      agentType = AgentType.CLASSIC_BARTENDER,
      language = "en",
    } = body as BartenderRequest & {
      agentType?: AgentType;
      language?: string;
    };

    cocktailLogger.info(`Processing cocktail request [${requestId}]`);

    const cocktail = await generateCocktailRecommendation({
      request: { answers, baseSpirits, sessionId, specialRequests },
      language,
      agentType,
    });

    const duration = Date.now() - startTime;
    cocktailLogger.info(
      `Cocktail request completed [${requestId}] (${duration}ms)`,
    );

    return NextResponse.json({ success: true, data: cocktail });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    cocktailLogger.error(
      `Cocktail request failed [${requestId}] (${duration}ms)`,
      errorMessage,
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
