"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { enterDuration, enterEase } from "@/utils/animation-utils";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n/dictionary";

interface CocktailActionsProps {
  t: (key: TranslationKey) => string;
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
  const reduceMotion = useReducedMotion() === true;

  return (
    <motion.div
      className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : enterDuration, ease: enterEase }}
    >
      <Button
        onClick={onBack}
        variant="outline"
        size="lg"
        icon={<ArrowLeft className="h-4 w-4" />}
      >
        {t("recommendation.back")}
      </Button>

      {onRegenerate && regenerateLabel ? (
        <Button
          onClick={onRegenerate}
          disabled={isRegenerating}
          variant="primary"
          size="lg"
          icon={<RefreshCcw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />}
        >
          {regenerateLabel}
        </Button>
      ) : null}

      {onBrowseMore && browseMoreLabel ? (
        <Button onClick={onBrowseMore} variant="outline" size="lg">
          {browseMoreLabel}
        </Button>
      ) : null}
    </motion.div>
  );
}
