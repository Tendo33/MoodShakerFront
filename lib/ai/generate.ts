import type { ChatFn, ChatMessage } from "@/lib/ai/provider";
import { buildRepairPrompt, buildSystemPrompt, buildUserPrompt } from "@/lib/ai/prompts";
import type { Order } from "@/lib/domain/order";
import { draftJsonSchema, parseDraft, toRecipe } from "@/lib/ai/draft";
import type { Recipe } from "@/lib/domain/recipe";

/** One generation plus at most one repair turn. Bounds the cost of a single request. */
export const MAX_CALLS = 2;

/** The model never produced a valid recipe. Nothing is stored. */
export class RecipeValidationError extends Error {
  constructor(readonly issues: string) {
    super("Generated recipe did not satisfy the output contract.");
    this.name = "RecipeValidationError";
  }
}

/** Accepts a bare JSON object or one inside a code fence; anything else is invalid. */
export function parseCompletion(content: string): unknown {
  const body = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export async function generateRecipe(order: Order, chat: ChatFn): Promise<Recipe> {
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(order.style) },
    { role: "user", content: buildUserPrompt(order) },
  ];
  const jsonSchema = { name: "cocktail_recipe", schema: draftJsonSchema() };
  let issues = "";

  for (let call = 1; call <= MAX_CALLS; call += 1) {
    const content = await chat({ messages, jsonSchema });
    const payload = parseCompletion(content);

    if (payload === null) {
      issues = "- (root): response was not valid JSON";
    } else {
      const result = parseDraft(payload);
      if (result.ok) {
        // A mocktail order must never come back with alcohol in it, whatever the model says.
        const { baseSpirit } = result.draft;
        if (order.strength === "none" && result.draft.alcoholLevel !== "none") {
          issues = "- alcoholLevel: the guest asked for no alcohol; return a mocktail with alcoholLevel `none`";
        } else if (
          order.strength !== "none" &&
          order.spirits.length > 0 &&
          !(order.spirits as readonly string[]).includes(baseSpirit)
        ) {
          // The guest only has these bottles; a drink built on another one is useless to them.
          issues = `- baseSpirit: the guest only has ${order.spirits.join(", ")}; build the drink on one of them (classic: choose a different classic that uses one)`;
        } else {
          return toRecipe(result.draft);
        }
      } else {
        issues = result.issues;
      }
    }

    messages.push({ role: "assistant", content }, { role: "user", content: buildRepairPrompt(issues) });
  }

  throw new RecipeValidationError(issues);
}
