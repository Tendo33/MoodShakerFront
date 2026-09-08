import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Text stored in every supported language.
 *
 * Free-text cocktail fields are stored in this shape inside a single `content`
 * JSON column rather than as `name` / `englishName` column pairs. Seventeen such
 * pairs meant every read site chose between them by hand, and adding a third
 * language would have meant seventeen more columns.
 */
export type LocalizedText = {
  [L in Locale]: string;
};

/**
 * Reads one locale out of stored bilingual text.
 *
 * Falls back to the default locale when a translation is absent, and returns
 * `null` rather than an empty string when nothing usable exists, so callers can
 * tell "no value" from "blank value" and omit the field instead of rendering an
 * empty label.
 */
export function pickLocalized(
  value: LocalizedText | null | undefined,
  locale: Locale,
): string | null {
  if (!value || typeof value !== "object") return null;

  const preferred = value[locale];
  if (typeof preferred === "string" && preferred.trim().length > 0) {
    return preferred;
  }

  const fallback = value[DEFAULT_LOCALE];
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return fallback;
  }

  return null;
}

/**
 * Same as `pickLocalized` but for a field the caller requires.
 *
 * Returns `""` only when the record is genuinely empty, which validation should
 * have prevented on write.
 */
export function pickLocalizedRequired(
  value: LocalizedText | null | undefined,
  locale: Locale,
): string {
  return pickLocalized(value, locale) ?? "";
}

/** Narrows unknown JSON to `LocalizedText`. */
export function isLocalizedText(value: unknown): value is LocalizedText {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.cn === "string" &&
    typeof record.en === "string" &&
    record.cn.length > 0 &&
    record.en.length > 0
  );
}

/** Builds `LocalizedText` from a legacy column pair during backfill. */
export function fromLegacyPair(
  chinese: string | null | undefined,
  english: string | null | undefined,
): LocalizedText | null {
  const cn = chinese?.trim();
  if (!cn) return null;

  // The English column was nullable and frequently empty, so Chinese stands in
  // rather than storing a blank that reads as a missing translation.
  const en = english?.trim();
  return { cn, en: en && en.length > 0 ? en : cn };
}
