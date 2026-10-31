import type { Mood } from "@/lib/domain/vocabulary";

/**
 * Every drink is shown as a specimen on the colour of the mood it was poured
 * for. The fields are mid-light tints on purpose: photographs are laid on them
 * with `mix-blend-mode: multiply`, and a saturated field would muddy the drink.
 */
export const MOOD_COLORS: Record<Mood, string> = {
  unwind: "#a9d3b5",
  celebrate: "#f2c94c",
  blue: "#aebfd6",
  romantic: "#f2aca4",
  spark: "#d4e157",
  reflect: "#cbbfa8",
};

/** Seed and legacy drinks without an order still need a field. */
export function moodColor(mood: Mood | null | undefined): string {
  return mood ? MOOD_COLORS[mood] : MOOD_COLORS.reflect;
}

/** The mood a visitor most likely has at this hour, so the home page differs by time of day. */
export function moodForHour(hour: number): Mood {
  if (hour >= 5 && hour < 11) return "spark";
  if (hour >= 11 && hour < 17) return "celebrate";
  if (hour >= 17 && hour < 21) return "unwind";
  if (hour >= 21 || hour < 1) return "romantic";
  return "reflect";
}
