"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Cocktail, BartenderRequest } from "@/lib/cocktail-types";
import { asyncStorage } from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { generateImagePrompt } from "@/api/image";
import { generateSessionId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktailForm } from "@/context/CocktailFormContext";
import { withTimeout } from "@/utils/withTimeout";

// Storage key constants
const STORAGE_KEYS = {
  RECOMMENDATION: "moodshaker-recommendation",
  SESSION_ID: "moodshaker-session-id",
  REQUEST: "moodshaker-request",
  IMAGE_DATA: "moodshaker-image-data",
};

const MAX_PERSISTED_IMAGE_BYTES = 320 * 1024;
const IMAGE_PERSIST_DEBOUNCE_MS = 5000;
const COCKTAIL_REQUEST_TIMEOUT_MS = 45000;
const COCKTAIL_REQUEST_RETRY_LIMIT = 2;

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface CocktailResultContextType {
  recommendation: Cocktail | null;
  imageData: string | null;
  isLoading: boolean;
  isImageLoading: boolean;
  error: string | null;
  imageError: string | null;
  progressPercentage: number;
  loadSavedData: () => void;
  submitRequest: (regenerate?: boolean) => Promise<Cocktail>;
  resetResult: () => Promise<void>;
  setIsImageLoading: (loading: boolean) => void;
  refreshImage: () => Promise<string | null>;
}

const CocktailResultContext = createContext<
  CocktailResultContextType | undefined
>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CocktailResultProviderProps {
  children: ReactNode;
}

