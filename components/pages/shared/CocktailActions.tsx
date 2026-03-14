"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface CocktailActionsProps {
  t: (key: string) => string;
  onBack: () => void;
  onBrowseMore?: () => void;
  browseMoreLabel?: string;
  onRegenerate?: () => void;
  regenerateLabel?: string;
  isRegenerating?: boolean;
}

export function CocktailActions({
  t,
  onBack,
  onBrowseMore,
  browseMoreLabel,
  onRegenerate,
  regenerateLabel,
  isRegenerating = false,
}: CocktailActionsProps) {
  return (
    <motion.div
      className="mt-16 flex flex-col sm:flex-row gap-4 justify-center items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] focus-ring"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("recommendation.back")}</span>
      </button>

      {onRegenerate && regenerateLabel && (
        <motion.button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] font-mono font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale focus-ring"
          whileHover={{ scale: isRegenerating ? 1 : 1.05 }}
          whileTap={{ scale: isRegenerating ? 1 : 0.95 }}
        >
          <span className="text-lg">🎲</span>
          <span>{regenerateLabel}</span>
        </motion.button>
      )}

      {onBrowseMore && browseMoreLabel && (
        <button
          onClick={onBrowseMore}
          className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] focus-ring"
        >
          <span className="text-lg">🍹</span>
          <span>{browseMoreLabel}</span>
        </button>
      )}
    </motion.div>
  );
}
