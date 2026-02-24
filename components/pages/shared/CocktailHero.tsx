"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Cocktail } from "@/api/cocktail";
import { CocktailSpecs } from "@/components/pages/shared/CocktailSpecs";

interface CocktailHeroProps {
  cocktail: Cocktail;
  language: string;
  isPageLoaded: boolean;
  t: (key: string) => string;
  textColorClass: string;
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
  textColorClass,
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
            className="rounded-3xl overflow-hidden shadow-2xl glass-effect relative aspect-square p-2"
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
              className={`text-5xl md:text-6xl font-bold font-playfair ${gradientTextClass} inline-block`}
              style={{
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                lineHeight: "1.1",
                paddingBottom: "0.25rem",
              }}
            >
              {getLocalizedContent("name", "english_name")}
            </h1>
            {cocktail.english_name && language === "cn" && (
              <p className="text-muted-foreground text-2xl font-playfair italic">
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
            <p className="text-foreground/80 leading-relaxed text-xl font-source-sans max-w-2xl">
              {getLocalizedContent("description", "english_description")}
            </p>
          </motion.div>

          <CocktailSpecs
            t={t}
            language={language}
            textColorClass={textColorClass}
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
              <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                {t("detail.flavorProfile")}
              </p>
              <div className="flex flex-wrap gap-3">
                {(language === "en" && cocktail.english_flavor_profiles
                  ? cocktail.english_flavor_profiles
                  : cocktail.flavor_profiles
                ).map((flavor, index) => (
                  <motion.span
                    key={index}
                    className="px-4 py-1.5 glass-effect rounded-full text-sm font-medium text-foreground/90"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "rgba(255,255,255,0.1)",
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
