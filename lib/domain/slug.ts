import type { LocalizedText } from "@/lib/i18n/localized";

/**
 * URL slug generation.
 *
 * These rules match `prisma/backfill-cocktail-content.ts`, which held the only
 * implementation — a one-off script that gave existing rows a slug. That script is
 * now dead code: it selects legacy columns dropped by
 * `20260906000100_drop_legacy_cocktail_columns`, so it fails with
 * `column "name" does not exist`. It is left in place because the drop migration
 * cites it as the precondition that made the drop safe.
 *
 * This module is the live implementation, used by publishing.
 */

/** Longest slug we will produce, before any uniqueness suffix. */
const MAX_LENGTH = 60;

/**
 * Builds a slug from a bilingual name.
 *
 * Prefers English: a percent-encoded Chinese URL is unreadable and breaks when
 * copied between clients. A Chinese-only name transliterates to nothing usable, so
 * the caller must supply a fallback.
 */
export function buildSlug(
  name: LocalizedText,
  fallback: string,
): string {
  const source = name.en?.trim() || name.cn?.trim() || "";

  const slug = source
    .toLowerCase()
    // Apostrophes vanish rather than becoming separators, so `Bee's Knees`
    // gives `bees-knees` and not `bee-s-knees`.
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    // Truncation can leave a trailing dash.
    .replace(/-+$/, "");

  return slug.length > 0 ? slug : fallback;
}

/**
 * Appends a numeric suffix until the slug is unused.
 *
 * Two drinks may legitimately share a name — two rows already share 沙漠电台 — so a
 * collision is expected rather than an error.
 */
export function makeUniqueSlug(
  candidate: string,
  isTaken: (slug: string) => boolean,
): string {
  if (!isTaken(candidate)) return candidate;

  let suffix = 2;
  while (isTaken(`${candidate}-${suffix}`)) suffix += 1;

  return `${candidate}-${suffix}`;
}
