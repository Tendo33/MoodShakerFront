import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getCocktailById } from "@/lib/cocktail-data";
import { cocktailLogger } from "@/utils/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return apiError("INVALID_ID", "Missing cocktail id.", 400);
  }

  try {
    const cocktail = await getCocktailById(id);
    if (!cocktail) {
      return apiError("NOT_FOUND", "Cocktail not found.", 404);
    }

    return apiSuccess(cocktail, 200);
  } catch (error) {
    cocktailLogger.error("Failed to load cocktail detail", error);
    return apiError("LOAD_FAILED", "Failed to load cocktail.", 500);
  }
}
