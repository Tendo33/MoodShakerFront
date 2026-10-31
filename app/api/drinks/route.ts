import { generateRecipe, RecipeValidationError } from "@/lib/ai/generate";
import { chat, ProviderError } from "@/lib/ai/provider";
import { createDrink } from "@/lib/db/drinks";
import { consumeRateLimit } from "@/lib/db/rate-limit";
import { orderSchema } from "@/lib/domain/order";
import {
  createRequestId,
  fail,
  getClientIp,
  isSameOrigin,
  ok,
  rateLimitHeaders,
  readJson,
} from "@/lib/http";
import { logger } from "@/lib/log";

/** Pours a new private drink. The edit token is returned once, here, and never again. */
export async function POST(request: Request) {
  const requestId = createRequestId();
  const log = logger("pour", { requestId });
  const startedAt = Date.now();

  if (!isSameOrigin(request)) return fail("FORBIDDEN_ORIGIN", 403, requestId);

  const parsed = orderSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail("INVALID_PAYLOAD", 400, requestId);

  try {
    const limit = await consumeRateLimit(`pour:${getClientIp(request)}`, 4, 5 * 60_000);
    const headers = rateLimitHeaders(limit);
    if (!limit.allowed) return fail("RATE_LIMITED", 429, requestId, headers);

    const recipe = await generateRecipe(parsed.data, chat);
    const { drink, editToken } = await createDrink(parsed.data, recipe);

    log.info("Drink poured", { drinkId: drink.id, durationMs: Date.now() - startedAt });
    return ok({ drink, editToken }, { headers });
  } catch (error) {
    log.error("Pour failed", { error, durationMs: Date.now() - startedAt });
    if (error instanceof ProviderError) return fail("PROVIDER_FAILED", 502, requestId);
    if (error instanceof RecipeValidationError) return fail("RECIPE_INVALID", 502, requestId);
    return fail("INTERNAL", 500, requestId);
  }
}
