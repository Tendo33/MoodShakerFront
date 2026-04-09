"use client";

import { motion } from "framer-motion";

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
        className="text-center py-16 px-8 glass-panel rounded-none border-2 border-primary shadow-[0_0_22px_rgba(255,0,255,0.2)] max-w-md w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-size-[100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] pointer-events-none mix-blend-overlay" />
        <h2 className="text-2xl font-black font-heading uppercase tracking-widest text-primary drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] mb-3 relative z-10">
          {title}
        </h2>
        <p className="text-foreground font-mono leading-relaxed mb-8 relative z-10 bg-black/40 p-4 border-l-2 border-primary">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <motion.button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] focus-ring"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span aria-hidden="true">↺</span>
            <span>{restartLabel}</span>
          </motion.button>
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-secondary text-secondary transition-all duration-300 hover:bg-secondary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] focus-ring"
          >
            {backLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
