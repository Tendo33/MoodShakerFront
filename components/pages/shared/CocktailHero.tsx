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
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <motion.div
          className="w-full lg:w-2/5"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <motion.div
            className="glass-panel relative aspect-square overflow-hidden border border-secondary/45 p-2 shadow-[0_24px_52px_rgba(3,0,9,0.34),0_0_20px_rgba(93,246,255,0.12)]"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
            className="space-y-4 text-center lg:text-left"
            style={{ paddingBottom: "0.5rem", lineHeight: "1.2" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            <h1
              className={`inline-block text-safe-wrap text-4xl font-black font-heading uppercase tracking-[0.14em] drop-shadow-[0_0_12px_rgba(255,79,216,0.24)] sm:text-5xl md:text-6xl ${gradientTextClass}`}
              style={{
                lineHeight: "1.1",
                paddingBottom: "0.25rem",
              }}
            >
              {getLocalizedContent("name", "english_name")}
            </h1>
            {cocktail.english_name && language === "cn" && (
              <p className="text-safe-wrap text-xl font-mono uppercase tracking-[0.2em] text-secondary/90 md:text-2xl">
                {cocktail.english_name}
              </p>
            )}
          </motion.div>

          <motion.div
            className="mb-10 mt-8"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            <p className="max-w-2xl border-l-2 border-primary/65 bg-black/35 px-5 py-4 text-safe-wrap text-lg font-mono leading-relaxed text-foreground shadow-[0_14px_30px_rgba(3,0,9,0.16)]">
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
              <p className="mb-3 text-sm font-mono uppercase tracking-widest text-secondary/85">
                {t("detail.flavorProfile")}
              </p>
              <div className="flex flex-wrap gap-3">
              {(language === "en" && cocktail.english_flavor_profiles
                  ? cocktail.english_flavor_profiles
                  : cocktail.flavor_profiles || []
                ).map((flavor, index) => (
                  <motion.span
                    key={index}
                    className="glass-subtle border border-primary/40 px-4 py-1.5 text-safe-wrap text-sm font-bold uppercase tracking-[0.18em] text-primary"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.04,
                      backgroundColor: "rgba(255, 79, 216, 0.12)",
                      boxShadow: "0 14px 24px rgba(3, 0, 9, 0.18)"
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
