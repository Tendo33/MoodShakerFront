import type { Recipe } from "@/lib/domain/recipe";

const t = (cn: string, en: string) => ({ cn, en });

export const sampleRecipe: Recipe = {
  name: t("黄昏金汤力", "Dusk Gin & Tonic"),
  description: t("一杯带着柑橘香的金汤力。", "A gin and tonic with a citrus lift."),
  matchReason: t("清爽，适合放松的夜晚。", "Crisp and easy for a slow evening."),
  servingGlass: t("高球杯", "Highball glass"),
  timeRequired: t("3 分钟", "3 min"),
  appearance: "Clear, sparkling, lots of ice, lime wheel",
  baseSpirit: "gin",
  alcoholLevel: "low",
  flavorProfiles: ["refreshing", "bitter"],
  ingredients: [
    { name: t("金酒", "Gin"), amount: t("45", "45"), unit: t("毫升", "ml"), substitute: null },
    { name: t("汤力水", "Tonic water"), amount: t("加满", "to top"), unit: null, substitute: null },
  ],
  tools: [{ name: t("吧勺", "Bar spoon"), alternative: t("筷子", "Chopstick") }],
  steps: [
    { stepNumber: 2, description: t("倒入汤力水。", "Top with tonic."), tips: null },
    { stepNumber: 1, description: t("杯中加冰和金酒。", "Fill with ice, add gin."), tips: t("冰要多。", "Use plenty of ice.") },
  ],
};

/** The same drink as the model is asked to write it: one recipe per language. */
export const sampleDraft = {
  baseSpirit: "gin",
  alcoholLevel: "low",
  flavorProfiles: ["refreshing", "bitter", "zesty"],
  appearance: "Clear, sparkling, lots of ice, lime wheel",
  cn: {
    name: "黄昏金汤力",
    description: "一杯带着柑橘香的金汤力。",
    matchReason: "清爽，适合放松的夜晚。",
    servingGlass: "高球杯",
    timeRequired: "3 分钟",
    ingredients: [
      { name: "金酒", amount: 45, unit: "ml", substitute: null },
      { name: "汤力水", amount: "加满", unit: null, substitute: null },
    ],
    tools: [{ name: "吧勺", alternative: "筷子" }],
    steps: [
      { description: "杯中加冰和金酒。", tips: "冰要多。" },
      { description: "倒入汤力水。", tips: null },
    ],
  },
  en: {
    name: "Dusk Gin & Tonic",
    description: "A gin and tonic with a citrus lift.",
    matchReason: "Crisp and easy for a slow evening.",
    servingGlass: "Highball glass",
    timeRequired: "3 min",
    ingredients: [
      { name: "Gin", amount: "45", unit: "ml", substitute: null },
      { name: "Tonic water", amount: "to top", unit: null, substitute: null },
    ],
    tools: [{ name: "Bar spoon", alternative: "Chopstick" }],
    steps: [
      { description: "Fill with ice, add gin.", tips: "Use plenty of ice." },
      { description: "Top with tonic.", tips: null },
    ],
  },
};
