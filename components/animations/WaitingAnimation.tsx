"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface WaitingAnimationProps {
  isShowing?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  message?: string;
  messageKey?: string;
  subtitleKey?: string;
  progress?: number;
}

const WaitingAnimation = memo(function WaitingAnimation({
  isShowing = true,
  onComplete,
  onCancel,
  message,
  messageKey = "loading.default",
  subtitleKey = "loading.subtitle",
  progress: externalProgress,
}: WaitingAnimationProps) {
  const { t } = useLanguage();
  const [animationProgress, setAnimationProgress] = useState(0);

  // Get display text: custom message > translated message > fallback
  const displayMessage = message || t(messageKey) || t("loading.default");
  const displaySubtitle = t(subtitleKey) || t("loading.subtitle");

  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    const cycleDuration = 4000;

    const updateAnimation = () => {
      const elapsed = (Date.now() - startTime) % cycleDuration;
      const progress = (elapsed / cycleDuration) * 100;
      setAnimationProgress(progress);
      animationFrame = requestAnimationFrame(updateAnimation);
    };

    // Only run internal animation loop if no external progress is provided
    if (externalProgress === undefined) {
      animationFrame = requestAnimationFrame(updateAnimation);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [externalProgress]);

  useEffect(() => {
    if (externalProgress && externalProgress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [externalProgress, onComplete]);

  if (!isShowing) return null;

  // Use external progress if available, otherwise fallback to internal looping animation
  const currentProgress =
    externalProgress !== undefined ? externalProgress : animationProgress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 fixed inset-0 z-50">
      <motion.div
        className="max-w-3xl w-full text-center space-y-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative mx-auto w-40 h-40">
          <motion.div className="absolute inset-0 rounded-full border-2 border-slate-700/30" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, #FFB74D, #FF4081, #FF6B35, transparent)",
              borderRadius: "50%",
              mask: "radial-gradient(circle at center, transparent 68%, black 72%, black 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-400/25 to-pink-400/25 backdrop-blur-sm"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            🍸
          </motion.div>
        </div>

        <div className="space-y-12">
          <div className="min-h-[160px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayMessage}
                className="space-y-6 w-full"
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 bg-clip-text text-transparent tracking-wide pb-2 leading-relaxed px-4">
                  {displayMessage}
                </h2>
                <motion.p
                  className="text-lg text-slate-300 font-light"
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    color: [
                      "rgb(203 213 225)",
                      "rgb(251 191 36)",
                      "rgb(203 213 225)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {displaySubtitle}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden relative bg-slate-700/50 max-w-md mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full shadow-lg shadow-amber-400/20"
              style={{ width: `${currentProgress}%` }}
            ></motion.div>
          </div>

          {onCancel && (
            <motion.button
              onClick={onCancel}
              className="mt-8 px-6 py-2.5 rounded-full border border-slate-600 text-slate-400 text-sm font-medium hover:border-slate-400 hover:text-slate-200 transition-colors duration-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t("loading.cancel") || "Cancel"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
});

WaitingAnimation.displayName = "WaitingAnimation";

export default WaitingAnimation;
