import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNotNull, lt, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { drinks, type DrinkRow } from "@/lib/db/schema";
import type { Order } from "@/lib/domain/order";
import type { Recipe } from "@/lib/domain/recipe";
import { buildSlug } from "@/lib/domain/slug";
import type { BaseSpirit, Mood } from "@/lib/domain/vocabulary";

const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function createId(length = 12): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => ID_ALPHABET[byte % ID_ALPHABET.length]).join("");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(row: Pick<DrinkRow, "editTokenHash">, token: string): boolean {
  if (!row.editTokenHash) return false;
  const expected = Buffer.from(row.editTokenHash, "hex");
  const actual = Buffer.from(hashToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** What a drink looks like to the browser. No token material, ever. */
export interface DrinkView {
  id: string;
  recipe: Recipe;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  slug: string | null;
  published: boolean;
  mood: Mood | null;
}

export function toView(row: DrinkRow): DrinkView {
  return {
    id: row.id,
    recipe: row.recipe,
    imageUrl: row.imageUrl,
    thumbnailUrl: row.thumbnailUrl,
    slug: row.slug,
    published: row.publishedAt !== null,
    mood: row.order?.mood ?? null,
  };
}

export async function createDrink(order: Order, recipe: Recipe) {
  const id = createId();
  const editToken = randomBytes(32).toString("base64url");

  const [row] = await getDb()
    .insert(drinks)
    .values({ id, editTokenHash: hashToken(editToken), order, recipe, baseSpirit: recipe.baseSpirit })
    .returning();

  return { drink: toView(row), editToken };
}

/** The row, when `token` opens it. Unknown id and wrong token are indistinguishable. */
export async function getOwnedDrink(id: string, token: string): Promise<DrinkRow | null> {
  const [row] = await getDb().select().from(drinks).where(eq(drinks.id, id)).limit(1);
  return row && tokenMatches(row, token) ? row : null;
}

export async function setDrinkImage(id: string, imageUrl: string, thumbnailUrl: string) {
  const [row] = await getDb()
    .update(drinks)
    .set({ imageUrl, thumbnailUrl })
    .where(eq(drinks.id, id))
    .returning();
  return row ?? null;
}

const UNIQUE_VIOLATION = "23505";

/** Publishes an owned drink, keeping its slug if it was published before. */
export async function publishDrink(row: DrinkRow): Promise<string> {
  const db = getDb();

  if (row.slug) {
    await db.update(drinks).set({ publishedAt: new Date() }).where(eq(drinks.id, row.id));
    return row.slug;
  }

  const base = buildSlug(row.recipe.name, row.id);
  // Readable first; on a clash, suffix with the drink's own id, which is unique.
  for (const slug of [base, `${base}-${row.id.slice(0, 6)}`, `${base}-${row.id}`]) {
    try {
      await db.update(drinks).set({ slug, publishedAt: new Date() }).where(eq(drinks.id, row.id));
      return slug;
    } catch (error) {
      if ((error as { code?: string }).code !== UNIQUE_VIOLATION) throw error;
    }
  }
  throw new Error(`No free slug for drink ${row.id}.`);
}

export async function withdrawDrink(row: DrinkRow): Promise<void> {
  await getDb().update(drinks).set({ publishedAt: null }).where(eq(drinks.id, row.id));
}

export async function getPublishedDrink(slug: string): Promise<DrinkRow | null> {
  const [row] = await getDb()
    .select()
    .from(drinks)
    .where(and(eq(drinks.slug, slug), isNotNull(drinks.publishedAt)))
    .limit(1);
  return row ?? null;
}

const GALLERY_PAGE_SIZE = 12;

function encodeCursor(row: DrinkRow): string {
  return Buffer.from(`${row.publishedAt!.toISOString()}|${row.id}`).toString("base64url");
}

function decodeCursor(cursor: string): { publishedAt: Date; id: string } | null {
  const [iso, id] = Buffer.from(cursor, "base64url").toString().split("|");
  const publishedAt = new Date(iso);
  return id && !Number.isNaN(publishedAt.getTime()) ? { publishedAt, id } : null;
}

/** Keyset-paginated, newest first. `nextCursor` is null on the last page. */
export async function listPublishedDrinks(options: {
  spirit?: BaseSpirit;
  cursor?: string;
  limit?: number;
}) {
  const limit = options.limit ?? GALLERY_PAGE_SIZE;
  const after = options.cursor ? decodeCursor(options.cursor) : null;

  const rows = await getDb()
    .select()
    .from(drinks)
    .where(
      and(
        isNotNull(drinks.publishedAt),
        options.spirit ? eq(drinks.baseSpirit, options.spirit) : undefined,
        after
          ? or(
              lt(drinks.publishedAt, after.publishedAt),
              and(eq(drinks.publishedAt, after.publishedAt), lt(drinks.id, after.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(drinks.publishedAt), desc(drinks.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  return {
    drinks: page,
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

export async function listPublishedSlugs() {
  return getDb()
    .select({ slug: drinks.slug, publishedAt: drinks.publishedAt })
    .from(drinks)
    .where(and(isNotNull(drinks.publishedAt), isNotNull(drinks.slug)));
}

export async function pingDatabase(): Promise<void> {
  await getDb().execute(sql`select 1`);
}