export const CocktailResultProvider = ({
  children,
}: CocktailResultProviderProps) => {
  const { t, language } = useLanguage();
  const { answers, baseSpirits, userFeedback } = useCocktailForm();

  // Persisted result state via batch async storage
  const {
    data: savedData,
    isLoading: isDataLoading,
    updateItem,
    reload: reloadData,
  } = useBatchAsyncState<{
    recommendation: Cocktail | null;
    imageData: string | null;
  }>([
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

  const recommendation = savedData.recommendation || null;
  const persistedImageData = savedData.imageData || null;

  // Volatile (non-persisted) state
  const [isLoading, setIsLoading] = useState(false);
  const [isImageLoading, setIsImageLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [volatileImageData, setVolatileImageData] = useState<string | null>(
    null,
  );

  const imagePersistenceRef = useRef<{ signature: string; timestamp: number }>({
    signature: "",
    timestamp: 0,
  });

  const imageData = volatileImageData || persistedImageData;

  // ------ helpers ------

  const loadSavedData = useCallback(() => {
    reloadData().catch(() => {
      cocktailLogger.error("Failed to reload result data");
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

  // ------ actions ------

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

        for (
          let attempt = 1;
          attempt <= COCKTAIL_REQUEST_RETRY_LIMIT;
          attempt += 1
        ) {
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
              language === "en"
                ? "Cocktail request timeout"
                : "鸡尾酒推荐请求超时",
            );

            if (!response.ok) {
              let errorMessage = t("error.generationFailed");
              try {
                const errorData = await response.json();
                if (
                  typeof errorData?.error === "string" &&
                  errorData.error.trim()
                ) {
                  errorMessage = errorData.error;
                }
              } catch {
                // Ignore non-JSON error payloads
              }

              const responseError = new Error(errorMessage);
              if (
                response.status >= 500 &&
                attempt < COCKTAIL_REQUEST_RETRY_LIMIT
              ) {
                lastRequestError = responseError;
                continue;
              }
              throw responseError;
            }

            cocktailResponse = response;
            break;
          } catch (error) {
            const resolvedError =
              error instanceof Error
                ? error
                : new Error(t("error.generationFailed"));
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
            cocktailLogger.warn(
              "Cocktail request downgraded to cached recommendation",
            );
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

        // Start background image generation (non-blocking)
        setIsImageLoadingState(true);
        setImageError(null);

        const prompt = generateImagePrompt(nextRecommendation);

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
                  cocktailName: nextRecommendation?.name,
                }),
              }),
              30000,
              "Image generation timeout",
            );

            if (!imageResponse.ok) {
              const errorData = await imageResponse.json();
              const errorMsg =
                language === "en"
                  ? "Image generation failed. Using default image."
                  : "图片生成失败，使用默认图片。";
              setImageError(errorMsg);
              cocktailLogger.warn(
                "图片生成失败，使用默认图片",
                errorData.error,
              );
              await persistImageData(null, true);
            } else {
              const imgData = await imageResponse.json();
              await persistImageData(imgData.data);
              setImageError(null);
            }
          } catch (error) {
            const errorMsg =
              language === "en"
                ? error instanceof Error &&
                  error.message === "Image generation timeout"
                  ? "Image generation timed out. Using default image."
                  : "Image generation failed. Using default image."
                : error instanceof Error &&
                    error.message === "Image generation timeout"
                  ? "图片生成超时，使用默认图片。"
                  : "图片生成失败，使用默认图片。";
            setImageError(errorMsg);
            cocktailLogger.error("后台图片生成出错", error);
            await persistImageData(null, true);
          } finally {
            setIsImageLoadingState(false);
          }
        };

        // Fire and forget
        generateImageTask();

        setProgressPercentage(100);
        return nextRecommendation;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate cocktail recommendation.";
        setError(errorMessage);
        cocktailLogger.error(
          "Error generating cocktail recommendation",
          err,
        );
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
            cocktailName: recommendation.name,
          }),
        }),
        30000,
        "Image generation timeout",
      );

      if (!imageResponse.ok) {
        const errorData = await imageResponse.json();
        const errorMsg =
          language === "en"
            ? "Failed to refresh image. Please try again."
            : "刷新图片失败，请重试。";
        setImageError(errorMsg);
        throw new Error(errorData.error || "Failed to refresh image");
      }

      const imgData = await imageResponse.json();
      await persistImageData(imgData.data, true);
      setImageError(null);

      return imgData.data;
    } catch (err) {
      const errorMsg =
        language === "en"
          ? err instanceof Error &&
            err.message === "Image generation timeout"
            ? "Image refresh timed out. Please try again."
            : "Failed to refresh image. Please try again."
          : err instanceof Error &&
              err.message === "Image generation timeout"
            ? "图片刷新超时，请重试。"
            : "刷新图片失败，请重试。";
      setImageError(errorMsg);
      cocktailLogger.error("Error refreshing cocktail image", err);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [recommendation, language, persistImageData, setIsImageLoading]);

  const resetResult = useCallback(async () => {
    try {
      await reloadData();
      setError(null);
      setProgressPercentage(0);
      setVolatileImageData(null);
      imagePersistenceRef.current = { signature: "", timestamp: 0 };
      cocktailLogger.debug("Result data reset successfully");
    } catch {
      cocktailLogger.error("Failed to reset result data");
      setError(t("error.resetData"));
    }
  }, [reloadData, t]);

  // ------ memo value ------

  const contextValue = useMemo(
    () => ({
      recommendation,
      imageData,
      isLoading: isLoading || isDataLoading,
      isImageLoading,
      error,
      imageError,
      progressPercentage,
      loadSavedData,
      submitRequest,
      resetResult,
      setIsImageLoading,
      refreshImage,
    }),
    [
      recommendation,
      imageData,
      isLoading,
      isDataLoading,
      isImageLoading,
      error,
      imageError,
      progressPercentage,
      loadSavedData,
      submitRequest,
      resetResult,
      setIsImageLoading,
      refreshImage,
    ],
  );

  return (
    <CocktailResultContext.Provider value={contextValue}>
      {children}
    </CocktailResultContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCocktailResult = () => {
  const context = useContext(CocktailResultContext);
  if (!context) {
    throw new Error(
      "useCocktailResult must be used within a CocktailResultProvider",
    );
  }
  return context;
};
