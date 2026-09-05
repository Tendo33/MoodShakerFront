/**
 * Orchestration only: prompt assembly, validation, and the repair retry. Not
 * `server-only`, because it reads no credentials and the provider arrives as a
 * parameter — which is also what makes the call-budget behaviour testable with a
 * stub. The credential-reading provider keeps the marker.
 */

import {
  buildCocktailJsonSchema,
  type GeneratedCocktail,
  validateGeneratedCocktail,
} from "@/lib/ai/cocktail-schema";
import {
  buildCocktailSystemPrompt,
  buildCocktailUserPrompt,
  buildRepairPrompt,
} from "@/lib/ai/prompts";
import {
  type ChatMessage,
  type LLMProvider,
  ProviderError,
} from "@/lib/ai/provider";
import {
  AgentType,
  type Cocktail,
  type Ingredient,
  type Step,
  type Tool,
} from "@/lib/cocktail-types";
import {
  ALCOHOL_LEVEL_LABELS,
  BASE_SPIRIT_LABELS,
  FLAVOR_PROFILE_LABELS,
} from "@/lib/domain/vocabulary";
import { createLogger } from "@/utils/logger";

const logger = createLogger("CocktailGeneration");

/**
 * Hard ceiling on provider calls per user request: one generation plus at most
 * one repair attempt.
 *
 * The previous stack multiplied retries across layers — a client loop of 2 times
 * `optimizedFetch`'s internal retry of 2 — so a single failing request could
 * cost four generations at `max_tokens: 5000` with no cost ceiling anywhere.
 */
export const MAX_LLM_CALLS_PER_REQUEST = 2;

/** Raised when output never satisfied the schema. Nothing is persisted. */
export class CocktailValidationError extends Error {
  readonly issues: string;

  constructor(issues: string) {
    super("Generated cocktail did not satisfy the output contract.");
    this.name = "CocktailValidationError";
    this.issues = issues;
  }
}

export { ProviderError };

export interface GenerateCocktailInput {
  /** Injected so tests can drive the retry path without a network call. */
  provider: LLMProvider;
  request: {
    answers: Record<string, string>;
    baseSpirits: string[];
    sessionId: string;
    specialRequests?: string;
  };
  language: string;
  agentType: AgentType;
}

/**
 * Extracts the JSON object from a completion.
 *
 * Deliberately strict: it accepts a bare object or one wrapped in a fenced code
 * block, and rejects anything else. The previous implementation ran
 * `completion.match(/\{[\s\S]*\}/)` and cast the result straight to `Cocktail`,
 * which accepted any JSON shape at all and silently defaulted missing fields —
 * that is how a drink named "Unknown Cocktail" reached the database.
 */
function extractJsonPayload(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    return null;
  }
}

function localizedPair(value: { cn: string; en: string }): [string, string] {
  return [value.cn, value.en];
}

function mapIngredient(source: GeneratedCocktail["ingredients"][number]): Ingredient {
  const [name, englishName] = localizedPair(source.name);
  const [amount, englishAmount] = localizedPair(source.amount);

  return {
    name,
    english_name: englishName,
    amount,
    english_amount: englishAmount,
    ...(source.unit
      ? { unit: source.unit.cn, english_unit: source.unit.en }
      : {}),
    ...(source.substitute
      ? {
          substitute: source.substitute.cn,
          english_substitute: source.substitute.en,
        }
      : {}),
  };
}

function mapTool(source: GeneratedCocktail["tools"][number]): Tool {
  const [name, englishName] = localizedPair(source.name);

  return {
    name,
    english_name: englishName,
    ...(source.alternative
      ? {
          alternative: source.alternative.cn,
          english_alternative: source.alternative.en,
        }
      : {}),
  };
}

function mapStep(source: GeneratedCocktail["steps"][number]): Step {
  const [description, englishDescription] = localizedPair(source.description);

  return {
    step_number: source.stepNumber,
    description,
    english_description: englishDescription,
    ...(source.tips
      ? { tips: source.tips.cn, english_tips: source.tips.en }
      : {}),
  };
}

