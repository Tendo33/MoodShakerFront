"use client";

import { useEffect, useState, memo, useCallback, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import WaitingAnimation from "./WaitingAnimation";

interface SmartLoadingSystemProps {
  isShowing: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  message?: string;
  type?:
    | "cocktail-mixing"
    | "recommendation"
    | "image-generation"
    | "api-call"
    | "navigation";
  actualProgress?: number;
  estimatedDuration?: number;
}

interface LoadingConfig {
  variant: "cocktail" | "martini" | "wine" | "shot";
  messageKey: string;
  glassStyle: string;
  ambientColor: string;
  duration: number;
}

const SmartLoadingSystem = memo(function SmartLoadingSystem({
  isShowing,
  onComplete,
  onCancel,
  message,
  type = "cocktail-mixing",
  actualProgress = 0,
  estimatedDuration = 3000,
}: SmartLoadingSystemProps) {
  const { t } = useLanguage();
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState<LoadingConfig>();

  // Use ref to persist start time across re-renders (prevent reset on message change)
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const configs: Record<string, LoadingConfig> = {
      "cocktail-mixing": {
        variant: "cocktail",
        messageKey: "loading.mixing",
        glassStyle: "elegant",
        ambientColor: "amber-pink",
        duration: 3500,
      },
      recommendation: {
        variant: "martini",
        messageKey: "loading.analyzing",
        glassStyle: "sophisticated",
        ambientColor: "blue-purple",
        duration: 2800,
      },
      "image-generation": {
        variant: "wine",
        messageKey: "loading.generating",
        glassStyle: "artistic",
        ambientColor: "rose-gold",
        duration: 4000,
      },
      "api-call": {
        variant: "shot",
        messageKey: "loading.connecting",
        glassStyle: "minimal",
        ambientColor: "cool-blue",
        duration: 1500,
      },
      navigation: {
        variant: "cocktail",
        messageKey: "loading.navigating",
        glassStyle: "smooth",
        ambientColor: "warm-amber",
        duration: 800,
      },
    };

    setLoadingConfig(configs[type] || configs["cocktail-mixing"]);
  }, [type]); // Removed 'message' dependency to avoid unnecessary config re-sets

  // Initialize start time when showing
  useEffect(() => {
    if (isShowing && startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      setSimulatedProgress(0);
    } else if (!isShowing) {
      startTimeRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isShowing]);

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current || !isShowing) return;

    const elapsed = Date.now() - startTimeRef.current;

    // Calculate purely simulated progress (0-95%)
    const estimatedProgress = Math.min((elapsed / estimatedDuration) * 100, 95);

    // Merge with actual progress if provided
    // Logic: actual progress is the floor. If actual > estimated, jump to actual.
    // If estimated > actual, continue simulating but don't exceed 98% until actual hits 100%.

    let combinedProgress = estimatedProgress;

    if (actualProgress > 0) {
      if (actualProgress >= 100) {
        combinedProgress = 100;
      } else {
        // Allow simulation to run ahead, but smoothly blend
        combinedProgress = Math.max(estimatedProgress, actualProgress);
        // Cap at 98% if actual is not done
        combinedProgress = Math.min(combinedProgress, 98);
      }
    }

    setSimulatedProgress(combinedProgress);

    if (combinedProgress < 100) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      // Ensure we hit exactly 100 and call complete
      setSimulatedProgress(100);
      setTimeout(() => {
        onComplete?.();
      }, 800); // Wait a bit at 100% before firing complete
    }
  }, [actualProgress, estimatedDuration, onComplete, isShowing]);

  // Start animation loop
  useEffect(() => {
    if (isShowing && startTimeRef.current !== null) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isShowing, updateProgress]); // Depends on updateProgress which changes with actualProgress

  if (!loadingConfig) return null;

  // Get display message: custom prop > translated > fallback
  const displayMessage = message || t(loadingConfig.messageKey);

  return (
    <WaitingAnimation
      isShowing={isShowing}
      onComplete={onComplete}
      onCancel={onCancel}
      message={displayMessage}
      progress={simulatedProgress}
    />
  );
});

SmartLoadingSystem.displayName = "SmartLoadingSystem";

export default SmartLoadingSystem;

export function useSmartLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = () => {
    setIsLoading(true);
    setProgress(0);
  };

  const updateProgress = (newProgress: number) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
  };

  const completeLoading = () => {
    setProgress(100);
    // The actual unmounting is handled by the component calling onComplete
    // We just ensure state reflects completion
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 1000);
  };

  return {
    isLoading,
    progress,
    startLoading,
    updateProgress,
    completeLoading,
  };
}
