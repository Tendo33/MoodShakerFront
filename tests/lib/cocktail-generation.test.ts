import test from "node:test";
import assert from "node:assert/strict";
import {
  CocktailValidationError,
  MAX_LLM_CALLS_PER_REQUEST,
  generateCocktailRecommendation,
  mapGeneratedCocktail,
} from "../../lib/ai/cocktail-generation";
import type {
  ChatCompletionRequest,
  ChatCompletionResult,
  LLMProvider,
} from "../../lib/ai/provider";
import { ProviderError } from "../../lib/ai/provider";
import { AgentType } from "../../lib/cocktail-types";

/** A schema-valid cocktail, used as the baseline for stub responses. */
function validCocktail() {
  return {
    name: { cn: "莫吉托", en: "Mojito" },
    description: { cn: "清爽的古巴经典", en: "A refreshing Cuban classic" },
    matchReason: { cn: "适合放松的夏夜", en: "Fits a relaxed summer evening" },
    servingGlass: { cn: "高球杯", en: "Highball glass" },
    timeRequired: { cn: "5 分钟", en: "5 mins" },
    baseSpirit: "rum",
    alcoholLevel: "low",
    flavorProfiles: ["refreshing", "sour"],
    ingredients: [
      {
        name: { cn: "白朗姆酒", en: "White rum" },
        amount: { cn: "60", en: "60" },
        unit: { cn: "毫升", en: "ml" },
        substitute: null,
      },
    ],
    tools: [{ name: { cn: "捣棒", en: "Muddler" }, alternative: null }],
    steps: [
      {
        stepNumber: 1,
        description: { cn: "捣碎薄荷叶", en: "Muddle the mint leaves" },
        tips: null,
      },
    ],
  };
}

/** Provider stub that replays a scripted list of completions. */
function stubProvider(
  responses: string[],
  options: { supportsJsonSchema?: boolean } = {},
) {
  const calls: ChatCompletionRequest[] = [];

  const provider: LLMProvider = {
    id: "stub",
    supportsJsonSchema: options.supportsJsonSchema ?? false,
    async createChatCompletion(
      request: ChatCompletionRequest,
    ): Promise<ChatCompletionResult> {
      calls.push(request);
      const content = responses[calls.length - 1];
      if (content === undefined) {
        throw new Error(
          `Stub received call ${calls.length} but only ${responses.length} were scripted`,
        );
      }
      return {
        content,
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };
    },
  };

  return { provider, calls };
}

function baseInput(provider: LLMProvider) {
  return {
    provider,
    request: {
      answers: { "1": "classic", "2": "relaxed" },
      baseSpirits: ["rum"],
      sessionId: "session-1",
    },
    language: "cn",
    agentType: AgentType.CLASSIC_BARTENDER,
  };
}

test("returns a cocktail when the first response validates", async () => {
  const { provider, calls } = stubProvider([JSON.stringify(validCocktail())]);

  const cocktail = await generateCocktailRecommendation(baseInput(provider));

  assert.equal(calls.length, 1);
  assert.equal(cocktail.name, "莫吉托");
  assert.equal(cocktail.english_name, "Mojito");
});

test("repairs invalid output on a second attempt", async () => {
  // First response omits required fields — the shape the old code accepted and
  // defaulted into a record named "Unknown Cocktail".
  const { provider, calls } = stubProvider([
    JSON.stringify({ name: { cn: "莫吉托" } }),
    JSON.stringify(validCocktail()),
  ]);

  const cocktail = await generateCocktailRecommendation(baseInput(provider));

  assert.equal(calls.length, 2);
  assert.equal(cocktail.english_name, "Mojito");

  // The repair turn must carry the specific problems, not a generic retry.
  const repairMessages = calls[1].messages;
  assert.equal(repairMessages.at(-1)?.role, "user");
  assert.match(String(repairMessages.at(-1)?.content), /did not satisfy/i);
  assert.match(String(repairMessages.at(-1)?.content), /description/);
  assert.equal(repairMessages.at(-2)?.role, "assistant");
});

test("throws instead of persisting when the repair also fails", async () => {
  const { provider, calls } = stubProvider([
    JSON.stringify({ name: { cn: "莫吉托" } }),
    JSON.stringify({ name: { cn: "莫吉托" } }),
  ]);

  await assert.rejects(
    () => generateCocktailRecommendation(baseInput(provider)),
    CocktailValidationError,
  );

  assert.equal(calls.length, MAX_LLM_CALLS_PER_REQUEST);
});

