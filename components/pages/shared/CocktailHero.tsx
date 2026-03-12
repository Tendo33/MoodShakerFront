"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Cocktail } from "@/lib/cocktail-types";
import { CocktailSpecs } from "@/components/pages/shared/CocktailSpecs";

interface CocktailHeroProps {
  cocktail: Cocktail;
  language: string;
  isPageLoaded: boolean;
  t: (key: string) => string;
  gradientTextClass: string;
  imageContent: ReactNode;
  getLocalizedContent: (
    field: keyof Cocktail,
    englishField: keyof Cocktail,
  ) => string | undefined;
}

export function CocktailHero({
  cocktail,
  language,
  isPageLoaded,
  t,
  gradientTextClass,
  imageContent,
  getLocalizedContent,
}: CocktailHeroProps) {
  return (
    <motion.div
      className="mb-16 md:mb-24"
      initial="hidden"
      animate={isPageLoaded ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
    >
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
        <motion.div
          className="w-full lg:w-2/5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <motion.div
            className="rounded-none overflow-hidden border-2 border-secondary shadow-[0_0_30px_rgba(0,255,255,0.2)] glass-panel relative aspect-square p-2"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          >
            {imageContent}
          </motion.div>
        </motion.div>

        <motion.div
          className="w-full lg:w-3/5 flex flex-col"
          style={{ overflow: "visible", minHeight: "auto" }}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <motion.div
            className="text-center lg:text-left space-y-4"
            style={{ paddingBottom: "0.5rem", lineHeight: "1.2" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            <h1
              className={`text-5xl md:text-6xl font-black font-heading tracking-widest uppercase ${gradientTextClass} inline-block drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]`}
              style={{
                lineHeight: "1.1",
                paddingBottom: "0.25rem",
              }}
            >
              {getLocalizedContent("name", "english_name")}
            </h1>
            {cocktail.english_name && language === "cn" && (
              <p className="text-secondary text-2xl font-mono tracking-[0.2em] uppercase drop-shadow-[0_0_5px_currentColor]">
                {cocktail.english_name}
              </p>
            )}
          </motion.div>

          <motion.div
            className="mt-8 mb-10"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            <p className="text-foreground leading-relaxed text-lg font-mono max-w-2xl bg-black/60 p-4 border-l-2 border-primary">
              {getLocalizedContent("description", "english_description")}
            </p>
          </motion.div>

          <CocktailSpecs
            t={t}
            language={language}
            getLocalizedContent={getLocalizedContent}
          />

          {cocktail.flavor_profiles?.length > 0 && (
            <motion.div
              className="mt-8"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.5 } },
              }}
            >
              <p className="text-sm text-secondary mb-3 uppercase tracking-widest font-mono">
                {t("detail.flavorProfile")}
              </p>
              <div className="flex flex-wrap gap-3">
              {(language === "en" && cocktail.english_flavor_profiles
                  ? cocktail.english_flavor_profiles
                  : cocktail.flavor_profiles || []
                ).map((flavor, index) => (
                  <motion.span
                    key={index}
                    className="px-4 py-1.5 glass-panel border border-primary text-primary rounded-none text-sm font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(255,0,255,0.1)",
                      boxShadow: "0 0 15px rgba(255,0,255,0.5)"
                    }}
                  >
                    {flavor}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
