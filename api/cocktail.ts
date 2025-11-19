import { cocktailLogger } from "@/utils/logger";

// Simplified enums
export enum AlcoholLevel {
  ANY = "any",
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum DifficultyLevel {
  ANY = "any",
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum AgentType {
  CLASSIC_BARTENDER = "classic_bartender",
  CREATIVE_BARTENDER = "creative_bartender",
}

// Interface definitions
export interface Ingredient {
  name: string;
  english_name?: string;
  amount: string;
  english_amount?: string;
  unit?: string;
  english_unit?: string;
  substitute?: string;
  english_substitute?: string;
}

export interface Tool {
  name: string;
  english_name?: string;
  alternative?: string;
  english_alternative?: string;
}

export interface Step {
  step_number: number;
  description: string;
  english_description?: string;
  tips?: string;
  english_tips?: string;
}

export interface Cocktail {
  id?: string | number;
  name: string;
  english_name?: string;
  description: string;
  english_description?: string;
  match_reason: string;
  english_match_reason?: string;
  base_spirit: string;
  english_base_spirit?: string;
  alcohol_level: string;
  english_alcohol_level?: string;
  serving_glass: string;
  english_serving_glass?: string;
  time_required?: string;
  english_time_required?: string;
  flavor_profiles: string[];
  english_flavor_profiles?: string[];
  ingredients: Ingredient[];
  tools: Tool[];
  steps: Step[];
  image?: string;
}

export interface BartenderRequest {
  answers: Record<string, string>;
  baseSpirits: string[];
  sessionId: string;
  specialRequests?: string;
}

/**
 * Get cocktail by ID from local storage
 * This function is used to retrieve saved cocktail recommendations
 */
export async function getCocktailById(id: string): Promise<Cocktail | null> {
  try {
    // Try to get from local storage first
    if (typeof window !== "undefined") {
      const savedRecommendation = localStorage.getItem(
        "moodshaker-recommendation",
      );
      if (savedRecommendation) {
        const cocktail = JSON.parse(savedRecommendation);
        if (cocktail && cocktail.id === id) {
          return cocktail;
        }
      }
    }

    // If not found in storage, return null
    // In a real app, this would make an API call to fetch by ID
    return null;
  } catch (error) {
    cocktailLogger.error("Error getting cocktail by ID", error);
    return null;
  }
}
