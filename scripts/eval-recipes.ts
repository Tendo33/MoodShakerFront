/**
 * Runs a fixed set of contrasting orders through the real model and prints the
 * results for reading side by side. Use it whenever lib/ai/prompts.ts changes.
 *
 *   pnpm eval:recipes            # all orders
 *   pnpm eval:recipes 2 5        # only orders 2 and 5
 *
 * Needs OPENAI_* in the environment. Results are also written to
 * eval-output/<timestamp>.json (gitignored).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { generateRecipe, parseCompletion } from "../lib/ai/generate";
import { chat, type ChatRequest } from "../lib/ai/provider";
import type { Order } from "../lib/domain/order";
import { parseDraft } from "../lib/ai/draft";
import type { Recipe } from "../lib/domain/recipe";

const ORDERS: Order[] = [
  { locale: "cn", mood: "unwind", strength: "light", spirits: ["gin"], skill: "beginner", style: "classic", notes: "" },
  { locale: "cn", mood: "celebrate", strength: "medium", spirits: [], skill: "intermediate", style: "creative", notes: "" },
  { locale: "cn", mood: "blue", strength: "medium", spirits: ["whiskey", "brandy"], skill: "beginner", style: "classic", notes: "" },
  { locale: "cn", mood: "romantic", strength: "light", spirits: ["gin", "vodka"], skill: "intermediate", style: "creative", notes: "不要太甜，喜欢花香" },
  { locale: "cn", mood: "spark", strength: "none", spirits: [], skill: "beginner", style: "creative", notes: "" },
  { locale: "en", mood: "reflect", strength: "strong", spirits: ["whiskey"], skill: "advanced", style: "classic", notes: "" },
  { locale: "en", mood: "reflect", strength: "medium", spirits: ["rum"], skill: "intermediate", style: "creative", notes: "nut allergy, I love coffee" },
  { locale: "en", mood: "celebrate", strength: "none", spirits: [], skill: "beginner", style: "classic", notes: "" },
];

const text = (value: { cn: string; en: string } | null) => (value ? `${value.cn} / ${value.en}` : "");

function print(index: number, order: Order, recipe: Recipe, ms: number, calls: number) {
  const lines = [
    `\n#${index + 1} ${order.mood} · ${order.strength} · ${order.style} · ${order.skill} · [${order.spirits.join(",")}]${order.notes ? ` · "${order.notes}"` : ""}`,
    `   ${(ms / 1000).toFixed(1)}s, ${calls} call(s)`,
    `   ${text(recipe.name)}   (${recipe.baseSpirit}, ${recipe.alcoholLevel}, ${recipe.flavorProfiles.join("/")}, ${recipe.servingGlass.en})`,
    `   desc:  ${recipe.description.cn}`,
    `          ${recipe.description.en}`,
    `   why:   ${recipe.matchReason.cn}`,
    `          ${recipe.matchReason.en}`,
    `   look:  ${recipe.appearance ?? "-"}`,
    ...recipe.ingredients.map(
      (item) =>
        `   - ${item.name.cn} ${item.amount.cn}${item.unit ? ` ${item.unit.cn}` : ""}  |  ${item.amount.en}${item.unit ? ` ${item.unit.en}` : ""} ${item.name.en}${item.substitute ? `  (or ${item.substitute.en})` : ""}`,
    ),
    `   tools: ${recipe.tools.map((tool) => tool.name.en).join(", ") || "-"}`,
    ...recipe.steps.map((step) => `   ${step.stepNumber}. ${step.description.cn}${step.tips ? `  〔${step.tips.cn}〕` : ""}`),
  ];
  console.log(lines.join("\n"));
}

async function main() {
  const picked = process.argv.slice(2).map(Number).filter(Boolean);
  const orders = ORDERS.map((order, index) => ({ order, index })).filter(
    ({ index }) => picked.length === 0 || picked.includes(index + 1),
  );

  const results = await Promise.all(
    orders.map(async ({ order, index }) => {
      let calls = 0;
      const issues: string[] = [];
      const counted = async (request: ChatRequest) => {
        calls += 1;
        const content = await chat(request);
        const parsed = parseDraft(parseCompletion(content));
        if (!parsed.ok) issues.push(parsed.issues);
        return content;
      };
      const startedAt = Date.now();
      try {
        const recipe = await generateRecipe(order, counted);
        return { index, order, recipe, ms: Date.now() - startedAt, calls, issues };
      } catch (error) {
        return { index, order, error: String(error), ms: Date.now() - startedAt, calls, issues };
      }
    }),
  );

  for (const result of results) {
    if ("recipe" in result && result.recipe) print(result.index, result.order, result.recipe, result.ms, result.calls);
    else console.log(`\n#${result.index + 1} FAILED after ${(result.ms / 1000).toFixed(1)}s: ${"error" in result ? result.error : ""}`);
    for (const issue of result.issues) console.log(`   repair needed:\n${issue.replace(/^/gm, "     ")}`);
  }

  mkdirSync("eval-output", { recursive: true });
  const file = `eval-output/${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(file, JSON.stringify({ model: process.env.OPENAI_MODEL, results }, null, 2));
  console.log(`\nSaved ${file}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
