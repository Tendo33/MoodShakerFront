"use client";

import { motion } from "framer-motion";
import { Clock, Droplet, FlaskConical, GlassWater } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Cocktail } from "@/lib/cocktail-types";
import type { TranslationKey } from "@/lib/i18n/dictionary";

interface CocktailSpecsProps {
  t: (key: TranslationKey) => string;
  language: string;
  cocktail: Cocktail;
}

/**
 * The four spec tiles: base spirit, strength, prep time, glassware.
 *
 * Took a `getLocalizedContent(field, englishField)` callback and named both halves
 * of each column pair. The data layer resolves the locale now, and the two
 * vocabulary values arrive as display labels alongside their codes.
 */
export function CocktailSpecs({
  t,
  language,
  cocktail,
}: CocktailSpecsProps) {
  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <Card className="flex min-w-0 flex-col items-center border-l-2 border-primary bg-black/40 p-4 transition-colors hover:bg-black/60 md:items-start">
          <div className="mb-2 flex items-center">
            <FlaskConical className="mr-2 h-5 w-5 text-primary" />
            <p className="font-mono text-xs uppercase tracking-widest text-primary">
              {t("detail.baseSpirit")}
            </p>
          </div>
          <p className="text-center font-mono text-base font-bold text-white drop-shadow-md text-safe-wrap md:text-left md:text-lg">
            {cocktail.baseSpiritLabel}
          </p>
        </Card>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <Card
          variant="secondary"
          className="flex min-w-0 flex-col items-center border-l-2 border-secondary bg-black/40 p-4 transition-colors hover:bg-black/60 md:items-start"
        >
          <div className="mb-2 flex items-center">
            <Droplet className="mr-2 h-5 w-5 text-secondary" />
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {t("detail.alcohol")}
            </p>
          </div>
          <p className="text-center font-mono text-base font-bold text-white drop-shadow-md text-safe-wrap md:text-left md:text-lg">
            {cocktail.alcoholLevelLabel}
          </p>
        </Card>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <Card
          variant="accent"
          className="flex min-w-0 flex-col items-center border-l-2 border-accent bg-black/40 p-4 transition-colors hover:bg-black/60 md:items-start"
        >
          <div className="mb-2 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-accent" />
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              {t("detail.prepTime")}
            </p>
          </div>
          <p className="text-center font-mono text-base font-bold text-white drop-shadow-md text-safe-wrap md:text-left md:text-lg">
            {cocktail.timeRequired || (language === "cn" ? "5分钟" : "5 mins")}
          </p>
        </Card>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <Card className="flex min-w-0 flex-col items-center border-l-2 border-secondary bg-black/40 p-4 transition-colors hover:bg-black/60 md:items-start">
          <div className="mb-2 flex items-center">
            <GlassWater className="mr-2 h-5 w-5 text-secondary" />
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {t("detail.glass")}
            </p>
          </div>
          <p className="text-center font-mono text-base font-bold text-white drop-shadow-md text-safe-wrap md:text-left md:text-lg">
            {cocktail.servingGlass}
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
