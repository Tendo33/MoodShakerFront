import { getChatCompletion } from "@/api/openai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AgentType, BartenderRequest, Cocktail } from "@/lib/cocktail-types";
import { createSystemPrompt } from "@/utils/prompts";
import { cocktailLogger } from "@/utils/logger";

function createUserMessage(request: BartenderRequest, language: string): string {
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
  }

  let message = `用户基于心情问卷的需求: ${answersText}\n`;
  if (request.baseSpirits && request.baseSpirits.length > 0) {
    message += `可用的基酒: ${request.baseSpirits.join(", ")}\n`;
  }
  if (request.specialRequests && request.specialRequests.trim() !== "") {
    message += `特殊要求: ${request.specialRequests}\n`;
  }
  return message;
}

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
    throw new Error("Failed to parse cocktail data");
  }
}

async function persistCocktail(cocktail: Cocktail): Promise<Cocktail> {
  try {
    const existingCocktail = await prisma.cocktail.findFirst({
      where: { name: cocktail.name },
    });

    if (existingCocktail) {
      return {
        ...cocktail,
        id: existingCocktail.id,
        image: existingCocktail.image || cocktail.image,
        thumbnail: existingCocktail.thumbnail || cocktail.thumbnail,
      };
    }

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
        ingredients: cocktail.ingredients as unknown as Prisma.InputJsonValue,
        tools: cocktail.tools as unknown as Prisma.InputJsonValue,
        steps: cocktail.steps as unknown as Prisma.InputJsonValue,
      },
    });

    return { ...cocktail, id: newCocktail.id };
  } catch (error) {
    cocktailLogger.error("Failed to save cocktail to DB", error);
    return cocktail;
  }
}

export async function generateCocktailRecommendation(options: {
  request: BartenderRequest;
  language: string;
  agentType: AgentType;
}): Promise<Cocktail> {
  const { request, language, agentType } = options;
  const systemPrompt = createSystemPrompt(agentType, language);
  const userMessage = createUserMessage(request, language);

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

  const cocktail = parseCocktailFromCompletion(completion);
  const persisted = await persistCocktail(cocktail);
  return persisted;
}
