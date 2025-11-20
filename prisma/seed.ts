import { PrismaClient } from '@prisma/client'
import { popularCocktails } from '../services/cocktailService'

const prisma = new PrismaClient()

const cocktailImages: Record<string, string> = {
  mojito: "/vibrant-mojito.png",
  margarita: "/vibrant-margarita.png",
  cosmopolitan: "/city-lights-cocktail.png",
}

async function main() {
  console.error('DEBUG: Start seeding...')
  console.error('DEBUG: Popular cocktails keys:', Object.keys(popularCocktails))
  
  for (const [key, cocktail] of Object.entries(popularCocktails)) {
    console.error(`DEBUG: Processing ${key}...`)
    
    try {
      await prisma.cocktail.upsert({
        where: { id: key },
        update: {
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
          image: cocktailImages[key] || cocktail.image,
        },
        create: {
          id: key,
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
          image: cocktailImages[key] || cocktail.image,
        }
      })
      console.error(`DEBUG: Upserted cocktail: ${cocktail.name}`)
    } catch (e) {
      console.error(`DEBUG: Error upserting ${key}:`, e)
    }
  }
  
  console.error('DEBUG: Seeding finished.')
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
