import { prisma } from "@/lib/prisma";
import type { Cocktail, GalleryCocktail } from "@/api/cocktail";
import { popularCocktails } from "@/services/cocktailService";

function normalizeAlcoholLevel(level: string): string {
	if (!level) return "中度";
	if (level === "Low" || level === "低") return "低度";
	if (level === "Medium" || level === "中") return "中度";
	if (level === "High" || level === "高") return "高度";
	return level;
}

function normalizeBaseSpirit(spirit: string): string {
	if (!spirit) return "其他";
	const s = spirit.toLowerCase();
	if (s.includes("vodka")) return "伏特加";
	if (s.includes("gin")) return "金酒";
	if (s.includes("rum") || s.includes("朗姆")) return "朗姆酒";
	if (s.includes("tequila")) return "龙舌兰";
	if (s.includes("whiskey") || s.includes("whisky")) return "威士忌";
	if (s.includes("brandy")) return "白兰地";
	return spirit;
}

function inferEnglishBaseSpirit(spirit: string, englishSpirit: string | null | undefined): string {
	if (englishSpirit) return englishSpirit;
	if (!spirit) return "Other";
	const s = spirit.toLowerCase();
	if (s.includes("伏特加")) return "Vodka";
	if (s.includes("金酒")) return "Gin";
	if (s.includes("朗姆")) return "Rum";
	if (s.includes("龙舌兰")) return "Tequila";
	if (s.includes("威士忌")) return "Whiskey";
	if (s.includes("白兰地")) return "Brandy";
	return spirit; // Fallback to original if unknown
}

function inferEnglishAlcoholLevel(level: string, englishLevel: string | null | undefined): string {
	if (englishLevel) return englishLevel;
	if (!level) return "Medium";
	if (level.includes("低")) return "Low";
	if (level.includes("中")) return "Medium";
	if (level.includes("高")) return "High";
	return "Medium";
}

function mapDBCocktailToAppCocktail(dbCocktail: any): Cocktail {
	const normalizedLevel = normalizeAlcoholLevel(dbCocktail.alcoholLevel);
	const normalizedSpirit = normalizeBaseSpirit(dbCocktail.baseSpirit);

	return {
		id: dbCocktail.id,
		name: dbCocktail.name,
		english_name: dbCocktail.englishName || dbCocktail.name,
		description: dbCocktail.description,
		english_description: dbCocktail.englishDescription || dbCocktail.description, // Fallback to description
		match_reason: dbCocktail.matchReason || "",
		english_match_reason: dbCocktail.englishMatchReason,
		base_spirit: normalizedSpirit,
		english_base_spirit: inferEnglishBaseSpirit(dbCocktail.baseSpirit, dbCocktail.englishBaseSpirit),
		alcohol_level: normalizedLevel,
		english_alcohol_level: inferEnglishAlcoholLevel(dbCocktail.alcoholLevel, dbCocktail.englishAlcoholLevel),
		serving_glass: dbCocktail.servingGlass,
		english_serving_glass: dbCocktail.englishServingGlass,
		time_required: dbCocktail.timeRequired,
		english_time_required: dbCocktail.englishTimeRequired,
		flavor_profiles: dbCocktail.flavorProfiles,
		english_flavor_profiles: dbCocktail.englishFlavorProfiles || [],
		ingredients: dbCocktail.ingredients as any,
		tools: dbCocktail.tools as any,
		steps: dbCocktail.steps as any,
		image: dbCocktail.image,
		thumbnail: dbCocktail.thumbnail || undefined,
	};
}

function mapCocktailToGalleryCocktail(cocktail: Cocktail): GalleryCocktail {
  return {
    id: cocktail.id,
    name: cocktail.name,
    english_name: cocktail.english_name,
    description: cocktail.description,
    english_description: cocktail.english_description,
    base_spirit: cocktail.base_spirit,
    english_base_spirit: cocktail.english_base_spirit,
    alcohol_level: cocktail.alcohol_level,
    english_alcohol_level: cocktail.english_alcohol_level,
    flavor_profiles: cocktail.flavor_profiles,
    english_flavor_profiles: cocktail.english_flavor_profiles,
    ingredients: cocktail.ingredients,
    image: cocktail.image,
    thumbnail: cocktail.thumbnail,
  };
}

function mapDBGalleryCocktail(dbCocktail: any): GalleryCocktail {
  const normalizedLevel = normalizeAlcoholLevel(dbCocktail.alcoholLevel);
  const normalizedSpirit = normalizeBaseSpirit(dbCocktail.baseSpirit);

  return {
    id: dbCocktail.id,
    name: dbCocktail.name,
    english_name: dbCocktail.englishName || dbCocktail.name,
    description: dbCocktail.description,
    english_description: dbCocktail.englishDescription || dbCocktail.description,
    base_spirit: normalizedSpirit,
    english_base_spirit: inferEnglishBaseSpirit(
      dbCocktail.baseSpirit,
      dbCocktail.englishBaseSpirit,
    ),
    alcohol_level: normalizedLevel,
    english_alcohol_level: inferEnglishAlcoholLevel(
      dbCocktail.alcoholLevel,
      dbCocktail.englishAlcoholLevel,
    ),
    flavor_profiles: dbCocktail.flavorProfiles,
    english_flavor_profiles: dbCocktail.englishFlavorProfiles || [],
    ingredients: dbCocktail.ingredients as any,
    image: dbCocktail.image,
    thumbnail: dbCocktail.thumbnail || undefined,
  };
}

export async function getAllCocktails(): Promise<Cocktail[]> {
  // Check if we're in build time (no DATABASE_URL means we're building)
  const isBuildTime = !process.env.DATABASE_URL || 
    process.env.DATABASE_URL.includes('placeholder');

  // During build time, return empty array or popular cocktails
  if (isBuildTime) {
    return Object.values(popularCocktails);
  }

  try {
    const cocktails = await prisma.cocktail.findMany({
      orderBy: { createdAt: "desc" },
    });
    return cocktails.map(mapDBCocktailToAppCocktail);
  } catch (error) {
    console.error("Error fetching cocktails from DB:", error);
    return Object.values(popularCocktails);
  }
}

export async function getGalleryCocktails(): Promise<GalleryCocktail[]> {
  const isBuildTime =
    !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder");

  if (isBuildTime) {
    return Object.values(popularCocktails).map(mapCocktailToGalleryCocktail);
  }

  try {
    const cocktails = await prisma.cocktail.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        englishName: true,
        description: true,
        englishDescription: true,
        baseSpirit: true,
        englishBaseSpirit: true,
        alcoholLevel: true,
        englishAlcoholLevel: true,
        flavorProfiles: true,
        englishFlavorProfiles: true,
        ingredients: true,
        image: true,
        thumbnail: true,
      },
    });
    return cocktails.map(mapDBGalleryCocktail);
  } catch (error) {
    console.error("Error fetching gallery cocktails from DB:", error);
    return Object.values(popularCocktails).map(mapCocktailToGalleryCocktail);
  }
}

export async function getCocktailFromDB(id: string): Promise<Cocktail | null> {
  // Check if we're in build time (no DATABASE_URL means we're building)
  const isBuildTime = !process.env.DATABASE_URL || 
    process.env.DATABASE_URL.includes('placeholder');

  // During build time, only use popular cocktails
  if (isBuildTime) {
    return popularCocktails[id] || null;
  }

  try {
    // At runtime, try to fetch from DB first
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
