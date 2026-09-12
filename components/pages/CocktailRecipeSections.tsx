"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import type { Cocktail } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/**
 * Recipe sections for a cocktail.
 *
 * Took five localization callbacks as props, one per field, because every text
 * value existed twice on the cocktail and the caller had to decide which half to
 * read. The data layer resolves the locale now, so these fields are plain strings
 * and the props are gone.
 */
interface CocktailRecipeSectionsProps {
  cocktail: Cocktail;
  isPageLoaded: boolean;
  textColorClass: string;
  cardClasses: string;
  toolAlternativeLabelKey?: TranslationKey;
}

export function CocktailRecipeSections({
  cocktail,
  isPageLoaded,
  textColorClass,
  cardClasses,
  toolAlternativeLabelKey = "detail.alternative",
}: CocktailRecipeSectionsProps) {
  const { t } = useLanguage();

  return (
    <motion.div
      className="mb-20"
      initial="hidden"
      animate={isPageLoaded ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      <motion.h2
        className="mb-12 text-center font-heading text-3xl font-black uppercase tracking-widest gradient-text md:text-4xl"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        {t("detail.recipe")}
      </motion.h2>

      <Accordion
        type="multiple"
        defaultValue={["ingredients"]}
        className="flex flex-col gap-6 lg:hidden"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <AccordionItem
            value="ingredients"
            className={cn("glass-effect border-2 border-primary", cardClasses)}
          >
            <AccordionTrigger className="hover:bg-primary/20 hover:text-primary">
              {t("recommendation.ingredients")}
            </AccordionTrigger>
            <AccordionContent>
              <IngredientList cocktail={cocktail} textColorClass={textColorClass} />
            </AccordionContent>
          </AccordionItem>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <AccordionItem
            value="tools"
            className={cn("glass-effect border-2 border-secondary", cardClasses)}
          >
            <AccordionTrigger className="hover:bg-secondary/20 hover:text-secondary">
              {t("recommendation.tools")}
            </AccordionTrigger>
            <AccordionContent>
              <ToolList
                cocktail={cocktail}
                textColorClass={textColorClass}
                alternativeLabel={t(toolAlternativeLabelKey)}
              />
            </AccordionContent>
          </AccordionItem>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <AccordionItem
            value="steps"
            className={cn("glass-effect border-2 border-accent", cardClasses)}
          >
            <AccordionTrigger className="hover:bg-accent/20 hover:text-accent">
              {t("recommendation.steps")}
            </AccordionTrigger>
            <AccordionContent>
              <StepList cocktail={cocktail} textColorClass={textColorClass} compact />
            </AccordionContent>
          </AccordionItem>
        </motion.div>
      </Accordion>

      <div className="hidden items-start gap-10 lg:grid lg:grid-cols-12">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-8 self-start overflow-y-auto scrollbar-thin lg:col-span-4">
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
            }}
          >
            <Card variant="effect" className={cn("border-2 border-primary", cardClasses)}>
              <div className="border-b-2 border-primary bg-primary/10 p-5">
                <h3
                  className={cn(
                    "font-heading text-2xl font-black uppercase tracking-widest",
                    textColorClass,
                  )}
                >
                  {t("recommendation.ingredients")}
                </h3>
              </div>
              <div className="bg-black/20 p-6">
                <IngredientList
                  cocktail={cocktail}
                  textColorClass={textColorClass}
                  roomy
                />
              </div>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.1 } },
            }}
          >
            <Card variant="effect" className={cn("border-2 border-secondary", cardClasses)}>
              <div className="border-b-2 border-secondary bg-secondary/10 p-5">
                <h3
                  className={cn(
                    "font-heading text-2xl font-black uppercase tracking-widest",
                    textColorClass,
                  )}
                >
                  {t("recommendation.tools")}
                </h3>
              </div>
              <div className="bg-black/20 p-6">
                <ToolList
                  cocktail={cocktail}
                  textColorClass={textColorClass}
                  alternativeLabel={t(toolAlternativeLabelKey)}
                  roomy
                />
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-8">
          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
            }}
          >
            <Card
              variant="effect"
              className={cn("h-full border-2 border-accent", cardClasses)}
            >
              <div className="border-b-2 border-accent bg-accent/10 p-5">
                <h3
                  className={cn(
                    "font-heading text-2xl font-black uppercase tracking-widest",
                    textColorClass,
                  )}
                >
                  {t("recommendation.steps")}
                </h3>
              </div>
              <div className="bg-black/10 p-8">
                <StepList cocktail={cocktail} textColorClass={textColorClass} />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function IngredientList({
  cocktail,
  textColorClass,
  roomy = false,
}: {
  cocktail: Cocktail;
  textColorClass: string;
  roomy?: boolean;
}) {
  return (
    <ul className="divide-y divide-white/5">
      {cocktail.ingredients?.map((ingredient, index) => (
        <motion.li
          key={`${ingredient.name}-${index}`}
          className={cn(
            "group flex items-baseline justify-between gap-4",
            roomy ? "py-4" : "py-3",
          )}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <span className={cn("relative font-medium", textColorClass)}>
            {ingredient.name}
          </span>
          <div
            className={cn(
              "relative flex-1 border-b border-dotted border-white/20 opacity-50 transition-all group-hover:border-primary/50 group-hover:opacity-100",
              roomy ? "-top-1.5" : "-top-1",
            )}
          />
          <span className="shrink-0 font-bold text-primary">
            {ingredient.amount}
            {ingredient.unit ? ` ${ingredient.unit}` : ""}
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function ToolList({
  cocktail,
  textColorClass,
  alternativeLabel,
  roomy = false,
}: {
  cocktail: Cocktail;
  textColorClass: string;
  alternativeLabel: string;
  roomy?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {cocktail.tools?.map((tool, index) => {
        const alternative = tool.alternative;
        return (
          <motion.li
            key={`${tool.name}-${index}`}
            className={cn(
              "rounded-none border border-white/10 bg-white/5",
              roomy ? "p-4" : "p-3",
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className={cn("font-medium", roomy && "text-lg", textColorClass)}>
              {tool.name}
            </span>
            {alternative ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {alternativeLabel}: {alternative}
              </p>
            ) : null}
          </motion.li>
        );
      })}
    </ul>
  );
}

function StepList({
  cocktail,
  textColorClass,
  compact = false,
}: {
  cocktail: Cocktail;
  textColorClass: string;
  compact?: boolean;
}) {
  return (
    <ol className={cn("flex flex-col", compact ? "gap-10" : "gap-12")}>
      {cocktail.steps?.map((step) => (
        <motion.li
          key={step.stepNumber}
          className={cn(!compact && "group relative pl-2")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: step.stepNumber * 0.1 }}
        >
          <div className={cn("flex", compact ? "gap-4" : "gap-6")}>
            <div
              className={cn(
                "z-10 flex shrink-0 items-center justify-center rounded-none border-2 border-primary/50 bg-black/40 font-mono font-bold text-primary",
                compact ? "h-8 w-8 text-sm" : "h-10 w-10 transition-all duration-300 group-hover:border-primary",
              )}
            >
              {step.stepNumber}
            </div>
            <div className={cn("flex-1", compact ? "pt-0.5" : "pt-1")}>
              <p
                className={cn(
                  "leading-relaxed",
                  compact ? "text-lg" : "text-xl",
                  textColorClass,
                )}
              >
                {step.description}
              </p>
              {step.tips ? (
                <motion.div
                  className={cn(
                    "relative overflow-hidden rounded-none border-2 border-amber-500/40 bg-amber-500/10",
                    compact ? "mt-3 p-3" : "mt-4 p-4",
                  )}
                  initial={{ opacity: 0, y: compact ? 0 : 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={compact ? { delay: 0.3 } : { duration: 0.3 }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-amber-500/5 to-transparent" />
                  <p
                    className={cn(
                      "relative z-10 flex text-amber-200/90",
                      compact ? "items-center gap-1.5 text-xs" : "items-start gap-2 text-sm",
                    )}
                  >
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>{step.tips}</span>
                  </p>
                </motion.div>
              ) : null}
            </div>
          </div>
          {!compact && step.stepNumber < (cocktail.steps?.length || 0) ? (
            <div className="absolute left-[1.7rem] top-14 -bottom-8 w-px bg-linear-to-b from-primary/50 to-transparent" />
          ) : null}
        </motion.li>
      ))}
    </ol>
  );
}
