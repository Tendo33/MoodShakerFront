"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import type { Cocktail, Ingredient, Step, Tool } from "@/lib/cocktail-types";
import { useLanguage } from "@/context/LanguageContext";

interface CocktailRecipeSectionsProps {
  cocktail: Cocktail;
  isPageLoaded: boolean;
  textColorClass: string;
  cardClasses: string;
  getLocalizedIngredientName: (ingredient: Ingredient) => string;
  getLocalizedIngredientAmount: (ingredient: Ingredient) => string;
  getLocalizedIngredientUnit: (ingredient: Ingredient) => string;
  getLocalizedToolName: (tool: Tool) => string;
  getLocalizedStepContent: (step: Step) => { description: string; tips?: string };
  getToolAlternative?: (tool: Tool) => string | undefined;
  toolAlternativeLabelKey?: string;
}

export function CocktailRecipeSections({
  cocktail,
  isPageLoaded,
  textColorClass,
  cardClasses,
  getLocalizedIngredientName,
  getLocalizedIngredientAmount,
  getLocalizedIngredientUnit,
  getLocalizedToolName,
  getLocalizedStepContent,
  getToolAlternative,
  toolAlternativeLabelKey = "detail.alternative",
}: CocktailRecipeSectionsProps) {
  const { t } = useLanguage();
  const resolveToolAlternative = useCallback(
    (tool: Tool) => getToolAlternative?.(tool) || tool.alternative,
    [getToolAlternative],
  );
  const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(true);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  const toggleSection = useCallback((section: "ingredients" | "tools" | "steps") => {
    switch (section) {
      case "ingredients":
        setIsIngredientsExpanded((prev) => !prev);
        break;
      case "tools":
        setIsToolsExpanded((prev) => !prev);
        break;
      case "steps":
        setIsStepsExpanded((prev) => !prev);
        break;
    }
  }, []);

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
        className="text-3xl md:text-4xl font-bold text-center mb-12 font-playfair gradient-text-bright"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        {t("detail.recipe")}
      </motion.h2>

      <div className="lg:hidden space-y-6">
        <motion.div
          className={`rounded-xl overflow-hidden ${cardClasses}`}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <button
            className="w-full p-5 md:p-6 flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors group"
            onClick={() => toggleSection("ingredients")}
          >
            <h3 className={`text-xl font-bold ${textColorClass} group-hover:text-primary transition-colors`}>
              {t("recommendation.ingredients")}
            </h3>
            {isIngredientsExpanded ? (
              <ChevronUp className="h-5 w-5 text-primary transition-transform duration-300" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform duration-300" />
            )}
          </button>
          {isIngredientsExpanded && (
            <div className="p-5 md:p-6 bg-black/20">
              <ul className="divide-y divide-white/5">
                {cocktail.ingredients?.map((ingredient, index) => (
                  <motion.li
                    key={index}
                    className="py-3 flex justify-between items-baseline gap-4 group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className={`${textColorClass} font-medium relative`}>
                      {getLocalizedIngredientName(ingredient)}
                    </span>
                    <div className="flex-1 border-b border-dotted border-white/20 relative -top-1 opacity-50 group-hover:opacity-100 group-hover:border-primary/50 transition-all"></div>
                    <span className="text-primary font-bold shrink-0">
                      {getLocalizedIngredientAmount(ingredient)}
                      {getLocalizedIngredientUnit(ingredient)
                        ? ` ${getLocalizedIngredientUnit(ingredient)}`
                        : ""}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        <motion.div
          className={`rounded-xl overflow-hidden ${cardClasses}`}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <button
            className="w-full p-5 md:p-6 flex justify-between items-center bg-white/5"
            onClick={() => toggleSection("tools")}
          >
            <h3 className={`text-xl font-bold ${textColorClass}`}>
              {t("recommendation.tools")}
            </h3>
            {isToolsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {isToolsExpanded && (
            <div className="p-5 md:p-6 bg-black/20">
              <ul className="space-y-4">
                {cocktail.tools?.map((tool, index) => {
                  const alternative = resolveToolAlternative(tool);
                  return (
                    <motion.li
                      key={index}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className={`${textColorClass} font-medium`}>
                        {getLocalizedToolName(tool)}
                      </span>
                      {alternative && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(toolAlternativeLabelKey)}: {alternative}
                        </p>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.div>

        <motion.div
          className={`rounded-xl overflow-hidden ${cardClasses}`}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <button
            className="w-full p-5 md:p-6 flex justify-between items-center bg-white/5"
            onClick={() => toggleSection("steps")}
          >
            <h3 className={`text-xl font-bold ${textColorClass}`}>
              {t("recommendation.steps")}
            </h3>
            {isStepsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {isStepsExpanded && (
            <div className="p-5 md:p-6 bg-black/20">
              <ol className="space-y-10">
                {cocktail.steps?.map((step) => {
                  const localizedStep = getLocalizedStepContent(step);
                  return (
                    <motion.li
                      key={step.step_number}
                      className="flex gap-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: step.step_number * 0.1 }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] font-bold text-primary shrink-0 z-10 text-sm">
                        {step.step_number}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className={`${textColorClass} text-lg leading-relaxed`}>
                          {localizedStep.description}
                        </p>
                        {localizedStep.tips && (
                          <motion.div
                            className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl relative overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <p className="text-amber-400/70 text-xs flex items-center gap-1.5">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <span>{localizedStep.tips}</span>
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          )}
        </motion.div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4 space-y-8 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
          <motion.div
            className={`rounded-2xl overflow-hidden ${cardClasses}`}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
            }}
          >
            <div className="p-5 bg-white/5 border-b border-white/10">
              <h3 className={`text-2xl font-bold ${textColorClass} font-playfair`}>
                {t("recommendation.ingredients")}
              </h3>
            </div>
            <div className="p-6 bg-black/20">
              <ul className="divide-y divide-white/5">
                {cocktail.ingredients?.map((ingredient, index) => (
                  <motion.li
                    key={index}
                    className="py-4 flex justify-between items-baseline gap-4 group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className={`${textColorClass} font-medium`}>
                      {getLocalizedIngredientName(ingredient)}
                    </span>
                    <div className="flex-1 border-b border-dotted border-white/20 relative -top-1.5 opacity-50 group-hover:opacity-100 group-hover:border-primary/50 transition-all"></div>
                    <span className="text-primary font-bold shrink-0">
                      {getLocalizedIngredientAmount(ingredient)}
                      {getLocalizedIngredientUnit(ingredient)
                        ? ` ${getLocalizedIngredientUnit(ingredient)}`
                        : ""}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            className={`rounded-2xl overflow-hidden ${cardClasses}`}
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.1 } },
            }}
          >
            <div className="p-5 bg-white/5 border-b border-white/10">
              <h3 className={`text-2xl font-bold ${textColorClass} font-playfair`}>
                {t("recommendation.tools")}
              </h3>
            </div>
            <div className="p-6 bg-black/20">
              <ul className="space-y-4">
                {cocktail.tools?.map((tool, index) => {
                  const alternative = resolveToolAlternative(tool);
                  return (
                    <motion.li
                      key={index}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className={`${textColorClass} font-medium text-lg`}>
                        {getLocalizedToolName(tool)}
                      </span>
                      {alternative && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t(toolAlternativeLabelKey)}: {alternative}
                        </p>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-8">
          <motion.div
            className={`rounded-2xl overflow-hidden ${cardClasses} h-full`}
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
            }}
          >
            <div className="p-5 bg-white/5 border-b border-white/10">
              <h3 className={`text-2xl font-bold ${textColorClass} font-playfair`}>
                {t("recommendation.steps")}
              </h3>
            </div>
            <div className="p-8 bg-black/10">
              <ol className="space-y-12">
                {cocktail.steps?.map((step) => {
                  const localizedStep = getLocalizedStepContent(step);
                  return (
                    <motion.li
                      key={step.step_number}
                      className="relative pl-2 group"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: step.step_number * 0.1 }}
                    >
                      <div className="flex gap-6">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:border-primary group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all duration-300 font-bold text-primary shrink-0 z-10">
                          {step.step_number}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`${textColorClass} text-xl leading-relaxed`}>
                            {localizedStep.description}
                          </p>
                          {localizedStep.tips && (
                            <motion.div
                              className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl relative overflow-hidden"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                              <p className="text-amber-200/90 text-sm flex items-start gap-2 relative z-10">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <span>{localizedStep.tips}</span>
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {step.step_number < (cocktail.steps?.length || 0) && (
                        <div className="absolute left-[1.7rem] top-14 bottom-[-2rem] w-px bg-gradient-to-b from-white/20 to-white/5"></div>
                      )}
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
