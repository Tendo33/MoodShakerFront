"use client";

import { motion } from "framer-motion";
import { Clock, Droplet, GlassWater } from "lucide-react";
import type { Cocktail } from "@/api/cocktail";

interface CocktailSpecsProps {
  t: (key: string) => string;
  language: string;
  textColorClass: string;
  getLocalizedContent: (
    field: keyof Cocktail,
    englishField: keyof Cocktail,
  ) => string | undefined;
}

export function CocktailSpecs({
  t,
  language,
  textColorClass,
  getLocalizedContent,
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
        className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <div className="mr-2 h-5 w-5 text-pink-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 2v7.31"></path>
              <path d="M14 9.3V1.99"></path>
              <path d="M8.5 2h7"></path>
              <path d="M14 9.3a6 6 0 1 1-4 0"></path>
              <path d="M5.52 16h12.96"></path>
            </svg>
          </div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("detail.baseSpirit")}
          </p>
        </div>
        <p className={`font-bold text-lg ${textColorClass}`}>
          {getLocalizedContent("base_spirit", "english_base_spirit")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <Droplet className="mr-2 h-5 w-5 text-blue-500" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("detail.alcohol")}
          </p>
        </div>
        <p className={`font-bold text-lg ${textColorClass}`}>
          {getLocalizedContent("alcohol_level", "english_alcohol_level")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <Clock className="mr-2 h-5 w-5 text-amber-500" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("detail.prepTime")}
          </p>
        </div>
        <p className={`font-bold text-lg ${textColorClass}`}>
          {getLocalizedContent("time_required", "english_time_required") ||
            (language === "cn" ? "5分钟" : "5 mins")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t("detail.glass")}
          </p>
        </div>
        <p className={`font-bold text-lg ${textColorClass}`}>
          {getLocalizedContent("serving_glass", "english_serving_glass")}
        </p>
      </motion.div>
    </motion.div>
  );
}
