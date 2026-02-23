import { useCallback } from "react";
import type { Cocktail, Ingredient, Step, Tool } from "@/api/cocktail";
import { useLanguage } from "@/context/LanguageContext";

export function useLocalizedCocktail(cocktail: Cocktail | null) {
  const { language } = useLanguage();

  const getLocalizedContent = useCallback(
    (field: keyof Cocktail, englishField: keyof Cocktail): string | undefined => {
      if (!cocktail) {
        return undefined;
      }
      if (language === "en" && cocktail[englishField]) {
        return cocktail[englishField] as string;
      }
      return cocktail[field] as string;
    },
    [cocktail, language],
  );

  const getLocalizedIngredientName = useCallback(
    (ingredient: Ingredient): string => {
      if (language === "en" && ingredient.english_name) {
        return ingredient.english_name;
      }
      return ingredient.name;
    },
    [language],
  );

  const getLocalizedIngredientAmount = useCallback(
    (ingredient: Ingredient): string => {
      if (language === "en" && ingredient.english_amount) {
        return ingredient.english_amount;
      }
      return ingredient.amount;
    },
    [language],
  );

  const getLocalizedIngredientUnit = useCallback(
    (ingredient: Ingredient): string => {
      if (language === "en" && ingredient.english_unit) {
        return ingredient.english_unit;
      }
      return ingredient.unit || "";
    },
    [language],
  );

  const getLocalizedToolName = useCallback(
    (tool: Tool): string => {
      if (language === "en" && tool.english_name) {
        return tool.english_name;
      }
      return tool.name;
    },
    [language],
  );

  const getLocalizedStepContent = useCallback(
    (step: Step): { description: string; tips?: string } => {
      if (language === "en") {
        return {
          description: step.english_description || step.description,
          tips: step.english_tips || step.tips,
        };
      }
      return {
        description: step.description,
        tips: step.tips,
      };
    },
    [language],
  );

  return {
    getLocalizedContent,
    getLocalizedIngredientName,
    getLocalizedIngredientAmount,
    getLocalizedIngredientUnit,
    getLocalizedToolName,
    getLocalizedStepContent,
  };
}
