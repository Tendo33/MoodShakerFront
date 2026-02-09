"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Cocktail, BartenderRequest } from "@/api/cocktail";
import {
  asyncStorage,
  saveToStorageAsync,
  clearStorageWithPrefixAsync,
} from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { generateImagePrompt } from "@/api/image";
import { generateSessionId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";

// 存储键常量
const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
  RECOMMENDATION: "moodshaker-recommendation",
  SESSION_ID: "moodshaker-session-id",
  REQUEST: "moodshaker-request",
  IMAGE_DATA: "moodshaker-image-data",
};

interface SpiritOption {
  id: string;
  name: string;
  description?: string;
}

interface CocktailContextType {
  answers: Record<string, string>;
  userFeedback: string;
  baseSpirits: string[];
  recommendation: Cocktail | null;
  imageData: string | null;
  isLoading: boolean;
  isImageLoading: boolean;
  error: string | null;
  imageError: string | null;
  progressPercentage: number;
  loadSavedData: () => void;
  saveAnswer: (questionId: string, optionId: string) => void;
  saveFeedback: (feedback: string) => void;
  saveBaseSpirits: (spirits: string[]) => void;
  toggleBaseSpirit: (
    spiritId: string,
    allSpiritsOptions: SpiritOption[],
  ) => void;
  submitRequest: (regenerate?: boolean) => Promise<Cocktail>;
  isQuestionAnswered: (questionId: string) => boolean;
  resetAll: () => void;
  setIsImageLoading: (loading: boolean) => void;
  refreshImage: () => Promise<string | null>;
}

const CocktailContext = createContext<CocktailContextType | undefined>(
  undefined,
);

interface CocktailProviderProps {
  children: ReactNode;
}

