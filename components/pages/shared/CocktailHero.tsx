"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { Cocktail } from "@/lib/cocktail-types";
import { CocktailSpecs } from "@/components/pages/shared/CocktailSpecs";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TerminalNote } from "@/components/ui/terminal-note";

interface CocktailHeroProps {
  cocktail: Cocktail;
  language: string;
  isPageLoaded: boolean;
  t: (key: TranslationKey) => string;
  gradientTextClass: string;
  imageContent: ReactNode;
}

export function CocktailHero({
  cocktail,
  language,
  isPageLoaded,
  t,
  gradientTextClass,
  imageContent,
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
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              variant="secondary"
              className="aspect-square border-secondary/45 p-2 shadow-[0_24px_52px_rgba(3,0,9,0.34),0_0_20px_rgba(93,246,255,0.12)]"
            >
              {imageContent}
            </Card>
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
              className={`inline-block text-safe-wrap text-4xl font-black font-heading uppercase tracking-[0.14em] sm:text-5xl md:text-6xl ${gradientTextClass}`}
              style={{
                lineHeight: "1.1",
                paddingBottom: "0.25rem",
              }}
            >
              {cocktail.name}
            </h1>
            {cocktail.nameAllLocales.en && language === "cn" && (
              <p className="text-safe-wrap text-xl font-mono uppercase tracking-[0.2em] text-secondary/90 md:text-2xl">
                {cocktail.nameAllLocales.en}
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
            <TerminalNote className="max-w-2xl bg-black/35 px-5 py-4 text-safe-wrap text-lg text-foreground shadow-[0_14px_30px_rgba(3,0,9,0.16)]">
              {cocktail.description}
            </TerminalNote>
          </motion.div>

          <CocktailSpecs t={t} language={language} cocktail={cocktail} />

          {cocktail.flavorProfileLabels.length > 0 && (
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
              {cocktail.flavorProfileLabels.map((flavor, index) => (
                  <motion.div
                    key={flavor}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.04,
                      backgroundColor: "rgba(255, 79, 216, 0.12)",
                      boxShadow: "0 14px 24px rgba(3, 0, 9, 0.18)",
                    }}
                  >
                    <Badge
                      variant="primary"
                      className="px-4 py-1.5 text-safe-wrap text-sm font-bold tracking-[0.18em]"
                    >
                      {flavor}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
