/**
 * Closed vocabularies. Stored and sent over the wire as codes; display text
 * lives in the dictionaries, so no boundary ever has to match a label.
 */

export const BASE_SPIRITS = [
  "gin",
  "vodka",
  "rum",
  "tequila",
  "whiskey",
  "brandy",
  "other",
  "none",
] as const;

/** The spirits a guest can say they have at home. */
export const STOCKABLE_SPIRITS = [
  "gin",
  "vodka",
  "rum",
  "tequila",
  "whiskey",
  "brandy",
] as const;

export const ALCOHOL_LEVELS = ["none", "low", "medium", "high"] as const;

export const FLAVOR_PROFILES = [
  "sweet",
  "sour",
  "bitter",
  "spicy",
  "fruity",
  "herbal",
  "floral",
  "smoky",
  "refreshing",
  "creamy",
  "salty",
] as const;

export const MOODS = [
  "unwind",
  "celebrate",
  "blue",
  "romantic",
  "spark",
  "reflect",
] as const;

export const STRENGTHS = ["none", "light", "medium", "strong"] as const;
export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const STYLES = ["classic", "creative"] as const;

export type BaseSpirit = (typeof BASE_SPIRITS)[number];
export type StockableSpirit = (typeof STOCKABLE_SPIRITS)[number];
export type AlcoholLevel = (typeof ALCOHOL_LEVELS)[number];
export type FlavorProfile = (typeof FLAVOR_PROFILES)[number];
export type Mood = (typeof MOODS)[number];
export type Strength = (typeof STRENGTHS)[number];
export type SkillLevel = (typeof SKILL_LEVELS)[number];
export type Style = (typeof STYLES)[number];

export function isBaseSpirit(value: unknown): value is BaseSpirit {
  return typeof value === "string" && (BASE_SPIRITS as readonly string[]).includes(value);
}
