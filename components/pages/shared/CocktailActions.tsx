"use client";

import { motion } from "framer-motion";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/core";

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
      <Button
        onClick={onBack}
        variant="outline"
        size="lg"
        effect="lift"
        icon={<ArrowLeft className="h-4 w-4" />}
      >
        {t("recommendation.back")}
      </Button>

      {onRegenerate && regenerateLabel && (
        <motion.div
          whileHover={{ scale: isRegenerating ? 1 : 1.05 }}
          whileTap={{ scale: isRegenerating ? 1 : 0.95 }}
        >
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="primary"
            size="lg"
            effect="glow"
            icon={<RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />}
          >
            {regenerateLabel}
          </Button>
        </motion.div>
      )}

      {onBrowseMore && browseMoreLabel && (
        <Button
          onClick={onBrowseMore}
          variant="outline"
          size="lg"
          effect="lift"
        >
          {browseMoreLabel}
        </Button>
      )}
    </motion.div>
  );
}
