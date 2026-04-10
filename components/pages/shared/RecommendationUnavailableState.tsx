"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/core";

interface RecommendationUnavailableStateProps {
  title: string;
  description: string;
  backLabel: string;
  restartLabel: string;
  onBack: () => void;
  onRestart: () => void;
}

export function RecommendationUnavailableState({
  title,
  description,
  backLabel,
  restartLabel,
  onBack,
  onRestart,
}: RecommendationUnavailableStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="glass-panel relative w-full max-w-xl overflow-hidden border border-primary/35 px-8 py-14 text-center shadow-[0_20px_48px_rgba(3,0,9,0.32)]"
      >
        <div className="absolute inset-0 bg-size-[100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] pointer-events-none mix-blend-overlay" />
        <h2 className="relative z-10 mb-3 text-2xl font-black font-heading uppercase tracking-widest text-primary drop-shadow-[0_0_10px_rgba(255,79,216,0.35)]">
          {title}
        </h2>
        <p className="relative z-10 mx-auto mb-8 max-w-lg border-l-2 border-primary/60 bg-black/35 p-4 font-mono leading-relaxed text-foreground">
          {description}
        </p>
        <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={onRestart} variant="secondary" size="lg" effect="glow">
              {restartLabel}
            </Button>
          </motion.div>
          <Button onClick={onBack} variant="primary" size="lg" effect="lift">
            {backLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