/**
 * Maps validated output onto the legacy `Cocktail` shape.
 *
 * Enumerable fields are rendered to their display labels rather than stored as
 * raw codes, because the current columns and the whole display layer read these
 * values directly — writing `"rum"` would make `/cn` render "rum" instead of
 * "朗姆酒". The improvement over the previous code is that both languages now come
 * from one label map instead of `inferEnglishBaseSpirit` guessing English from a
 * Chinese substring. The columns switch to codes in the data-model batch, at
 * which point this mapper collapses.
 */
export function mapGeneratedCocktail(source: GeneratedCocktail): Cocktail {
  const [name, englishName] = localizedPair(source.name);
  const [description, englishDescription] = localizedPair(source.description);
  const [matchReason, englishMatchReason] = localizedPair(source.matchReason);
  const [servingGlass, englishServingGlass] = localizedPair(source.servingGlass);
  const [timeRequired, englishTimeRequired] = localizedPair(source.timeRequired);

  return {
    name,
    english_name: englishName,
    description,
    english_description: englishDescription,
    match_reason: matchReason,
    english_match_reason: englishMatchReason,
    base_spirit: BASE_SPIRIT_LABELS[source.baseSpirit].cn,
    english_base_spirit: BASE_SPIRIT_LABELS[source.baseSpirit].en,
    alcohol_level: ALCOHOL_LEVEL_LABELS[source.alcoholLevel].cn,
    english_alcohol_level: ALCOHOL_LEVEL_LABELS[source.alcoholLevel].en,
    serving_glass: servingGlass,
    english_serving_glass: englishServingGlass,
    time_required: timeRequired,
    english_time_required: englishTimeRequired,
    flavor_profiles: source.flavorProfiles.map(
      (code) => FLAVOR_PROFILE_LABELS[code].cn,
    ),
    english_flavor_profiles: source.flavorProfiles.map(
      (code) => FLAVOR_PROFILE_LABELS[code].en,
    ),
    ingredients: source.ingredients.map(mapIngredient),
    tools: source.tools.map(mapTool),
    steps: source.steps.map(mapStep),
  };
}

/**
 * Generates a cocktail recommendation.
 *
 * Output must pass schema validation before it is returned. On failure the model
 * gets exactly one repair attempt carrying the specific issues; if that also
 * fails the call throws and the route persists nothing.
 */
export async function generateCocktailRecommendation(
  input: GenerateCocktailInput,
): Promise<Cocktail> {
  const { provider } = input;
  const jsonSchema = {
    name: "cocktail_recommendation",
    schema: buildCocktailJsonSchema(),
  };

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: buildCocktailSystemPrompt(input.agentType, input.language),
    },
    {
      role: "user",
      content: buildCocktailUserPrompt({
        answers: input.request.answers,
        baseSpirits: input.request.baseSpirits,
        specialRequests: input.request.specialRequests,
        language: input.language,
      }),
    },
  ];

  let lastIssues = "";
  let totalTokens = 0;

  for (let attempt = 1; attempt <= MAX_LLM_CALLS_PER_REQUEST; attempt += 1) {
    const result = await provider.createChatCompletion({
      messages,
      temperature: 0.8,
      maxTokens: 4000,
      jsonSchema,
    });

    totalTokens += result.usage?.totalTokens ?? 0;

    const payload = extractJsonPayload(result.content);
    if (payload === null) {
      lastIssues = "- (root): response was not valid JSON";
    } else {
      const validation = validateGeneratedCocktail(payload);

      if (validation.ok) {
        logger.info("Cocktail generated", {
          attempt,
          totalTokens,
          repaired: attempt > 1,
        });
        return mapGeneratedCocktail(validation.cocktail);
      }

      lastIssues = validation.issues;
    }

    logger.warn("Generated cocktail failed validation", {
      attempt,
      issues: lastIssues,
    });

    if (attempt < MAX_LLM_CALLS_PER_REQUEST) {
      messages.push({ role: "assistant", content: result.content });
      messages.push({ role: "user", content: buildRepairPrompt(lastIssues) });
    }
  }

  logger.error("Cocktail generation exhausted its call budget", {
    calls: MAX_LLM_CALLS_PER_REQUEST,
    totalTokens,
    issues: lastIssues,
  });

  throw new CocktailValidationError(lastIssues);
}
