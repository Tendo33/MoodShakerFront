"use client";

import { useState, useEffect, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface WaitingAnimationProps {
  isShowing?: boolean;
  message?: string;
  messageKey?: string;
  subtitleKey?: string;
  progress?: number;
}

const WaitingAnimation = memo(function WaitingAnimation({
  isShowing = true,
  message,
  messageKey = "loading.default",
  subtitleKey = "loading.subtitle",
  progress: externalProgress,
}: WaitingAnimationProps) {
  const { t } = useLanguage();
  const [animationProgress, setAnimationProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

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
      // Use setTimeout instead of pure requestAnimationFrame to throttle state updates to ~20fps (50ms)
      // This significantly reduces React re-renders and CPU usage
      animationFrame = requestAnimationFrame(() => {
        setTimeout(updateAnimation, 50);
      });
    };

    // Only run internal animation loop if no external progress is provided
    if (externalProgress === undefined && !prefersReducedMotion) {
      animationFrame = requestAnimationFrame(updateAnimation);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [externalProgress, prefersReducedMotion]);

  useEffect(() => {
    if (!isShowing) {
      return;
    }

    containerRef.current?.focus();
  }, [isShowing]);


  if (!isShowing) return null;

  // Use external progress if available, otherwise fallback to internal looping animation
  const currentProgress =
    externalProgress !== undefined
      ? externalProgress
      : prefersReducedMotion
        ? 50
        : animationProgress;

  const content = (
    <div
      ref={containerRef}
      className="min-h-screen w-screen bg-black flex items-center justify-center p-6 fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-busy="true"
      tabIndex={-1}
    >
      <div className="absolute inset-0 bg-size-[100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] pointer-events-none mix-blend-overlay z-10" />
      <div
        className="absolute inset-0 bg-[linear-gradient(-45deg,rgba(255,0,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,0,255,0.05)_50%,rgba(255,0,255,0.05)_75%,transparent_75%,transparent)] bg-size-[20px_20px] opacity-20"
      />
      <motion.div
        className="max-w-3xl w-full text-center space-y-20 relative z-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
          <motion.div
            className="text-5xl"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [1, 1.05, 1],
                  }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
            }
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
                <h2 className="text-4xl md:text-5xl font-black text-primary font-heading tracking-widest uppercase pb-2 leading-relaxed px-4 drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">
                  {displayMessage}
                </h2>
                <motion.p
                  className="text-lg text-secondary font-mono tracking-wider font-bold"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          opacity: [0.6, 1, 0.6],
                          textShadow: [
                            "0 0 5px rgba(0,255,255,0.2)",
                            "0 0 15px rgba(0,255,255,0.8)",
                            "0 0 5px rgba(0,255,255,0.2)",
                          ],
                        }
                  }
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : { duration: 2, repeat: Number.POSITIVE_INFINITY }
                  }
                >
                  {displaySubtitle}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full h-3 rounded-none overflow-hidden relative bg-black/50 border-2 border-primary/40 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] max-w-md mx-auto">
            <motion.div
              className="h-full bg-linear-to-r from-primary via-secondary to-accent shadow-[0_0_16px_var(--color-secondary)]"
              style={{ width: `${currentProgress}%` }}
            ></motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (typeof document === "undefined") {
    return content;
  }

  return createPortal(content, document.body);
});

WaitingAnimation.displayName = "WaitingAnimation";

export default WaitingAnimation;
