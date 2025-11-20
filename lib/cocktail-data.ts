import { prisma } from "@/lib/prisma";
import { Cocktail } from "@/api/cocktail";
import { popularCocktails } from "@/services/cocktailService";

function mapDBCocktailToAppCocktail(dbCocktail: any): Cocktail {
  return {
    id: dbCocktail.id,
    name: dbCocktail.name,
    english_name: dbCocktail.englishName,
    description: dbCocktail.description,
    english_description: dbCocktail.englishDescription,
    match_reason: dbCocktail.matchReason || "",
    english_match_reason: dbCocktail.englishMatchReason,
    base_spirit: dbCocktail.baseSpirit,
    english_base_spirit: dbCocktail.englishBaseSpirit,
    alcohol_level: dbCocktail.alcoholLevel,
    english_alcohol_level: dbCocktail.englishAlcoholLevel,
    serving_glass: dbCocktail.servingGlass,
    english_serving_glass: dbCocktail.englishServingGlass,
    time_required: dbCocktail.timeRequired,
    english_time_required: dbCocktail.englishTimeRequired,
    flavor_profiles: dbCocktail.flavorProfiles,
    english_flavor_profiles: dbCocktail.englishFlavorProfiles,
    ingredients: dbCocktail.ingredients as any,
    tools: dbCocktail.tools as any,
    steps: dbCocktail.steps as any,
    image: dbCocktail.image,
  };
}

export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    const cocktails = await prisma.cocktail.findMany({
      orderBy: { createdAt: "desc" },
    });
    return cocktails.map(mapDBCocktailToAppCocktail);
  } catch (error) {
    console.error("Error fetching cocktails from DB:", error);
    return [];
  }
}

export async function getCocktailFromDB(id: string): Promise<Cocktail | null> {
  try {
    // First check if it's a popular cocktail ID (hardcoded)
    // If it is, we might want to return the hardcoded one OR check if we seeded it.
    // For now, let's prioritize DB, then fallback to popularCocktails.

    const dbCocktail = await prisma.cocktail.findUnique({
      where: { id },
    });

    if (dbCocktail) {
      return mapDBCocktailToAppCocktail(dbCocktail);
    }

    // Fallback to popular cocktails if ID matches a key
    if (popularCocktails[id]) {
      return popularCocktails[id];
    }

    return null;
  } catch (error) {
    console.error("Error fetching cocktail from DB:", error);
    // Fallback to popular cocktails on error
    if (popularCocktails[id]) {
      return popularCocktails[id];
    }
    return null;
  }
}
