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
import type { Cocktail, BartenderRequest } from "@/lib/cocktail-types";
import {
  asyncStorage,
  clearStorageWithPrefixAsync,
} from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { generateImagePrompt } from "@/api/image";
import { generateSessionId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";
import { withTimeout } from "@/utils/withTimeout";

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
  saveAnswer: (questionId: string, optionId: string) => Promise<void>;
  saveFeedback: (feedback: string) => Promise<void>;
  saveBaseSpirits: (spirits: string[]) => void;
  toggleBaseSpirit: (spiritId: string) => void;
  submitRequest: (regenerate?: boolean) => Promise<Cocktail>;
  isQuestionAnswered: (questionId: string) => boolean;
  resetAll: () => void;
  setIsImageLoading: (loading: boolean) => void;
  refreshImage: () => Promise<string | null>;
}

const CocktailContext = createContext<CocktailContextType | undefined>(
  undefined,
);

const MAX_PERSISTED_IMAGE_BYTES = 320 * 1024;
const IMAGE_PERSIST_DEBOUNCE_MS = 5000;
const COCKTAIL_REQUEST_TIMEOUT_MS = 45000;
const COCKTAIL_REQUEST_RETRY_LIMIT = 2;

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
  const answers = useMemo(
    () => savedData.answers ?? {},
    [savedData.answers],
  );
  const userFeedback = savedData.feedback || "";
  const baseSpirits = useMemo(
    () => savedData.baseSpirits ?? [],
    [savedData.baseSpirits],
  );
  const recommendation = savedData.recommendation || null;
  const persistedImageData = savedData.imageData || null;

  // 其他状态
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [volatileImageData, setVolatileImageData] = useState<string | null>(null);
  const imagePersistenceRef = useRef<{ signature: string; timestamp: number }>({
    signature: "",
    timestamp: 0,
  });
  const imageData = volatileImageData || persistedImageData;

  // 检查数据加载错误
  useEffect(() => {
    const errorKeys = Object.keys(dataErrors);
    if (errorKeys.length > 0) {
      cocktailLogger.error("Data loading error");
    }
  }, [dataErrors]);

  // 兼容原有的 loadSavedData 方法
  const loadSavedData = useCallback(() => {
    reloadData().catch(() => {
      cocktailLogger.error("Failed to reload data");
    });
  }, [reloadData]);

  const estimateDataUrlBytes = useCallback((dataUrl: string): number => {
    const base64Part = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    return Math.floor((base64Part.length * 3) / 4);
  }, []);

  const persistImageData = useCallback(
    async (nextImageData: string | null, force: boolean = false) => {
      setVolatileImageData(nextImageData);

      if (!nextImageData) {
        await updateItem("imageData", null);
        imagePersistenceRef.current = { signature: "", timestamp: 0 };
        return;
      }

      const signature = `${nextImageData.length}:${nextImageData.slice(0, 32)}`;
      const now = Date.now();
      if (
        !force &&
        imagePersistenceRef.current.signature === signature &&
        now - imagePersistenceRef.current.timestamp < IMAGE_PERSIST_DEBOUNCE_MS
      ) {
        return;
      }

      if (nextImageData.startsWith("data:")) {
        const bytes = estimateDataUrlBytes(nextImageData);
        if (bytes > MAX_PERSISTED_IMAGE_BYTES) {
          cocktailLogger.warn("Skip persisting oversized image payload", {
            bytes,
            limit: MAX_PERSISTED_IMAGE_BYTES,
          });
          return;
        }
      }

      await updateItem("imageData", nextImageData);
      imagePersistenceRef.current = { signature, timestamp: now };
    },
    [estimateDataUrlBytes, updateItem],
  );

  const saveAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      const newAnswers = {
        ...answers,
        [questionId]: optionId,
      };

      try {
        await updateItem("answers", newAnswers);
        cocktailLogger.debug("User answer saved successfully");
      } catch {
        cocktailLogger.error("Failed to save answer");
        const errorMessage = t("error.saveAnswers");
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [answers, updateItem, t],
  );

  const saveFeedback = useCallback(
    async (feedback: string) => {
      try {
        await updateItem("feedback", feedback);
        cocktailLogger.debug("User feedback saved successfully");
      } catch {
        cocktailLogger.error("Failed to save feedback");
        const errorMessage = t("error.saveFeedback");
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [updateItem, t],
  );

  const saveBaseSpirits = useCallback(
    async (spirits: string[]) => {
      try {
        await updateItem("baseSpirits", spirits);
        cocktailLogger.debug("Base spirits saved successfully");
      } catch {
        cocktailLogger.error("Failed to save base spirits");
        setError(t("error.saveBaseSpirits"));
      }
    },
    [updateItem, t],
  );

  const toggleBaseSpirit = useCallback(
    async (spiritId: string) => {
      const updatedSpirits = baseSpirits.includes(spiritId)
        ? baseSpirits.filter((id) => id !== spiritId)
        : [...baseSpirits, spiritId];

      try {
        await updateItem("baseSpirits", updatedSpirits);
        cocktailLogger.debug("Base spirit toggled successfully");
      } catch {
        cocktailLogger.error("Failed to toggle base spirit");
        setError(t("error.toggleBaseSpirit"));
      }
    },
    [baseSpirits, updateItem, t],
  );

  const submitRequest = useCallback(
    async (regenerate: boolean = false): Promise<Cocktail> => {
      setIsLoading(true);
      setError(null);
      setProgressPercentage(0);
      setVolatileImageData(null);

      let nextRecommendation: Cocktail | null = null;

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

        let cocktailResponse: Response | null = null;
        let lastRequestError: Error | null = null;

        for (let attempt = 1; attempt <= COCKTAIL_REQUEST_RETRY_LIMIT; attempt += 1) {
          try {
            const response = await withTimeout(
              fetch("/api/cocktail", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...request,
                  language,
                }),
              }),
              COCKTAIL_REQUEST_TIMEOUT_MS,
              language === "en" ? "Cocktail request timeout" : "鸡尾酒推荐请求超时",
            );

            if (!response.ok) {
              let errorMessage = t("error.generationFailed");
              try {
                const errorData = await response.json();
                if (typeof errorData?.error === "string" && errorData.error.trim()) {
                  errorMessage = errorData.error;
                }
              } catch {
                // Ignore non-JSON error payloads
              }

              const responseError = new Error(errorMessage);
              if (response.status >= 500 && attempt < COCKTAIL_REQUEST_RETRY_LIMIT) {
                lastRequestError = responseError;
                continue;
              }
              throw responseError;
            }

            cocktailResponse = response;
            break;
          } catch (error) {
            const resolvedError =
              error instanceof Error ? error : new Error(t("error.generationFailed"));
            lastRequestError = resolvedError;

            if (attempt < COCKTAIL_REQUEST_RETRY_LIMIT) {
              cocktailLogger.warn("Cocktail request failed, retrying", {
                attempt,
                message: resolvedError.message,
              });
              continue;
            }
          }
        }

        if (!cocktailResponse) {
          if (recommendation) {
            const fallbackMessage =
              language === "en"
                ? "Network unstable, showing your last successful recommendation."
                : "网络不稳定，已为你展示最近一次成功推荐。";
            setError(fallbackMessage);
            cocktailLogger.warn("Cocktail request downgraded to cached recommendation");
            setProgressPercentage(100);
            return recommendation;
          }
          throw lastRequestError || new Error(t("error.generationFailed"));
        }

        const cocktailData = await cocktailResponse.json();
        nextRecommendation = cocktailData.data;

        if (!nextRecommendation) {
          throw new Error(t("error.invalidData"));
        }

        await updateItem("recommendation", nextRecommendation);

        // 启动后台图片生成任务（不阻塞主流程）
        // 设置图片加载状态为 true，这样推荐页会显示加载动画
        setIsImageLoadingState(true);
        setImageError(null); // 清除之前的图片错误

        const prompt = generateImagePrompt(nextRecommendation);

        // 使用异步函数执行图片生成，不使用 await 阻塞主线程
        const generateImageTask = async () => {
          try {
            const imageResponse = await withTimeout(
              fetch("/api/image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  prompt,
                  sessionId,
                  cocktailName: nextRecommendation?.name, // Pass cocktail name for saving image
                }),
              }),
              30000,
              "Image generation timeout",
            );

            if (!imageResponse.ok) {
              const errorData = await imageResponse.json();
              const errorMsg = language === "en"
                ? "Image generation failed. Using default image."
                : "图片生成失败，使用默认图片。";
              setImageError(errorMsg);
              cocktailLogger.warn("图片生成失败，使用默认图片", errorData.error);
              // 图片生成失败不影响整体流程，使用 null
              await persistImageData(null, true);
            } else {
              const imageData = await imageResponse.json();
              await persistImageData(imageData.data);
              setImageError(null); // 成功后清除错误
            }
          } catch (error) {
            const errorMsg = language === "en"
              ? error instanceof Error && error.message === "Image generation timeout"
                ? "Image generation timed out. Using default image."
                : "Image generation failed. Using default image."
              : error instanceof Error && error.message === "Image generation timeout"
                ? "图片生成超时，使用默认图片。"
                : "图片生成失败，使用默认图片。";
            setImageError(errorMsg);
            cocktailLogger.error("后台图片生成出错", error);
            await persistImageData(null, true);
          } finally {
            // 无论成功失败，都结束图片加载状态
            setIsImageLoadingState(false);
          }
        };

        // 触发后台任务
        generateImageTask();

        setProgressPercentage(100);
        return nextRecommendation;
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
    },
    [
      answers,
      baseSpirits,
      language,
      userFeedback,
      updateItem,
      recommendation,
      persistImageData,
      t,
    ],
  );

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
      setVolatileImageData(null);
      imagePersistenceRef.current = { signature: "", timestamp: 0 };
      cocktailLogger.debug("All data reset successfully");
    } catch {
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

      // 调用服务端 API 路由生成图片
      const imageResponse = await withTimeout(
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
        30000,
        "Image generation timeout",
      );

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        const errorMsg = language === "en"
          ? "Failed to refresh image. Please try again."
          : "刷新图片失败，请重试。";
        setImageError(errorMsg);
        throw new Error(errorData.error || "Failed to refresh image");
      }

      const imageData = await imageResponse.json();
      await persistImageData(imageData.data, true);
      setImageError(null); // 成功后清除错误

      return imageData.data;
    } catch (err) {
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
  }, [recommendation, language, persistImageData, setIsImageLoading]);

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
