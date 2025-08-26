"use client";

import { motion } from "framer-motion";
import { useEffect, useState, memo, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import WaitingAnimation from "./WaitingAnimation";

interface SmartLoadingSystemProps {
  isShowing: boolean;
  onComplete?: () => void;
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
  message,
  type = "cocktail-mixing",
  actualProgress = 0,
  estimatedDuration = 3000,
}: SmartLoadingSystemProps) {
  const { t } = useLanguage();
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState<LoadingConfig>();

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
  }, [type, message]);

  // 优化进度更新函数 - 修改为接收startTime参数
  const updateProgress = useCallback((elapsed: number, animationFrame: number, startTime: number) => {
    const estimatedProgress = Math.min(
      (elapsed / estimatedDuration) * 100,
      95,
    );

    const combinedProgress =
      actualProgress > 0
        ? Math.max(actualProgress, estimatedProgress * 0.7)
        : estimatedProgress;

    const naturalProgress = combinedProgress + Math.sin(elapsed * 0.01) * 2;

    setSimulatedProgress(Math.min(naturalProgress, 100));

    if (combinedProgress < 100) {
      requestAnimationFrame(() => updateProgress(Date.now() - startTime, animationFrame, startTime));
    } else {
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }
  }, [actualProgress, estimatedDuration, onComplete]);

  useEffect(() => {
    if (!isShowing || !loadingConfig) return;

    const startTime = Date.now();
    let animationFrame: number;

    const startProgressUpdate = () => {
      animationFrame = requestAnimationFrame(() => updateProgress(Date.now() - startTime, animationFrame, startTime));
    };

    startProgressUpdate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isShowing, actualProgress, estimatedDuration, onComplete, loadingConfig, updateProgress]);

  if (!loadingConfig) return null;

  // Get display message: custom prop > translated > fallback
  const displayMessage = message || t(loadingConfig.messageKey);

  return (
    <WaitingAnimation
      isShowing={isShowing}
      onComplete={onComplete}
      message={displayMessage}
      progress={simulatedProgress}
    />
  );
});

SmartLoadingSystem.displayName = 'SmartLoadingSystem';

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
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 500);
  };

  return {
    isLoading,
    progress,
    startLoading,
    updateProgress,
    completeLoading,
    LoadingComponent: (
      props: Omit<SmartLoadingSystemProps, "isShowing" | "actualProgress">,
    ) => (
      <SmartLoadingSystem
        {...props}
        isShowing={isLoading}
        actualProgress={progress}
      />
    ),
  };
}
