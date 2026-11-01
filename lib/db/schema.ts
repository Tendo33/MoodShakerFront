import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Order } from "@/lib/domain/order";
import type { Recipe } from "@/lib/domain/recipe";

/**
 * One row per poured drink. A drink starts private (reachable only with its
 * edit token) and becomes public when `publishedAt` is set; withdrawing clears
 * it again. Seeded classics have no token and are published from the start.
 */
export const drinks = pgTable(
  "drinks",
  {
    id: text("id").primaryKey(),
    /** SHA-256 of the edit token. The token itself is never stored. */
    editTokenHash: text("edit_token_hash"),
    order: jsonb("order").$type<Order>(),
    recipe: jsonb("recipe").$type<Recipe>().notNull(),
    /** Copied out of `recipe` so the gallery can filter on an index. */
    baseSpirit: text("base_spirit").notNull(),
    imageUrl: text("image_url"),
    thumbnailUrl: text("thumbnail_url"),
    /** Assigned on first publish and kept afterwards, so a re-publish keeps its URL. */
    slug: text("slug").unique(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Matches the gallery's keyset pagination over published rows.
    index("drinks_published_idx")
      .on(table.publishedAt.desc(), table.id.desc())
      .where(sql`${table.publishedAt} is not null`),
    index("drinks_base_spirit_idx").on(table.baseSpirit),
  ],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("rate_limits_reset_at_idx").on(table.resetAt)],
);

export type DrinkRow = typeof drinks.$inferSelect;
