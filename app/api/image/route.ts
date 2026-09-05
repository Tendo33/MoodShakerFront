import { NextRequest } from "next/server";
import { generateImage } from "@/api/openai";
import { buildImagePrompt } from "@/lib/ai/image-prompt";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createRequestId, isSameOrigin } from "@/lib/http/request-context";
import { buildRateLimitHeaders, consumeRateLimit } from "@/lib/rate-limit";
import {
  getRecommendationSessionById,
  updateRecommendationSessionImageUrls,
} from "@/lib/recommendation-sessions";
import { validateImageRequest } from "@/lib/request-validation";
import { DeploymentDependencyError } from "@/lib/runtime-errors";
import {
  ImagePipelineError,
  deleteStoredImages,
  storeGeneratedImage,
} from "@/lib/storage/image-pipeline";
import { imageLogger } from "@/utils/logger";

const IMAGE_RATE_LIMIT = 3;
const IMAGE_RATE_WINDOW_MS = 60 * 1000;

/**
 * Generates and stores the image for a private recommendation.
 *
 * The caller supplies only `{ recommendationId, editToken }`. The prompt is
 * derived on the server from the stored cocktail payload, which is what closes
 * the previous open image-generation proxy.
 *
 * Every failure path leaves the database untouched. Persisting the provider's
 * temporary URL on a partial failure — as the previous implementation did on
 * transcoding errors — stores a link that dies within hours.
 */
export async function POST(request: NextRequest) {
  const requestId = createRequestId();

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

    const validated = validateImageRequest(body);
    if (!validated.success) {
      return apiError("INVALID_PAYLOAD", validated.message, 400, { requestId });
    }

    const { recommendationId, editToken } = validated.data;
    const recommendation = await getRecommendationSessionById(
      recommendationId,
      editToken,
    );

    if (!recommendation) {
      return apiError(
        "FORBIDDEN",
        "You do not have permission to update this recommendation.",
        403,
        { requestId },
      );
    }

    const rateLimit = await consumeRateLimit(
      `image:${recommendationId}`,
      IMAGE_RATE_LIMIT,
      IMAGE_RATE_WINDOW_MS,
    );

    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Image refresh is happening too frequently. Please wait a moment.",
        429,
        { requestId, headers: buildRateLimitHeaders(rateLimit) },
      );
    }

    const prompt = buildImagePrompt(recommendation.cocktail);

    let sourceUrl: string;
    try {
      sourceUrl = await generateImage(prompt, {
        negative_prompt: "low quality, blurry, distorted",
        image_size: "1024x1024",
      });
    } catch (error) {
      imageLogger.error(`Image provider failed [${requestId}]`, {
        recommendationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return apiError(
        "IMAGE_PROVIDER_FAILED",
        "The image service could not generate an image right now.",
        502,
        { requestId, headers: buildRateLimitHeaders(rateLimit) },
      );
    }

    const previousUrls = [
      recommendation.image,
      recommendation.thumbnail,
    ].filter((value): value is string => typeof value === "string");

    const stored = await storeGeneratedImage({ recommendationId, sourceUrl });

    const updated = await updateRecommendationSessionImageUrls({
      id: recommendationId,
      editToken,
      imageUrl: stored.imageUrl,
      thumbnailUrl: stored.thumbnailUrl,
    });

    if (!updated) {
      return apiError("NOT_FOUND", "Recommendation not found.", 404, {
        requestId,
        headers: buildRateLimitHeaders(rateLimit),
      });
    }

    // Best effort, and only after the new URLs are committed: deleting first
    // would risk removing an object that is still referenced.
    void deleteStoredImages(previousUrls).catch(() => {
      // deleteStoredImages already logs; a leftover object is harmless.
    });

    imageLogger.info(`Image stored [${requestId}]`, { recommendationId });

    return apiSuccess(stored, 200, {
      requestId,
      headers: buildRateLimitHeaders(rateLimit),
    });
  } catch (error) {
    if (error instanceof ImagePipelineError) {
      const status = error.reason === "IMAGE_PROCESSING_FAILED" ? 500 : 502;
      imageLogger.error(`Image pipeline failed [${requestId}]`, {
        reason: error.reason,
        error: error.message,
      });
      return apiError(
        error.reason,
        "Unable to store the generated cocktail image right now.",
        status,
        { requestId },
      );
    }

    if (error instanceof DeploymentDependencyError) {
      imageLogger.error(`Image storage unavailable [${requestId}]`, {
        code: error.code,
        error: error.message,
      });
      return apiError(
        "OBJECT_STORE_UNAVAILABLE",
        "Image storage is not available. Please try again shortly.",
        503,
        { requestId },
      );
    }

    imageLogger.error(
      `Image generation failed [${requestId}]`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return apiError(
      "IMAGE_GENERATION_FAILED",
      "Unable to generate a cocktail image right now.",
      500,
      { requestId },
    );
  }
}