export const CocktailProvider = ({ children }: CocktailProviderProps) => {
  const { t, language } = useLanguage();

  // 使用批量异步状态管理 - 性能优化核心
  const {
    data: savedData,
    isLoading: isDataLoading,
    errors: dataErrors,
    updateItem,
    reload: reloadData,
  } = useBatchAsyncState<{
    answers: Record<string, string>;
    feedback: string;
    baseSpirits: string[];
    recommendation: Cocktail | null;
    imageData: string | null;
  }>([
    { key: "answers", storageKey: STORAGE_KEYS.ANSWERS, defaultValue: {} },
    { key: "feedback", storageKey: STORAGE_KEYS.FEEDBACK, defaultValue: "" },
    {
      key: "baseSpirits",
      storageKey: STORAGE_KEYS.BASE_SPIRITS,
      defaultValue: [],
    },
    {
      key: "recommendation",
      storageKey: STORAGE_KEYS.RECOMMENDATION,
      defaultValue: null,
    },
    {
      key: "imageData",
      storageKey: STORAGE_KEYS.IMAGE_DATA,
      defaultValue: null,
    },
  ]);

  // 解构批量加载的数据
  const answers = savedData.answers || {};
  const userFeedback = savedData.feedback || "";
  const baseSpirits = savedData.baseSpirits || [];
  const recommendation = savedData.recommendation || null;
  const imageData = savedData.imageData || null;

  // 其他状态
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // AbortController for background image generation to prevent memory leaks
  const imageAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount: abort any in-flight image generation
  useEffect(() => {
    return () => {
      if (imageAbortControllerRef.current) {
        imageAbortControllerRef.current.abort();
        imageAbortControllerRef.current = null;
      }
    };
  }, []);

  // 检查数据加载错误
  useEffect(() => {
    const errorKeys = Object.keys(dataErrors);
    if (errorKeys.length > 0) {
      const errorMessages = errorKeys.map(
        (key) => `${key}: ${dataErrors[key].message}`,
      );
      cocktailLogger.error("Data loading error");
    }
  }, [dataErrors]);

  // 兼容原有的 loadSavedData 方法
  const loadSavedData = useCallback(() => {
    reloadData().catch((error) => {
      cocktailLogger.error("Failed to reload data");
    });
  }, [reloadData]);

  const saveAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      const newAnswers = {
        ...answers,
        [questionId]: optionId,
      };

      try {
        await updateItem("answers", newAnswers);
        cocktailLogger.debug("User answer saved successfully");
      } catch (error) {
        cocktailLogger.error("Failed to save answer");
        setError(t("error.saveAnswers"));
      }
    },
    [answers, updateItem, t],
  );

  const saveFeedback = useCallback(
    async (feedback: string) => {
      try {
        await updateItem("feedback", feedback);
        cocktailLogger.debug("User feedback saved successfully");
      } catch (error) {
        cocktailLogger.error("Failed to save feedback");
        setError(t("error.saveFeedback"));
      }
    },
    [updateItem, t],
  );

  const saveBaseSpirits = useCallback(
    async (spirits: string[]) => {
      try {
        await updateItem("baseSpirits", spirits);
        cocktailLogger.debug("Base spirits saved successfully");
      } catch (error) {
        cocktailLogger.error("Failed to save base spirits");
        setError(t("error.saveBaseSpirits"));
      }
    },
    [updateItem, t],
  );

  const toggleBaseSpirit = useCallback(
    async (spiritId: string, allSpiritsOptions: SpiritOption[]) => {
      const updatedSpirits = baseSpirits.includes(spiritId)
        ? baseSpirits.filter((id) => id !== spiritId)
        : [...baseSpirits, spiritId];

      try {
        await updateItem("baseSpirits", updatedSpirits);
        cocktailLogger.debug("Base spirit toggled successfully");
      } catch (error) {
        cocktailLogger.error("Failed to toggle base spirit");
        setError(t("error.toggleBaseSpirit"));
      }
    },
    [baseSpirits, updateItem, t],
  );

  const submitRequest = useCallback(async (regenerate: boolean = false): Promise<Cocktail> => {
    setIsLoading(true);
    setError(null);
    setProgressPercentage(0);

    let recommendation: Cocktail | null = null;

    try {
      const sessionId = generateSessionId();
      await asyncStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);

      const request: BartenderRequest = {
        answers,
        baseSpirits,
        sessionId,
        specialRequests: regenerate
          ? `${userFeedback}\n\n[REGENERATE] Please provide a different cocktail recommendation than before, while keeping the same preferences.`
          : userFeedback,
      };

      await asyncStorage.setItem(STORAGE_KEYS.REQUEST, request);

      // 调用服务端 API 路由生成鸡尾酒推荐
      const cocktailResponse = await fetch("/api/cocktail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          language,
        }),
      });

      if (!cocktailResponse.ok) {
        const errorData = await cocktailResponse.json();
        throw new Error(errorData.error || t("error.generationFailed"));
      }

      const cocktailData = await cocktailResponse.json();
      recommendation = cocktailData.data;

      if (!recommendation) {
        throw new Error(t("error.invalidData"));
      }

      await updateItem("recommendation", recommendation);

      // 启动后台图片生成任务（不阻塞主流程）
      // 设置图片加载状态为 true，这样推荐页会显示加载动画
      setIsImageLoadingState(true);
      setImageError(null); // 清除之前的图片错误

      const prompt = generateImagePrompt(recommendation);

      // Abort any previous in-flight image generation
      if (imageAbortControllerRef.current) {
        imageAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      imageAbortControllerRef.current = abortController;

      // 使用异步函数执行图片生成，不使用 await 阻塞主线程
      const generateImageTask = async () => {
        try {
          // 添加超时机制
          const IMAGE_GENERATION_TIMEOUT = 30000; // 30秒
          const timeoutId = setTimeout(() => abortController.abort(), IMAGE_GENERATION_TIMEOUT);

          const imageResponse = await fetch("/api/image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              sessionId,
              cocktailName: recommendation?.name,
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);

          // If aborted after fetch but before state update, bail out
          if (abortController.signal.aborted) return;

          if (!imageResponse.ok) {
            const errorData = await imageResponse.json();
            const errorMsg = language === "en"
              ? "Image generation failed. Using default image."
              : "图片生成失败，使用默认图片。";
            setImageError(errorMsg);
            cocktailLogger.warn("图片生成失败，使用默认图片", errorData.error);
            await updateItem("imageData", null);
          } else {
            const imageData = await imageResponse.json();
            if (abortController.signal.aborted) return;
            await updateItem("imageData", imageData.data);
            setImageError(null);
          }
        } catch (error) {
          // If aborted (component unmounted or new request), silently exit
          if (abortController.signal.aborted) return;

          const errorMsg = language === "en"
            ? "Image generation failed. Using default image."
            : "图片生成失败，使用默认图片。";
          setImageError(errorMsg);
          cocktailLogger.error("后台图片生成出错", error);
          await updateItem("imageData", null);
        } finally {
          // Only update state if this controller is still the active one
          if (!abortController.signal.aborted) {
            setIsImageLoadingState(false);
          }
        }
      };

      // 触发后台任务
      generateImageTask();

      setProgressPercentage(100);
      return recommendation;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate cocktail recommendation.";
      setError(errorMessage);
      cocktailLogger.error("Error generating cocktail recommendation", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [answers, baseSpirits, language, userFeedback, updateItem]);

  const isQuestionAnswered = useCallback(
    (questionId: string) => !!answers[questionId],
    [answers],
  );

  const resetAll = useCallback(async () => {
    try {
      await clearStorageWithPrefixAsync("moodshaker-");
      // 重新加载数据以确保状态同步
      await reloadData();
      setError(null);
      setProgressPercentage(0);
      cocktailLogger.debug("All data reset successfully");
    } catch (error) {
      cocktailLogger.error("Failed to reset data");
      setError(t("error.resetData"));
    }
  }, [reloadData, t]);

  const setIsImageLoading = useCallback((loading: boolean) => {
    setIsImageLoadingState(loading);
  }, []);

  const refreshImage = useCallback(async (): Promise<string | null> => {
    setIsImageLoading(true);
    setImageError(null);

    try {
      if (!recommendation) {
        throw new Error("No cocktail recommendation available.");
      }

      const sessionId =
        (await asyncStorage.getItem(STORAGE_KEYS.SESSION_ID, "")) || "";
      const prompt = generateImagePrompt(recommendation);

      // 添加超时机制
      const IMAGE_GENERATION_TIMEOUT = 30000; // 30秒
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Image generation timeout")), IMAGE_GENERATION_TIMEOUT)
      );

      // 调用服务端 API 路由生成图片
      const imageResponse = await Promise.race([
        fetch("/api/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            sessionId,
            forceRefresh: true,
            cocktailName: recommendation.name, // Pass name
          }),
        }),
        timeoutPromise
      ]) as Response;

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        const errorMsg = language === "en"
          ? "Failed to refresh image. Please try again."
          : "刷新图片失败，请重试。";
        setImageError(errorMsg);
        throw new Error(errorData.error || "Failed to refresh image");
      }

      const imageData = await imageResponse.json();
      await updateItem("imageData", imageData.data);
      setImageError(null); // 成功后清除错误

      return imageData.data;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to refresh cocktail image.";
      const errorMsg = language === "en"
        ? err instanceof Error && err.message === "Image generation timeout"
          ? "Image refresh timed out. Please try again."
          : "Failed to refresh image. Please try again."
        : err instanceof Error && err.message === "Image generation timeout"
          ? "图片刷新超时，请重试。"
          : "刷新图片失败，请重试。";
      setImageError(errorMsg);
      cocktailLogger.error("Error refreshing cocktail image", err);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [recommendation, updateItem, language]);

  // 移除原有的useEffect，因为批量异步状态管理已经处理了数据加载

  const contextValue = useMemo(() => {
    return {
      answers,
      userFeedback,
      baseSpirits,
      recommendation,
      imageData,
      isLoading: isLoading || isDataLoading, // 合并加载状态
      isImageLoading,
      error,
      imageError,
      progressPercentage,
      loadSavedData,
      saveAnswer,
      saveFeedback,
      saveBaseSpirits,
      toggleBaseSpirit,
      submitRequest,
      isQuestionAnswered,
      resetAll,
      setIsImageLoading,
      refreshImage,
    };
  }, [
    answers,
    userFeedback,
    baseSpirits,
    recommendation,
    imageData,
    isLoading,
    isDataLoading,
    isImageLoading,
    error,
    imageError,
    progressPercentage,
    loadSavedData,
    saveAnswer,
    saveFeedback,
    saveBaseSpirits,
    toggleBaseSpirit,
    submitRequest,
    isQuestionAnswered,
    resetAll,
    setIsImageLoading,
    refreshImage,
  ]);

  return (
    <CocktailContext.Provider value={contextValue}>
      {children}
    </CocktailContext.Provider>
  );
};

export const useCocktailContext = () => {
  const context = useContext(CocktailContext);
  if (!context) {
    throw new Error(
      "useCocktailContext must be used within a CocktailProvider",
    );
  }
  return context;
};

export const useCocktail = () => {
  const context = useContext(CocktailContext);
  if (!context) {
    throw new Error("useCocktail must be used within a CocktailProvider");
  }
  return context;
};
