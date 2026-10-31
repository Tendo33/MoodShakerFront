import { buildImagePrompt } from "@/lib/ai/prompts";
import { generateImage, ProviderError } from "@/lib/ai/provider";
import { authorizeDrink } from "@/lib/authorize";
import { setDrinkImage, toView } from "@/lib/db/drinks";
import { consumeRateLimit } from "@/lib/db/rate-limit";
import { createRequestId, fail, getClientIp, ok, rateLimitHeaders } from "@/lib/http";
import { logger } from "@/lib/log";
import { assertStorageConfigured, deleteImages, storeImage, StorageError } from "@/lib/storage";

/**
 * Photographs a private drink. The prompt is built here from the stored recipe;
 * the caller only proves ownership. Any failure leaves the row untouched.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let requestId = createRequestId();
  const log = logger("image");

  try {
    const auth = await authorizeDrink(request, params);
    if (!auth.ok) return auth.response;
    const { row } = auth;
    requestId = auth.requestId;

    // Per drink stops hammering one recipe; per IP bounds total spend across drinks.
    const [perDrink, perIp] = await Promise.all([
      consumeRateLimit(`image:${row.id}`, 3, 60_000),
      consumeRateLimit(`image-ip:${getClientIp(request)}`, 12, 60 * 60_000),
    ]);
    const limit = perDrink.allowed ? perIp : perDrink;
    const headers = rateLimitHeaders(limit);
    if (!limit.allowed) return fail("RATE_LIMITED", 429, requestId, headers);

    assertStorageConfigured();
    const sourceUrl = await generateImage(buildImagePrompt(row.recipe));
    const stored = await storeImage(row.id, sourceUrl);
    const updated = await setDrinkImage(row.id, stored.imageUrl, stored.thumbnailUrl);
    if (!updated) return fail("NOT_FOUND", 404, requestId, headers);

    // Only after the new URLs are committed, so nothing still referenced is deleted.
    void deleteImages([row.imageUrl, row.thumbnailUrl]);

    log.info("Image stored", { requestId, drinkId: row.id });
    return ok(toView(updated), { headers });
  } catch (error) {
    log.error("Image failed", { requestId, error });
    if (error instanceof StorageError && error.stage === "config") {
      return fail("SERVICE_UNAVAILABLE", 503, requestId);
    }
    if (error instanceof ProviderError || error instanceof StorageError) {
      return fail("IMAGE_FAILED", 502, requestId);
    }
    return fail("INTERNAL", 500, requestId);
  }
}
