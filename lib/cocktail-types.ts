import type {
  AlcoholLevelCode,
  BaseSpirit,
  FlavorProfile,
} from "@/lib/domain/vocabulary";
import type { LocalizedText } from "@/lib/i18n/localized";

export enum AgentType {
  CLASSIC_BARTENDER = "classic_bartender",
  CREATIVE_BARTENDER = "creative_bartender",
}

export enum RecommendationStatus {
  PRIVATE = "PRIVATE",
  PUBLISHED = "PUBLISHED",
}

/* ------------------------------------------------------------------ *
 * Stored shape — what lives in the `content` JSONB column
 * ------------------------------------------------------------------ */

/**
 * Recipe content as stored, with every language present.
 *
 * This replaces eight `xxx` / `english_xxx` column pairs. Storing both languages
 * in one value means a read site cannot forget to check the other column, and a
 * third language needs no schema change.
 */
export interface StoredCocktailContent {
  name: LocalizedText;
  description: LocalizedText;
  matchReason: LocalizedText | null;
  servingGlass: LocalizedText;
  timeRequired: LocalizedText;
  ingredients: StoredIngredient[];
  tools: StoredTool[];
  steps: StoredStep[];
}

export interface StoredIngredient {
  name: LocalizedText;
  amount: LocalizedText;
  unit: LocalizedText | null;
  substitute: LocalizedText | null;
}

export interface StoredTool {
  name: LocalizedText;
  alternative: LocalizedText | null;
}

export interface StoredStep {
  stepNumber: number;
  description: LocalizedText;
  tips: LocalizedText | null;
}

/* ------------------------------------------------------------------ *
 * Resolved shape — what the UI receives
 * ------------------------------------------------------------------ */

/**
 * A cocktail with one language already chosen.
 *
 * The data layer resolves the locale once, at the read boundary, so components
 * read `cocktail.name` directly. Previously every display site chose between
 * `name` and `english_name` itself, via a `useLocalizedCocktail` hook that only
 * client components could call — server components silently rendered Chinese.
 *
 * Vocabulary fields appear twice on purpose: the code drives filtering and
 * comparison, the label is for display. Mixing the two is what made filters
 * match on display text.
 */
export interface Cocktail {
  id: string;
  slug: string;

  name: string;
  /**
   * The name in every language.
   *
   * Present because the share card's typography deliberately shows the English
   * name alongside the localized one, as a watermark and a subtitle. That is a
   * design choice, not the old habit of each read site picking a column — which
   * is why this is a separate field rather than an `english_name` twin.
   */
  nameAllLocales: LocalizedText;
  description: string;
  matchReason: string | null;
  servingGlass: string;
  timeRequired: string;

  baseSpirit: BaseSpirit;
  baseSpiritLabel: string;
  alcoholLevel: AlcoholLevelCode;
  alcoholLevelLabel: string;
  flavorProfiles: FlavorProfile[];
  flavorProfileLabels: string[];

  ingredients: Ingredient[];
  tools: Tool[];
  steps: Step[];

  imageUrl: string | null;
  thumbnailUrl: string | null;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string | null;
  substitute: string | null;
}

export interface Tool {
  name: string;
  alternative: string | null;
}

export interface Step {
  stepNumber: number;
  description: string;
  tips: string | null;
}

/** Gallery card projection: enough to render a card, nothing more. */
export interface CocktailSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  baseSpirit: BaseSpirit;
  baseSpiritLabel: string;
  alcoholLevel: AlcoholLevelCode;
  alcoholLevelLabel: string;
  flavorProfiles: FlavorProfile[];
  flavorProfileLabels: string[];
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

/* ------------------------------------------------------------------ *
 * Requests and sessions
 * ------------------------------------------------------------------ */

export interface RecommendationMeta {
  recommendationId: string;
  editToken: string;
  sessionId: string;
}

export interface RecommendationSession {
  id: string;
  sessionId: string;
  editToken: string;
  language: string;
  agentType: AgentType;
  answers: Record<string, string>;
  baseSpirits: string[];
  specialRequests?: string;
  cocktail: Cocktail;
  status: RecommendationStatus;
  publishedCocktailId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecommendationResponse {
  cocktail: Cocktail;
  meta: RecommendationMeta;
}

export interface PaginatedGalleryResult {
  items: CocktailSummary[];
  nextCursor: string | null;
}

export interface BartenderRequest {
  answers: Record<string, string>;
  baseSpirits: string[];
  sessionId: string;
  specialRequests?: string;
}

export interface GalleryQueryFilters {
  spirit?: BaseSpirit;
  alcohol?: AlcoholLevelCode;
  flavor?: FlavorProfile;
  search?: string;
}
