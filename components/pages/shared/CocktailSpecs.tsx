"use client";

import type { Cocktail } from "@/lib/cocktail-types";

interface CocktailSpecsProps {
  language: string;
  cocktail: Cocktail;
}

export function CocktailSpecs({ language, cocktail }: CocktailSpecsProps) {
  const time =
    cocktail.timeRequired.trim() || (language === "cn" ? "5分钟" : "5 min");
  const specs = [
    cocktail.baseSpiritLabel,
    cocktail.alcoholLevelLabel,
    time,
    cocktail.servingGlass,
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (specs.length === 0) {
    return null;
  }

  return (
    <p className="text-safe-wrap mt-6 font-mono text-sm uppercase tracking-[0.14em] text-foreground/80">
      {specs.join(" · ")}
    </p>
  );
}
