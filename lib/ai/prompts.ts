/**
 * Prompt assembly for cocktail generation. Pure string building: no credentials,
 * and no path where caller input becomes the prompt verbatim, so this is not a
 * security boundary and is left importable by tests.
 *
 * Contrast `image-prompt.ts`, which IS `server-only`: there the browser used to
 * build the prompt and POST it, so the marker enforces an actual fix.
 */

import { describeCocktailSchema } from "@/lib/ai/cocktail-schema";
import { AgentType } from "@/lib/cocktail-types";
import {
  ALCOHOL_LEVEL_LABELS,
  BASE_SPIRIT_LABELS,
  coerceBaseSpirit,
} from "@/lib/domain/vocabulary";

/**
 * Builds the system prompt for cocktail generation.
 *
 * The field contract comes from `describeCocktailSchema()`, which is derived
 * from the zod schema. The previous version embedded a hand-written JSON example
 * that had drifted out of sync with the real type — most consequentially, it
 * never mentioned the `english_*` fields, so bilingual data was incomplete from
 * the moment of generation.
 *
 * `language` selects the language the instructions are written in, not the
 * language of the result: the schema now requires every text field in both
 * languages, so a single generation serves `/cn` and `/en` alike.
 */
export function buildCocktailSystemPrompt(
  agentType: AgentType,
  language: string,
): string {
  const isClassic = agentType === AgentType.CLASSIC_BARTENDER;
  const isEnglish = language === "en";

  const role = isClassic
    ? isEnglish
      ? "You are a classic bartender specializing in traditional cocktails. Recommend an established classic cocktail that fits the user's mood and preferences. Do not invent new recipes. User requirements are the first priority."
      : "你是一位专注于经典鸡尾酒的调酒师，需要根据用户的心情和偏好推荐合适的经典鸡尾酒。请提供经典的配方，不要自创配方。用户需求是第一优先级。"
    : isEnglish
      ? "You are a creative bartender who invents original cocktail recipes from the user's mood and preferences. Do not return a standard classic recipe. User requirements are the first priority."
      : "你是一位创意调酒师，需要根据用户的心情和偏好创造独特的鸡尾酒配方。请提供新颖有创意的配方，不要使用经典鸡尾酒。用户需求是第一优先级。";

  const instructions = isEnglish
    ? [
        "# Instructions",
        "1. Analyse the request carefully: mood, preferences, available base spirits, alcohol tolerance, skill level, and special requests such as allergies or dislikes.",
        "2. Match the mood and preferences with a cocktail that genuinely fits.",
        "3. Prefer base spirits the user already has. Offer substitutes for ingredients that are hard to source.",
        "4. If no alcohol is wanted, or tolerance is very low, return a mocktail or a very low-ABV drink.",
        "5. Return one JSON object matching the contract below, and nothing else.",
      ].join("\n")
    : [
        "# 制作要求",
        "1. 深入分析用户需求：心情、偏好、现有的基酒、酒精接受度、调酒技术水平，以及特殊要求（如过敏、忌口）。",
        "2. 根据用户的心情和偏好匹配真正合适的鸡尾酒。",
        "3. 优先使用用户已有的基酒。为难以获取的原料提供替代方案。",
        "4. 如果要求无酒精或酒精接受度极低，请提供无酒精特调或极低度数的鸡尾酒。",
        "5. 只返回一个符合下述契约的 JSON 对象，不要输出任何其他内容。",
      ].join("\n");

  return [
    role,
    "",
    "# Output contract",
    describeCocktailSchema(),
    "",
    instructions,
  ].join("\n");
}

export interface CocktailUserPromptInput {
  answers: Record<string, string>;
  baseSpirits: string[];
  specialRequests?: string;
  language: string;
}

/**
 * Builds the user message.
 *
 * Base spirit selections are echoed as both code and label so the model can read
 * them without the server having to guess a display string, and so its answer can
 * come back as a code.
 */
export function buildCocktailUserPrompt(
  input: CocktailUserPromptInput,
): string {
  const isEnglish = input.language === "en";
  const locale = isEnglish ? "en" : "cn";
  const lines: string[] = [];

  lines.push(isEnglish ? "# User requirements" : "# 用户需求");

  const answerEntries = Object.entries(input.answers).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0,
  );

  if (answerEntries.length > 0) {
    lines.push(isEnglish ? "## Questionnaire" : "## 问卷回答");
    for (const [key, value] of answerEntries) {
      lines.push(`- ${key}: ${value}`);
    }
  }

  if (input.baseSpirits.length > 0) {
    lines.push(isEnglish ? "## Available base spirits" : "## 现有基酒");
    for (const raw of input.baseSpirits) {
      const code = coerceBaseSpirit(raw);
      const label = BASE_SPIRIT_LABELS[code][locale];
      lines.push(`- ${code} (${label})`);
    }
  }

  if (input.specialRequests && input.specialRequests.trim().length > 0) {
    lines.push(isEnglish ? "## Special requests" : "## 特殊要求");
    lines.push(input.specialRequests.trim());
  }

  lines.push("");
  lines.push(
    isEnglish
      ? `Alcohol level codes and their meaning: ${Object.entries(
          ALCOHOL_LEVEL_LABELS,
        )
          .map(([code, labels]) => `${code} = ${labels.en}`)
          .join(", ")}.`
      : `酒精度代码含义：${Object.entries(ALCOHOL_LEVEL_LABELS)
          .map(([code, labels]) => `${code} = ${labels.cn}`)
          .join("，")}。`,
  );

  return lines.join("\n");
}

/**
 * Builds the repair message for output that failed validation.
 *
 * Sent once. If the second attempt also fails the request errors out rather than
 * persisting a partially defaulted record.
 */
export function buildRepairPrompt(issues: string): string {
  return [
    "Your previous response did not satisfy the output contract.",
    "",
    "Problems found:",
    issues,
    "",
    "Return the corrected JSON object only. Keep the parts that were already",
    "valid, fix the listed problems, and do not add commentary or code fences.",
  ].join("\n");
}
