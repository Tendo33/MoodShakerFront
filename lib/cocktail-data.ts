import { prisma } from "@/lib/prisma";
import { Prisma, type Cocktail as DBCocktail } from "@prisma/client";
import type { Cocktail, GalleryCocktail } from "@/lib/cocktail-types";
import { popularCocktails } from "@/lib/cocktail-catalog";

export interface GalleryQueryFilters {
  search?: string;
  spirit?: string;
  flavor?: string;
  alcohol?: string;
}

const SPIRIT_FILTER_KEYWORDS: Record<string, string[]> = {
  gin: ["gin", "金酒"],
  vodka: ["vodka", "伏特加"],
  rum: ["rum", "朗姆"],
  tequila: ["tequila", "龙舌兰"],
  whiskey: ["whiskey", "whisky", "威士忌"],
  brandy: ["brandy", "白兰地"],
  other: ["other", "其他"],
};

const FLAVOR_FILTER_KEYWORDS: Record<string, string[]> = {
  sweet: ["sweet", "甜"],
  sour: ["sour", "酸"],
  bitter: ["bitter", "苦"],
  fruity: ["fruity", "果"],
  herbal: ["herbal", "草本"],
  smoky: ["smoky", "烟"],
  spicy: ["spicy", "辛"],
  salty: ["salty", "咸"],
  creamy: ["creamy", "奶"],
};

const ALCOHOL_FILTER_KEYWORDS: Record<string, string[]> = {
  low: ["low", "低"],
  medium: ["medium", "中"],
  high: ["high", "高"],
};

function normalizeFilterValue(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSearchValue(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getFilterKeywords(
  value: string | null,
  mapping: Record<string, string[]>,
): string[] {
  if (!value) return [];
  if (mapping[value]) return mapping[value];
  return [value];
}

function capitalizeKeyword(value: string): string {
  if (!value) return value;
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function getQueryValues(filters?: GalleryQueryFilters) {
  const searchValue = normalizeSearchValue(filters?.search);
  const spiritValue = normalizeFilterValue(filters?.spirit);
  const flavorValue = normalizeFilterValue(filters?.flavor);
  const alcoholValue = normalizeFilterValue(filters?.alcohol);

  return {
    searchValue,
    spiritKeywords: getFilterKeywords(spiritValue, SPIRIT_FILTER_KEYWORDS),
    flavorKeywords: getFilterKeywords(flavorValue, FLAVOR_FILTER_KEYWORDS),
    alcoholKeywords: getFilterKeywords(alcoholValue, ALCOHOL_FILTER_KEYWORDS),
  };
}

function filterGalleryCocktailsInMemory(
  cocktails: GalleryCocktail[],
  filters?: GalleryQueryFilters,
): GalleryCocktail[] {
  const { searchValue, spiritKeywords, flavorKeywords, alcoholKeywords } =
    getQueryValues(filters);

  return cocktails.filter((cocktail) => {
    if (searchValue) {
      const searchText = [
        cocktail.name,
        cocktail.english_name,
        cocktail.description,
        cocktail.english_description,
        cocktail.base_spirit,
        cocktail.english_base_spirit,
        ...(cocktail.flavor_profiles || []),
        ...(cocktail.english_flavor_profiles || []),
        ...(cocktail.ingredients || []).flatMap((ingredient) => [
          ingredient.name,
          ingredient.english_name,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchText.includes(searchValue.toLowerCase())) {
        return false;
      }
    }

    if (spiritKeywords.length > 0) {
      const spiritText = `${cocktail.base_spirit || ""} ${cocktail.english_base_spirit || ""}`.toLowerCase();
      if (!spiritKeywords.some((keyword) => spiritText.includes(keyword.toLowerCase()))) {
        return false;
      }
    }

    if (alcoholKeywords.length > 0) {
      const alcoholText = `${cocktail.alcohol_level || ""} ${cocktail.english_alcohol_level || ""}`.toLowerCase();
      if (!alcoholKeywords.some((keyword) => alcoholText.includes(keyword.toLowerCase()))) {
        return false;
      }
    }

    if (flavorKeywords.length > 0) {
      const flavorText = [
        ...(cocktail.flavor_profiles || []),
        ...(cocktail.english_flavor_profiles || []),
      ]
        .join(" ")
        .toLowerCase();

      if (!flavorKeywords.some((keyword) => flavorText.includes(keyword.toLowerCase()))) {
        return false;
      }
    }

    return true;
  });
}

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

function mapDBCocktailToAppCocktail(dbCocktail: DBCocktail): Cocktail {
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
			ingredients: dbCocktail.ingredients as Cocktail["ingredients"],
			tools: dbCocktail.tools as Cocktail["tools"],
			steps: dbCocktail.steps as Cocktail["steps"],
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

function mapDBGalleryCocktail(dbCocktail: DBCocktail): GalleryCocktail {
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
    ingredients: dbCocktail.ingredients as GalleryCocktail["ingredients"],
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

export async function getGalleryCocktails(
  filters?: GalleryQueryFilters,
): Promise<GalleryCocktail[]> {
  const { searchValue, spiritKeywords, flavorKeywords, alcoholKeywords } =
    getQueryValues(filters);
  const isBuildTime =
    !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder");

  if (isBuildTime) {
    return filterGalleryCocktailsInMemory(
      Object.values(popularCocktails).map(mapCocktailToGalleryCocktail),
      filters,
    );
  }

  try {
    const andFilters: Prisma.CocktailWhereInput[] = [];

    if (searchValue) {
      andFilters.push({
        OR: [
          { name: { contains: searchValue, mode: Prisma.QueryMode.insensitive } },
          {
            englishName: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            description: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            englishDescription: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            baseSpirit: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            englishBaseSpirit: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      });
    }

    if (spiritKeywords.length > 0) {
      andFilters.push({
        OR: spiritKeywords.flatMap((keyword) => [
          {
            baseSpirit: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            englishBaseSpirit: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]),
      });
    }

    if (alcoholKeywords.length > 0) {
      andFilters.push({
        OR: alcoholKeywords.flatMap((keyword) => [
          {
            alcoholLevel: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            englishAlcoholLevel: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]),
      });
    }

    if (flavorKeywords.length > 0) {
      const flavorCandidates = Array.from(
        new Set(
          flavorKeywords.flatMap((keyword) => [
            keyword,
            keyword.toLowerCase(),
            capitalizeKeyword(keyword),
          ]),
        ),
      );
      const flavorTextFilters: Prisma.CocktailWhereInput[] = flavorKeywords.flatMap(
        (keyword) => [
          {
            description: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            englishDescription: {
              contains: keyword,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      );

      andFilters.push({
        OR: [
          { flavorProfiles: { hasSome: flavorCandidates } },
          { englishFlavorProfiles: { hasSome: flavorCandidates } },
          ...flavorTextFilters,
        ],
      });
    }

    const cocktails = await prisma.cocktail.findMany({
      where: andFilters.length > 0 ? { AND: andFilters } : undefined,
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
    return filterGalleryCocktailsInMemory(
      Object.values(popularCocktails).map(mapCocktailToGalleryCocktail),
      filters,
    );
  }
}

export async function getCocktailById(id: string): Promise<Cocktail | null> {
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

export function getPopularCocktailIds(): string[] {
  return Object.keys(popularCocktails);
}
