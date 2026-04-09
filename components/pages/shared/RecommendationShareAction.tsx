"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import type { Cocktail } from "@/lib/cocktail-types";

interface RecommendationShareActionProps {
  cocktail: Cocktail;
  imageUrl: string;
  saveLabel: string;
  shareErrorLabel: string;
}

export function RecommendationShareAction({
  cocktail,
  imageUrl,
  saveLabel,
  shareErrorLabel,
}: RecommendationShareActionProps) {
  return (
    <CocktailSharePortal cocktail={cocktail} imageUrl={imageUrl}>
      {({ isGeneratingCard, generationError, generateCard }) => (
        <div className="flex flex-col items-end gap-3">
          <motion.button
            onClick={generateCard}
            disabled={isGeneratingCard}
            className="flex items-center gap-2 px-6 py-3 border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all duration-300 shadow-[0_0_16px_rgba(0,255,255,0.3)] hover:shadow-[0_0_28px_rgba(0,255,255,0.6)] font-mono font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={saveLabel}
          >
            {isGeneratingCard ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            <span className="font-medium">{saveLabel}</span>
          </motion.button>
          {generationError && (
            <p className="max-w-xs text-right text-sm text-destructive font-mono">
              {shareErrorLabel}
            </p>
          )}
        </div>
      )}
    </CocktailSharePortal>
  );
}
