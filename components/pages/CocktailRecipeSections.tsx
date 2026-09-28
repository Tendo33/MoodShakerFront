"use client";

import { Lightbulb } from "lucide-react";
import type { Cocktail } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CocktailRecipeSectionsProps {
  cocktail: Cocktail;
  isPageLoaded?: boolean;
  toolAlternativeLabelKey?: TranslationKey;
}

export function CocktailRecipeSections({
  cocktail,
  toolAlternativeLabelKey = "detail.alternative",
}: CocktailRecipeSectionsProps) {
  const { t } = useLanguage();

  return (
    <ScrollArea className="mt-6 w-full min-w-0 md:h-[70vh]">
      <Tabs defaultValue="ingredients" className="w-full min-w-0">
        <TabsList aria-label={t("detail.recipe")}>
          <TabsTrigger value="ingredients">{t("recommendation.ingredients")}</TabsTrigger>
          <TabsTrigger value="steps">{t("recommendation.steps")}</TabsTrigger>
        </TabsList>
        <TabsContent value="ingredients" className="mt-4 min-w-0">
          <IngredientList cocktail={cocktail} />
          <h3 className="mt-8 border-b border-primary px-1 py-3 font-mono text-xs font-normal uppercase tracking-[0.18em] text-foreground">
            {t("recommendation.tools")}
          </h3>
          <ToolList cocktail={cocktail} alternativeLabel={t(toolAlternativeLabelKey)} />
        </TabsContent>
        <TabsContent value="steps" className="mt-4 min-w-0">
          <StepList cocktail={cocktail} />
        </TabsContent>
      </Tabs>
    </ScrollArea>
  );
}

function IngredientList({ cocktail }: { cocktail: Cocktail }) {
  return (
    <ul className="flex flex-col divide-y divide-white/10">
      {cocktail.ingredients?.map((ingredient, index) => (
        <li
          key={`${ingredient.name}-${index}`}
          className="flex min-w-0 items-baseline gap-4 py-3"
        >
          <span className="min-w-0 font-medium break-words text-foreground">
            {ingredient.name}
          </span>
          <div className="relative -top-1 min-w-4 flex-1 border-b border-dotted border-white/20" />
          <span className="shrink-0 font-bold text-primary">
            {ingredient.amount}
            {ingredient.unit ? ` ${ingredient.unit}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ToolList({
  cocktail,
  alternativeLabel,
}: {
  cocktail: Cocktail;
  alternativeLabel: string;
}) {
  return (
    <ul className="flex flex-col">
      {cocktail.tools?.map((tool, index) => {
        const alternative = tool.alternative;
        return (
          <li
            key={`${tool.name}-${index}`}
            className="border-b border-white/10 py-3 last:border-b-0"
          >
            <span className="font-medium break-words text-foreground">{tool.name}</span>
            {alternative ? (
              <p className="mt-1 text-sm break-words text-foreground/60">
                {alternativeLabel}: {alternative}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function StepList({ cocktail }: { cocktail: Cocktail }) {
  return (
    <ol className="flex flex-col gap-8">
      {cocktail.steps?.map((step) => (
        <li key={step.stepNumber} className="min-w-0">
          <div className="flex min-w-0 gap-4">
            <div className="z-10 flex size-8 shrink-0 items-center justify-center border border-primary/50 bg-black/40 font-mono text-sm font-bold text-primary">
              {step.stepNumber}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-base leading-relaxed break-words text-foreground">
                {step.description}
              </p>
              {step.tips ? (
                <div className="mt-3 border border-accent/40 bg-accent/10 p-3">
                  <p className="flex items-start gap-2 text-xs text-accent">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 break-words">{step.tips}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
