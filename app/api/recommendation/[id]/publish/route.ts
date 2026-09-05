import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess } from "@/lib/api-response";
import { LOCALES } from "@/lib/i18n/config";
import {
  createRequestId,
  getClientIp,
  isSameOrigin,
} from "@/lib/http/request-context";
import {
  publishRecommendation,
  withdrawRecommendation,
} from "@/lib/publish-cocktail";
import { buildRateLimitHeaders, consumeRateLimit } from "@/lib/rate-limit";
import { parseRecommendationAccessRequest } from "@/lib/recommendation-access";
import { createLogger } from "@/utils/logger";

const logger = createLogger("PublishRoute");

/**
 * Invalidates the cached pages a publish or withdrawal changes.
 *
 * Without this, publishing succeeded in the database and changed nothing a visitor
 * could see: the gallery kept serving its cached list, and after a withdrawal the
 * public cocktail page kept returning 200 for a row that no longer existed. Both
 * were observed before this was added — the repository had no `revalidatePath` call
 * anywhere, because until now nothing ever wrote to the published set.
 *
 * Both locales, because a cocktail is published to both at once.
 */
function revalidatePublishedPaths(slug: string | null) {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/gallery`);
    if (slug) revalidatePath(`/${locale}/cocktail/${slug}`);
  }

  // The sitemap lists every cocktail, so it is stale too.
  revalidatePath("/sitemap.xml");
}

/**
 * Publishing and withdrawing a recommendation.
 *
 * `POST` publishes, `DELETE` withdraws. Both take the edit token in the request
 * body — never the URL — matching `/api/recommendation/[id]`. A token in a URL ends
 * up in server logs, browser history, and `Referer` headers.
 *
 * The schema has had `PUBLISHED` and `publishedCocktailId` from the start with
 * nothing ever writing them, so every recommendation stayed private and the
 * gallery only ever showed seeded rows.
 */

/** Publishes to the public gallery. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = createRequestId();
  const requestLogger = logger.forRequest(requestId);

  if (!isSameOrigin(request)) {
    return apiError(
      "FORBIDDEN_ORIGIN",
      "Request origin is not allowed.",
      403,
    );
  }

  const { id } = await params;
  if (!id) {
    return apiError("INVALID_ID", "Missing recommendation id.", 400);
  }

  const parsed = await parseRecommendationAccessRequest(request);
  if (!parsed.success) return parsed.response;

  // Tighter than generation, and keyed on IP rather than recommendation: the cost
  // being limited is public rows appearing in the gallery, not compute.
  const rateLimit = await consumeRateLimit(
    `publish:${getClientIp(request)}`,
    10,
    60 * 60 * 1000,
  );

  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many publish requests. Please try again later.",
      429,
      { headers: buildRateLimitHeaders(rateLimit) },
    );
  }

  try {
    const result = await publishRecommendation({
      recommendationId: id,
      editToken: parsed.data.editToken,
    });

    if (!result.ok) {
      switch (result.reason) {
        case "NOT_FOUND":
          // Deliberately does not distinguish an unknown id from a wrong token:
          // telling them apart turns this into an id oracle.
          return apiError(
            "NOT_FOUND",
            "Recommendation not found or access denied.",
            404,
            { headers: buildRateLimitHeaders(rateLimit) },
          );
        case "UNREADABLE_PAYLOAD":
          return apiError(
            "UNREADABLE_PAYLOAD",
            "This recommendation cannot be published because its data is incomplete.",
            422,
            { headers: buildRateLimitHeaders(rateLimit) },
          );
        case "SLUG_CONFLICT":
          return apiError(
            "SLUG_CONFLICT",
            "Another cocktail claimed this URL. Please retry.",
            409,
            { headers: buildRateLimitHeaders(rateLimit) },
          );
      }
    }

    revalidatePublishedPaths(result.slug);

    return apiSuccess(
      {
        slug: result.slug,
        // Where the published cocktail now lives. The client should not have to
        // know how a cocktail URL is built.
        url: `/cocktail/${result.slug}`,
        alreadyPublished: result.alreadyPublished,
      },
      200,
      { headers: buildRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    requestLogger.error("Failed to publish recommendation", { id, error });
    // `requestId` in the body so a user-reported failure can be matched to the log
    // line that explains it.
    return apiError(
      "PUBLISH_FAILED",
      "Could not publish this recommendation.",
      500,
      { requestId },
    );
  }
}

/** Removes a published cocktail from the gallery, keeping the recommendation. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = createRequestId();
  const requestLogger = logger.forRequest(requestId);

  if (!isSameOrigin(request)) {
    return apiError("FORBIDDEN_ORIGIN", "Request origin is not allowed.", 403);
  }

  const { id } = await params;
  if (!id) {
    return apiError("INVALID_ID", "Missing recommendation id.", 400);
  }

  const parsed = await parseRecommendationAccessRequest(request);
  if (!parsed.success) return parsed.response;

  try {
    const result = await withdrawRecommendation({
      recommendationId: id,
      editToken: parsed.data.editToken,
    });

    if (!result.ok) {
      return apiError(
        "NOT_FOUND",
        "Recommendation not found or access denied.",
        404,
      );
    }

    // Must run even when nothing was published: the caller may be retrying after a
    // failure, and an extra invalidation is cheap next to a page that keeps serving
    // a cocktail that no longer exists.
    revalidatePublishedPaths(result.slug);

    return apiSuccess({ wasPublished: result.wasPublished }, 200);
  } catch (error) {
    requestLogger.error("Failed to withdraw recommendation", { id, error });
    return apiError(
      "WITHDRAW_FAILED",
      "Could not withdraw this recommendation.",
      500,
      { requestId },
    );
  }
}
