import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DataSourceUnavailableError } from "@/lib/runtime-errors";
import type {
  Cocktail,
  GalleryQueryFilters,
  PaginatedGalleryResult,
} from "@/lib/cocktail-types";
import {
  readStoredContent,
  resolveCocktail,
  toCocktailSummary,
} from "@/lib/domain/resolve-cocktail";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { createLogger } from "@/utils/logger";

const logger = createLogger("CocktailData");

const GALLERY_PAGE_SIZE = 24;

/**
 * Reads cocktails out of the database.
 *
 * Free text comes from the `content` JSONB column rather than eight
 * `xxx` / `english_xxx` column pairs, and the locale is resolved at this
 * boundary by `resolveCocktail` so callers receive plain strings.
 *
 * The hardcoded fallback catalogue is gone. It returned three canned cocktails
 * whenever `DATABASE_URL` looked like a placeholder, which is how this project
 * shipped with two migrations that had never been applied: the build succeeded
 * against data that was never in a database. A missing database is now an error.
 */

interface CocktailRow {
  id: string;
  slug: string;
  content: unknown;
  base_spirit: string;
  alcohol_level: string;
  flavor_profiles: string[];
  image_url: string | null;
  thumbnail_url: string | null;
}

function unavailable(
  context: string,
  error: unknown,
): DataSourceUnavailableError {
  logger.error(`${context} unavailable`, {
    message: error instanceof Error ? error.message : String(error),
  });

  return new DataSourceUnavailableError(
    "DATABASE_UNAVAILABLE",
    `${context} is unavailable. Check the database connection and that migrations have been applied.`,
  );
}

function mapRow(row: CocktailRow, locale: Locale): Cocktail | null {
  const content = readStoredContent(row.content);

  if (!content) {
    logger.warn("Skipping cocktail with unreadable content", { slug: row.slug });
    return null;
  }

  return resolveCocktail(
    {
      id: row.id,
      slug: row.slug,
      content,
      baseSpirit: row.base_spirit,
      alcoholLevel: row.alcohol_level,
      flavorProfiles: row.flavor_profiles,
      imageUrl: row.image_url,
      thumbnailUrl: row.thumbnail_url,
    },
    locale,
  );
}

const SELECT_COLUMNS = Prisma.sql`
  id, slug, content, base_spirit, alcohol_level, flavor_profiles,
  image_url, thumbnail_url`;

/**
 * Builds the filter conditions.
 *
 * Vocabulary filters compare codes, so the bilingual keyword maps and
 * `capitalizeKeyword` are gone: matching on display text meant a filter had to
 * know how a value was spelled in two languages, and it silently missed rows
 * spelled a third way.
 *
 * Search still has to look at text, and that text now lives inside JSONB. It
 * scans every language rather than the current one, so a Chinese query finds a
 * drink while the interface is in English.
 */
function buildConditions(filters: GalleryQueryFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];

  if (filters.spirit) {
    conditions.push(Prisma.sql`base_spirit = ${filters.spirit}`);
  }

  if (filters.alcohol) {
    conditions.push(Prisma.sql`alcohol_level = ${filters.alcohol}`);
  }

  if (filters.flavor) {
    conditions.push(
      Prisma.sql`flavor_profiles && ARRAY[${filters.flavor}]::text[]`,
    );
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(Prisma.sql`(
      EXISTS (
        SELECT 1 FROM jsonb_each_text(content->'name') AS kv
        WHERE kv.value ILIKE ${pattern}
      )
      OR EXISTS (
        SELECT 1 FROM jsonb_each_text(content->'description') AS kv
        WHERE kv.value ILIKE ${pattern}
      )
    )`);
  }

  return conditions;
}

function whereClause(conditions: Prisma.Sql[]): Prisma.Sql {
  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

export async function getCocktailBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Cocktail | null> {
  try {
    const rows = await prisma.$queryRaw<CocktailRow[]>(Prisma.sql`
      SELECT ${SELECT_COLUMNS} FROM cocktails WHERE slug = ${slug} LIMIT 1`);

    const row = rows[0];
    return row ? mapRow(row, locale) : null;
  } catch (error) {
    throw unavailable("Cocktail detail", error);
  }
}

export async function getGalleryCocktails(
  filters: GalleryQueryFilters = {},
  cursor?: string | null,
  locale: Locale = DEFAULT_LOCALE,
): Promise<PaginatedGalleryResult> {
  try {
    const conditions = buildConditions(filters);

    // Keyset pagination on (created_at, id): a plain offset shifts results when a
    // row is inserted mid-scroll, which duplicates or skips cards.
    if (cursor) {
      conditions.push(Prisma.sql`(created_at, id) < (
        SELECT created_at, id FROM cocktails WHERE id = ${cursor}
      )`);
    }

    const rows = await prisma.$queryRaw<CocktailRow[]>(Prisma.sql`
      SELECT ${SELECT_COLUMNS} FROM cocktails
      ${whereClause(conditions)}
      ORDER BY created_at DESC, id DESC
      LIMIT ${GALLERY_PAGE_SIZE + 1}`);

    const hasMore = rows.length > GALLERY_PAGE_SIZE;
    const page = hasMore ? rows.slice(0, GALLERY_PAGE_SIZE) : rows;

    const items = page
      .map((row) => mapRow(row, locale))
      .filter((cocktail): cocktail is Cocktail => cocktail !== null)
      .map(toCocktailSummary);

    return {
      items,
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  } catch (error) {
    throw unavailable("Gallery data", error);
  }
}

export async function getCocktailSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.$queryRaw<{ slug: string }[]>(
      Prisma.sql`SELECT slug FROM cocktails ORDER BY created_at DESC`,
    );

    return rows.map((row) => row.slug);
  } catch (error) {
    throw unavailable("Cocktail slugs", error);
  }
}
