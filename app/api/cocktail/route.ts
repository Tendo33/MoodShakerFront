import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion } from "@/api/openai";
import { generateCocktailId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import type { BartenderRequest, Cocktail } from "@/api/cocktail";
import { AgentType } from "@/api/cocktail";
import { createSystemPrompt } from "@/utils/prompts";
import { prisma } from "@/lib/prisma";

/**
 * 创建用户消息
 */
function createUserMessage(
  request: BartenderRequest,
  language: string,
): string {
  const answersText = Object.entries(request.answers)
    .map(([questionId, answerId]) => `${questionId}: ${answerId}`)
    .join(", ");

  if (language === "en") {
    let message = `User Requirements based on mood questionnaire: ${answersText}\n`;
    if (request.baseSpirits && request.baseSpirits.length > 0) {
      message += `Available Base Spirits: ${request.baseSpirits.join(", ")}\n`;
    }
    if (request.specialRequests && request.specialRequests.trim() !== "") {
      message += `SPECIAL REQUESTS: ${request.specialRequests}\n`;
    }
    return message;
  } else {
    let message = `用户基于心情问卷的需求: ${answersText}\n`;
    if (request.baseSpirits && request.baseSpirits.length > 0) {
      message += `可用的基酒: ${request.baseSpirits.join(", ")}\n`;
    }
    if (request.specialRequests && request.specialRequests.trim() !== "") {
      message += `特殊要求: ${request.specialRequests}\n`;
    }
    return message;
  }
}

/**
 * 解析鸡尾酒数据
 */
function parseCocktailFromCompletion(completion: string): Cocktail {
  try {
    const jsonMatch = completion.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in completion");
    }

    const cocktail = JSON.parse(jsonMatch[0]) as Cocktail;

    return {
      name: cocktail.name || "Unknown Cocktail",
      english_name: cocktail.english_name || "",
      description: cocktail.description || "No description available",
      english_description: cocktail.english_description || "",
      match_reason:
        cocktail.match_reason || "This cocktail matches your preferences",
      english_match_reason: cocktail.english_match_reason || "",
      base_spirit: cocktail.base_spirit || "Various",
      english_base_spirit: cocktail.english_base_spirit || "",
      alcohol_level: cocktail.alcohol_level || "medium",
      english_alcohol_level: cocktail.english_alcohol_level || "",
      serving_glass: cocktail.serving_glass || "Cocktail glass",
      english_serving_glass: cocktail.english_serving_glass || "",
      time_required: cocktail.time_required || "5 minutes",
      english_time_required: cocktail.english_time_required || "",
      flavor_profiles: cocktail.flavor_profiles || ["balanced"],
      english_flavor_profiles: cocktail.english_flavor_profiles || [],
      ingredients: cocktail.ingredients || [],
      tools: cocktail.tools || [],
      steps: cocktail.steps || [],
    };
  } catch (error) {
    cocktailLogger.error("Failed to parse cocktail data", error);
    throw new Error("无法解析鸡尾酒数据");
  }
}

/**
 * POST /api/cocktail
 * 生成鸡尾酒推荐
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

    // 创建 prompt
    const systemPrompt = createSystemPrompt(agentType, language);
    const userMessage = createUserMessage(
      { answers, baseSpirits, sessionId, specialRequests },
      language,
    );

    // 调用 OpenAI API
    const completion = await getChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        temperature: 0.8,
        max_tokens: 5000,
      },
    );

    // 解析结果
    const cocktail = parseCocktailFromCompletion(completion);

    // Save to Database
    try {
      const existingCocktail = await prisma.cocktail.findFirst({
        where: { name: cocktail.name },
      });

      if (existingCocktail) {
        cocktail.id = existingCocktail.id;
        if (existingCocktail.image) {
          cocktail.image = existingCocktail.image;
        }
        cocktailLogger.info(`Found existing cocktail in DB: ${cocktail.name}`);
      } else {
        const newCocktail = await prisma.cocktail.create({
          data: {
            name: cocktail.name,
            englishName: cocktail.english_name,
            description: cocktail.description,
            englishDescription: cocktail.english_description,
            matchReason: cocktail.match_reason,
            englishMatchReason: cocktail.english_match_reason,
            baseSpirit: cocktail.base_spirit,
            englishBaseSpirit: cocktail.english_base_spirit,
            alcoholLevel: cocktail.alcohol_level,
            englishAlcoholLevel: cocktail.english_alcohol_level,
            servingGlass: cocktail.serving_glass,
            englishServingGlass: cocktail.english_serving_glass,
            timeRequired: cocktail.time_required || "5 mins",
            englishTimeRequired: cocktail.english_time_required,
            flavorProfiles: cocktail.flavor_profiles,
            englishFlavorProfiles: cocktail.english_flavor_profiles || [],
            ingredients: cocktail.ingredients as any,
            tools: cocktail.tools as any,
            steps: cocktail.steps as any,
          },
        });
        cocktail.id = newCocktail.id;
        cocktailLogger.info(`Saved new cocktail to DB: ${cocktail.name}`);
      }
    } catch (dbError) {
      cocktailLogger.error("Failed to save cocktail to DB", dbError);
      // Don't fail the request if DB save fails, just log it
    }

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
