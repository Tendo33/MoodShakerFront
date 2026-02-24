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
        className="flex items-center justify-center gap-2 px-6 py-3 border border-white/10 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-105 glass-effect text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t("recommendation.back")}</span>
      </button>

      {onRegenerate && regenerateLabel && (
        <motion.button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-amber-500/25 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex items-center justify-center gap-2 px-6 py-3 border border-white/10 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-105 glass-effect text-muted-foreground hover:text-foreground"
        >
          <span className="text-lg">🍹</span>
          <span>{browseMoreLabel}</span>
        </button>
      )}
    </motion.div>
  );
}
