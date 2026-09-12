"use client";

import { useState, useEffect, memo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal";
import { Progress } from "@/components/ui/progress";

interface WaitingAnimationProps {
  isShowing?: boolean;
  message?: string;
  messageKey?: TranslationKey;
  subtitleKey?: TranslationKey;
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
        className="relative z-20 flex w-full max-w-xl flex-col gap-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="sr-only">{displayMessage}</h2>
        <p className="sr-only">{displaySubtitle}</p>
        <Terminal
          title="SHAKE.EXE"
          startOnView={false}
          sequence={!prefersReducedMotion}
          className="mx-auto"
        >
          {prefersReducedMotion ? (
            <>
              <span className="text-secondary">{`$ moodshaker mix --live`}</span>
              <span className="text-muted-foreground">{`> ${t("loading.rotating.1")}`}</span>
              <span className="text-muted-foreground">{`> ${t("loading.rotating.2")}`}</span>
              <span className="text-muted-foreground">{`> ${t("loading.rotating.3")}`}</span>
              <span className="text-muted-foreground">{`> ${t("loading.rotating.4")}`}</span>
            </>
          ) : (
            <>
              <TypingAnimation className="text-secondary" duration={28}>
                {`$ moodshaker mix --live`}
              </TypingAnimation>
              <AnimatedSpan className="text-muted-foreground">
                {`> ${t("loading.rotating.1")}`}
              </AnimatedSpan>
              <AnimatedSpan className="text-muted-foreground">
                {`> ${t("loading.rotating.2")}`}
              </AnimatedSpan>
              <AnimatedSpan className="text-muted-foreground">
                {`> ${t("loading.rotating.3")}`}
              </AnimatedSpan>
              <AnimatedSpan className="text-muted-foreground">
                {`> ${t("loading.rotating.4")}`}
              </AnimatedSpan>
            </>
          )}
        </Terminal>
        <p className="text-center font-mono text-sm uppercase tracking-[0.18em] text-primary">
          {displayMessage}
        </p>

        <Progress
          value={currentProgress}
          className="mx-auto h-3 max-w-md border-2 border-primary/40"
        />
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
