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
import { AgentType, type StoredCocktailContent } from "@/lib/cocktail-types";
import type {
  AlcoholLevelCode,
  BaseSpirit,
  FlavorProfile,
} from "@/lib/domain/vocabulary";
import { createLogger } from "@/utils/logger";

const logger = createLogger("CocktailGeneration");

/**
 * A freshly generated cocktail, in the shape it is stored in.
 *
 * Deliberately not the display type: the caller persists this and then resolves
 * it for one locale through `resolveCocktail`, so generated and stored cocktails
 * travel the same rendering path.
 */
export interface GeneratedStoredCocktail {
  content: StoredCocktailContent;
  baseSpirit: BaseSpirit;
  alcoholLevel: AlcoholLevelCode;
  flavorProfiles: FlavorProfile[];
}

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

/**
 * Maps validated output onto the stored shape.
 *
 * Nearly an identity mapping: the generation schema already produces
 * `{ cn, en }` for every text field, which is exactly how content is stored.
 * The previous version expanded each field into a `xxx` / `english_xxx` pair and
 * rendered the vocabulary codes to display labels, because the columns held
 * display text. With codes in the columns, all of that disappears.
 */
export function mapGeneratedCocktail(
  source: GeneratedCocktail,
): GeneratedStoredCocktail {
  return {
    content: {
      name: source.name,
      description: source.description,
      matchReason: source.matchReason,
      servingGlass: source.servingGlass,
      timeRequired: source.timeRequired,
      ingredients: source.ingredients.map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        substitute: item.substitute,
      })),
      tools: source.tools.map((item) => ({
        name: item.name,
        alternative: item.alternative,
      })),
      steps: source.steps.map((item) => ({
        stepNumber: item.stepNumber,
        description: item.description,
        tips: item.tips,
      })),
    },
    baseSpirit: source.baseSpirit,
    alcoholLevel: source.alcoholLevel,
    flavorProfiles: source.flavorProfiles,
  };
}

export async function generateCocktailRecommendation(
  input: GenerateCocktailInput,
): Promise<GeneratedStoredCocktail> {
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
