/**
 * Publishes the seed menu and keeps it in step with scripts/seed-data.ts: a
 * seed that is already there is rewritten, and one that has left the file is
 * removed. Only rows whose id starts with `seed-` are touched, so guests'
 * drinks are never changed. Safe to run on every start.
 */
import { and, like, notInArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { drinks } from "../lib/db/schema";
import { recipeSchema } from "../lib/domain/recipe";
import { seedDrinks } from "./seed-data";

const url = process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client);

  // Staggered so the menu has a stable order: first seed is the newest.
  const base = Date.parse("2026-01-01T00:00:00Z");
  const ids = seedDrinks.map((seed) => `seed-${seed.slug}`);
  // Stale seeds go first, so a re-poured drink can take over a slug its predecessor held.
  await db.delete(drinks).where(and(like(drinks.id, "seed-%"), notInArray(drinks.id, ids)));

  for (const [index, seed] of seedDrinks.entries()) {
    const recipe = recipeSchema.parse(seed.recipe);
    const row = {
      order: seed.order,
      recipe,
      baseSpirit: recipe.baseSpirit,
      mood: seed.order.mood,
      imageUrl: seed.imageUrl,
      thumbnailUrl: seed.thumbnailUrl,
      slug: seed.slug,
      publishedAt: new Date(base - index * 60_000),
    };
    try {
      await db
        .insert(drinks)
        .values({ id: `seed-${seed.slug}`, ...row })
        .onConflictDoUpdate({ target: drinks.id, set: row });
    } catch (error) {
      // A guest's drink already published under this slug. Theirs stays; the start-up goes on.
      console.warn(`Skipped seed ${seed.slug}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await client.end();
  console.log(`Seeded ${seedDrinks.length} drinks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
