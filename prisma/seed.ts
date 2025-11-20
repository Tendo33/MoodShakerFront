import { PrismaClient } from '@prisma/client'
import { popularCocktails } from '../services/cocktailService'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  
  for (const [key, cocktail] of Object.entries(popularCocktails)) {
    const existing = await prisma.cocktail.findFirst({
      where: { name: cocktail.name }
    })

    if (!existing) {
      await prisma.cocktail.create({
        data: {
          // We can use the key as ID or let it generate UUID. 
          // If we want to preserve URLs like /cocktail/mojito, we should probably use 'mojito' as ID or slug.
          // But our schema has UUID default. 
          // Let's map fields.
          name: cocktail.name,
          englishName: cocktail.english_name,
          description: cocktail.description,
          englishDescription: cocktail.english_description,
          matchReason: cocktail.match_reason,
          englishMatchReason: cocktail.english_match_reason,
          baseSpirit: cocktail.base_spirit,
          englishBaseSpirit: cocktail.english_base_spirit,
          alcoholLevel: cocktail.alcohol_level,
          englishAlcoholLevel: cocktail.english_alcohol_level,
          servingGlass: cocktail.serving_glass,
          englishServingGlass: cocktail.english_serving_glass,
          timeRequired: cocktail.time_required || "5 mins",
          englishTimeRequired: cocktail.english_time_required,
          flavorProfiles: cocktail.flavor_profiles,
          englishFlavorProfiles: cocktail.english_flavor_profiles || [],
          ingredients: cocktail.ingredients as any,
          tools: cocktail.tools as any,
          steps: cocktail.steps as any,
          // image: cocktail.image // popularCocktails doesn't have image URL in the object? 
          // It seems images are handled separately or by name.
        }
      })
      console.log(`Created cocktail: ${cocktail.name}`)
    }
  }
  
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

