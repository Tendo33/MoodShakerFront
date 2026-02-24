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
  thumbnail?: string;
}

export interface GalleryCocktail {
  id?: string | number;
  name: string;
  english_name?: string;
  description: string;
  english_description?: string;
  base_spirit: string;
  english_base_spirit?: string;
  alcohol_level: string;
  english_alcohol_level?: string;
  flavor_profiles: string[];
  english_flavor_profiles?: string[];
  ingredients?: Ingredient[];
  image?: string;
  thumbnail?: string;
}

export interface BartenderRequest {
  answers: Record<string, string>;
  baseSpirits: string[];
  sessionId: string;
  specialRequests?: string;
}
