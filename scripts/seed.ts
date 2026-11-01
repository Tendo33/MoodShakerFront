/**
 * Publishes the seed classics. Existing slugs are left alone, so this is safe
 * to run on every start.
 */
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
  for (const [index, seed] of seedDrinks.entries()) {
    const recipe = recipeSchema.parse(seed.recipe);
    await db
      .insert(drinks)
      .values({
        id: `seed-${seed.slug}`,
        order: seed.order,
        recipe,
        baseSpirit: recipe.baseSpirit,
        imageUrl: seed.imageUrl,
        thumbnailUrl: seed.thumbnailUrl,
        slug: seed.slug,
        publishedAt: new Date(base - index * 60_000),
      })
      .onConflictDoNothing();
  }

  await client.end();
  console.log(`Seeded ${seedDrinks.length} drinks.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
