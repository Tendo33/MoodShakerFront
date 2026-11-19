/**
 * Regenerates the seed menu: pours a fixed set of orders through the real
 * recipe and image pipeline, saves the photographs to public/drinks/ and writes
 * scripts/seed-data.ts. Run it when the prompts change enough that the seeds no
 * longer represent the product.
 *
 *   pnpm seeds:build          # all orders
 *   pnpm seeds:build 1 7      # re-pour orders 1 and 7, keep the rest
 *   pnpm seeds:build stages   # only the two stage pictures on the home page (or: stages shaker)
 *
 * Needs OPENAI_* and IMAGE_* in the environment. Costs one recipe and one image
 * per order. The output is committed, so a fresh install never calls a model.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { generateRecipe } from "../lib/ai/generate";
import { buildImagePrompt } from "../lib/ai/prompts";
import { chat, generateImage } from "../lib/ai/provider";
import type { Order } from "../lib/domain/order";
import { buildSlug } from "../lib/domain/slug";
import { whitenBackground } from "../lib/image-levels";
import { seedDrinks } from "./seed-data";

const ORDERS: Order[] = [
  { locale: "cn", mood: "unwind", strength: "light", spirits: ["gin"], skill: "beginner", style: "classic", notes: "" },
  { locale: "en", mood: "unwind", strength: "medium", spirits: ["rum"], skill: "intermediate", style: "creative", notes: "I love coconut" },
  { locale: "cn", mood: "celebrate", strength: "medium", spirits: ["vodka"], skill: "intermediate", style: "creative", notes: "" },
  { locale: "en", mood: "celebrate", strength: "light", spirits: ["gin"], skill: "intermediate", style: "classic", notes: "" },
  { locale: "cn", mood: "blue", strength: "medium", spirits: ["whiskey"], skill: "beginner", style: "classic", notes: "" },
  { locale: "cn", mood: "blue", strength: "none", spirits: [], skill: "beginner", style: "creative", notes: "想喝冰的，喜欢茶" },
  { locale: "cn", mood: "romantic", strength: "light", spirits: ["gin", "vodka"], skill: "intermediate", style: "creative", notes: "不要太甜，喜欢花香，家里有起泡酒" },
  { locale: "en", mood: "romantic", strength: "medium", spirits: ["tequila"], skill: "intermediate", style: "classic", notes: "" },
  { locale: "cn", mood: "spark", strength: "none", spirits: [], skill: "beginner", style: "creative", notes: "" },
  { locale: "en", mood: "spark", strength: "medium", spirits: ["vodka"], skill: "intermediate", style: "classic", notes: "" },
  { locale: "cn", mood: "reflect", strength: "strong", spirits: ["whiskey"], skill: "advanced", style: "classic", notes: "" },
  { locale: "en", mood: "reflect", strength: "medium", spirits: ["rum"], skill: "intermediate", style: "creative", notes: "I love coffee. No ice in the glass, please." },
];

/**
 * The two still lifes beside "from mood to glass" on the home page. Lit and
 * cut out the same way as the drinks, so they sit on a mood field beside them.
 */
const STAGES = {
  ingredients:
    "a halved lemon with its cut face showing, a lime wedge, a sprig of fresh mint and a small polished steel jigger, grouped closely together",
  shaker: "one polished stainless steel cobbler cocktail shaker, standing upright, beaded with fine cold condensation",
};

async function shootStage(name: keyof typeof STAGES) {
  const prompt = `Editorial still life, lit like a luxury drinks campaign, on a seamless pure white (#FFFFFF) background: ${STAGES[name]}.

Shot on a 100mm lens at f/8, everything tack-sharp, a slightly elevated three-quarter view, the whole group centred and small enough to leave a wide white margin on every side: nothing comes within a sixth of the frame's edge. Crisp bright edges, true colours, fresh and exact, placed with a food stylist's care.

Seamless pure white from edge to edge, a cut-out on a white page: no table, no surface, no horizon, no gradient, no vignette, no cast shadow, no reflection underneath, no halo. No props beyond what is described, no hands, no text.`;
  const source = await fetch(await generateImage(prompt));
  const buffer = await whitenBackground(Buffer.from(await source.arrayBuffer()));
  await sharp(buffer).resize({ width: 1024 }).webp({ quality: 82 }).toFile(`public/stages/${name}.webp`);
  console.log(`✓ stage ${name}`);
}

async function pour(order: Order, index: number) {
  const recipe = await generateRecipe(order, chat);
  const slug = buildSlug(recipe.name, `drink-${index + 1}`);

  const source = await fetch(await generateImage(buildImagePrompt(recipe)));
  const buffer = await whitenBackground(Buffer.from(await source.arrayBuffer()));
  // The file name carries a hash of the picture. A re-poured classic keeps its
  // slug, and under the old name browsers and the image optimizer would go on
  // serving the photograph they had cached.
  const file = `${slug}-${createHash("sha256").update(buffer).digest("hex").slice(0, 8)}`;
  await Promise.all([
    sharp(buffer).resize({ width: 1024 }).webp({ quality: 82 }).toFile(`public/drinks/${file}.webp`),
    sharp(buffer).resize({ width: 480 }).webp({ quality: 72 }).toFile(`public/drinks/${file}-thumb.webp`),
  ]);

  console.log(`✓ ${index + 1} ${recipe.name.en} / ${recipe.name.cn}`);
  return { slug, order, recipe, imageUrl: `/drinks/${file}.webp`, thumbnailUrl: `/drinks/${file}-thumb.webp` };
}

async function main() {
  mkdirSync("public/drinks", { recursive: true });
  if (process.argv[2] === "stages") {
    mkdirSync("public/stages", { recursive: true });
    const names = Object.keys(STAGES) as (keyof typeof STAGES)[];
    const picked = names.filter((name) => process.argv.slice(3).includes(name));
    await Promise.all((picked.length > 0 ? picked : names).map(shootStage));
    return;
  }
  const picked = process.argv.slice(2).map(Number).filter(Boolean);
  const settled = await Promise.allSettled(
    ORDERS.map((order, index) =>
      picked.length === 0 || picked.includes(index + 1)
        ? pour(order, index)
        : Promise.resolve(seedDrinks.find((seed) => JSON.stringify(seed.order) === JSON.stringify(order))),
    ),
  );
  const seeds = settled.flatMap((result, index) => {
    if (result.status === "fulfilled" && result.value) return [result.value];
    console.error(`✗ ${index + 1}: ${result.status === "rejected" ? result.reason : "no previous seed"}`);
    return [];
  });

  writeFileSync(
    "scripts/seed-data.ts",
    `// Generated by scripts/build-seeds.ts. Edit the orders there, not this file.
import type { Order } from "../lib/domain/order";
import type { Recipe } from "../lib/domain/recipe";

export interface SeedDrink {
  slug: string;
  order: Order;
  recipe: Recipe;
  imageUrl: string;
  thumbnailUrl: string;
}

export const seedDrinks: SeedDrink[] = ${JSON.stringify(seeds, null, 2)};
`,
  );
  console.log(`Wrote ${seeds.length} seeds.`);

  // Photographs no seed points at any more: the ones just replaced.
  const kept = new Set(seeds.flatMap((seed) => [seed.imageUrl, seed.thumbnailUrl]));
  for (const name of readdirSync("public/drinks")) {
    if (!kept.has(`/drinks/${name}`)) unlinkSync(`public/drinks/${name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
