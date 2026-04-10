"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { Button } from "@/components/ui/core";
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
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={generateCard}
              disabled={isGeneratingCard}
              variant="primary"
              size="lg"
              effect="glow"
              icon={
                isGeneratingCard ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )
              }
              aria-label={saveLabel}
            >
              {saveLabel}
            </Button>
          </motion.div>
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
