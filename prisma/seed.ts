import { Prisma, PrismaClient } from "@prisma/client";
import { seedCocktails } from "./seed-data";

const prisma = new PrismaClient();

/**
 * Seeds the three classic cocktails.
 *
 * Upserts on `slug`, which is the stable identifier. It used to upsert on `name`,
 * relying on a unique constraint the database never actually had — two rows
 * already shared a name in production.
 */
async function main() {
  console.log(`Seeding ${seedCocktails.length} cocktails...`);

  for (const cocktail of seedCocktails) {
    const data = {
      content: cocktail.content as unknown as Prisma.InputJsonValue,
      baseSpirit: cocktail.baseSpirit,
      alcoholLevel: cocktail.alcoholLevel,
      flavorProfiles: cocktail.flavorProfiles,
      imageUrl: cocktail.imageUrl,
    };

    try {
      await prisma.cocktail.upsert({
        where: { slug: cocktail.slug },
        // Images generated later must survive re-seeding, so an existing
        // imageUrl is left alone.
        update: {
          content: data.content,
          baseSpirit: data.baseSpirit,
          alcoholLevel: data.alcoholLevel,
          flavorProfiles: data.flavorProfiles,
        },
        create: { slug: cocktail.slug, ...data },
      });

      console.log(`  ${cocktail.slug}`);
    } catch (error) {
      console.error(`  ${cocktail.slug} failed:`, error);
      throw error;
    }
  }

  console.log("Seeding finished.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