test("never exceeds the call budget", async () => {
  // Scripting exactly the budget means an extra call would make the stub throw
  // a distinguishable error rather than silently costing another generation.
  const { provider, calls } = stubProvider([
    "not json at all",
    "still not json",
  ]);

  await assert.rejects(() => generateCocktailRecommendation(baseInput(provider)));

  assert.equal(calls.length, 2);
  assert.ok(calls.length <= MAX_LLM_CALLS_PER_REQUEST);
});

test("accepts a response wrapped in a fenced code block", async () => {
  const { provider } = stubProvider([
    "```json\n" + JSON.stringify(validCocktail()) + "\n```",
  ]);

  const cocktail = await generateCocktailRecommendation(baseInput(provider));

  assert.equal(cocktail.english_name, "Mojito");
});

test("rejects prose wrapped around a JSON object", async () => {
  // The old parser ran /\{[\s\S]*\}/ over the whole completion, so trailing or
  // leading commentary still produced a "successful" parse.
  const { provider } = stubProvider([
    "Here you go! " + JSON.stringify(validCocktail()) + " Enjoy!",
    "Here you go! " + JSON.stringify(validCocktail()) + " Enjoy!",
  ]);

  await assert.rejects(
    () => generateCocktailRecommendation(baseInput(provider)),
    CocktailValidationError,
  );
});

test("rejects out-of-vocabulary enum values", async () => {
  const invalid = { ...validCocktail(), baseSpirit: "朗姆酒" };
  const { provider } = stubProvider([
    JSON.stringify(invalid),
    JSON.stringify(invalid),
  ]);

  await assert.rejects(
    () => generateCocktailRecommendation(baseInput(provider)),
    CocktailValidationError,
  );
});

test("rejects output missing one language", async () => {
  const invalid = {
    ...validCocktail(),
    description: { cn: "只有中文", en: "" },
  };
  const { provider } = stubProvider([
    JSON.stringify(invalid),
    JSON.stringify(invalid),
  ]);

  await assert.rejects(
    () => generateCocktailRecommendation(baseInput(provider)),
    CocktailValidationError,
  );
});

test("propagates provider failures without retrying", async () => {
  let calls = 0;
  const provider: LLMProvider = {
    id: "failing",
    supportsJsonSchema: false,
    async createChatCompletion() {
      calls += 1;
      throw new ProviderError("failing", "upstream is down", 502);
    },
  };

  await assert.rejects(
    () => generateCocktailRecommendation(baseInput(provider)),
    ProviderError,
  );

  // An upstream outage is not a validation problem, so the repair turn would
  // only spend money on the same failure.
  assert.equal(calls, 1);
});

test("requests structured output on every call", async () => {
  const { provider, calls } = stubProvider([JSON.stringify(validCocktail())]);

  await generateCocktailRecommendation(baseInput(provider));

  assert.equal(calls[0].jsonSchema?.name, "cocktail_recommendation");
  assert.equal(typeof calls[0].jsonSchema?.schema, "object");
});

test("maps vocabulary codes to labels in both languages", () => {
  const cocktail = mapGeneratedCocktail(validCocktail() as never);

  assert.equal(cocktail.base_spirit, "朗姆酒");
  assert.equal(cocktail.english_base_spirit, "Rum");
  assert.equal(cocktail.alcohol_level, "低度");
  assert.equal(cocktail.english_alcohol_level, "Low");
  assert.deepEqual(cocktail.flavor_profiles, ["清爽", "酸"]);
  assert.deepEqual(cocktail.english_flavor_profiles, ["Refreshing", "Sour"]);
});

test("maps nested bilingual fields", () => {
  const cocktail = mapGeneratedCocktail(validCocktail() as never);

  assert.equal(cocktail.ingredients[0].name, "白朗姆酒");
  assert.equal(cocktail.ingredients[0].english_name, "White rum");
  assert.equal(cocktail.ingredients[0].unit, "毫升");
  assert.equal(cocktail.tools[0].english_name, "Muddler");
  assert.equal(cocktail.steps[0].step_number, 1);
  assert.equal(cocktail.steps[0].english_description, "Muddle the mint leaves");
});

test("omits optional fields that were null", () => {
  const cocktail = mapGeneratedCocktail(validCocktail() as never);

  // Absent rather than an empty string, so the UI can tell "no substitute" from
  // "substitute is blank".
  assert.equal("substitute" in cocktail.ingredients[0], false);
  assert.equal("alternative" in cocktail.tools[0], false);
  assert.equal("tips" in cocktail.steps[0], false);
});
