import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCocktailBySlug } from "@/lib/cocktail-data";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";
import { cocktailLogger } from "@/utils/logger";

/**
 * Public cocktail detail, addressed by slug.
 *
 * Was `/api/cocktail/:id`. The route param carried two different kinds of
 * identifier — UUIDs for generated drinks, and names like `mojito` for the three
 * seeded classics — so a caller could not tell what to pass. Slugs are the single
 * public identifier now.
 *
 * `?lang=` selects the response language and defaults to the project default,
 * because the API returns resolved strings rather than bilingual objects.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug) {
    return apiError("INVALID_SLUG", "Missing cocktail slug.", 400);
  }

  const langParam = request.nextUrl.searchParams.get("lang");
  const locale = langParam && isLocale(langParam) ? langParam : DEFAULT_LOCALE;

  try {
    const cocktail = await getCocktailBySlug(slug, locale);
    if (!cocktail) {
      return apiError("NOT_FOUND", "Cocktail not found.", 404);
    }

    return apiSuccess(cocktail, 200);
  } catch (error) {
    cocktailLogger.error("Failed to load cocktail detail", error);
    if (error instanceof DataSourceUnavailableError) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "Cocktail data is temporarily unavailable.",
        503,
      );
    }
    return apiError("LOAD_FAILED", "Failed to load cocktail.", 500);
  }
}
