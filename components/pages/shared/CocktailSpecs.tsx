"use client";

import { motion } from "framer-motion";
import { Clock, Droplet, GlassWater } from "lucide-react";
import type { Cocktail } from "@/lib/cocktail-types";

interface CocktailSpecsProps {
  t: (key: string) => string;
  language: string;
  getLocalizedContent: (
    field: keyof Cocktail,
    englishField: keyof Cocktail,
  ) => string | undefined;
}

export function CocktailSpecs({
  t,
  language,
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
        className="flex flex-col items-center md:items-start p-4 rounded-none glass-panel border-l-2 border-pink-500 bg-black/40 hover:bg-black/60 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.15)]"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <div className="mr-2 h-5 w-5 text-pink-500 drop-shadow-[0_0_5px_currentColor]">
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
          <p className="text-xs text-pink-500 uppercase tracking-widest font-mono">
            {t("detail.baseSpirit")}
          </p>
        </div>
        <p className={`font-mono font-bold text-lg text-white drop-shadow-md`}>
          {getLocalizedContent("base_spirit", "english_base_spirit")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-none glass-panel border-l-2 border-blue-500 bg-black/40 hover:bg-black/60 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <Droplet className="mr-2 h-5 w-5 text-blue-500 drop-shadow-[0_0_5px_currentColor]" />
          <p className="text-xs text-blue-500 uppercase tracking-widest font-mono">
            {t("detail.alcohol")}
          </p>
        </div>
        <p className={`font-mono font-bold text-lg text-white drop-shadow-md`}>
          {getLocalizedContent("alcohol_level", "english_alcohol_level")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-none glass-panel border-l-2 border-amber-500 bg-black/40 hover:bg-black/60 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.15)]"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <Clock className="mr-2 h-5 w-5 text-amber-500 drop-shadow-[0_0_5px_currentColor]" />
          <p className="text-xs text-amber-500 uppercase tracking-widest font-mono">
            {t("detail.prepTime")}
          </p>
        </div>
        <p className={`font-mono font-bold text-lg text-white drop-shadow-md`}>
          {getLocalizedContent("time_required", "english_time_required") ||
            (language === "cn" ? "5分钟" : "5 mins")}
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center md:items-start p-4 rounded-none glass-panel border-l-2 border-emerald-500 bg-black/40 hover:bg-black/60 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        }}
      >
        <div className="flex items-center mb-2">
          <GlassWater className="mr-2 h-5 w-5 text-emerald-500 drop-shadow-[0_0_5px_currentColor]" />
          <p className="text-xs text-emerald-500 uppercase tracking-widest font-mono">
            {t("detail.glass")}
          </p>
        </div>
        <p className={`font-mono font-bold text-lg text-white drop-shadow-md`}>
          {getLocalizedContent("serving_glass", "english_serving_glass")}
        </p>
      </motion.div>
    </motion.div>
  );
}
