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
import type {
  BartenderRequest,
  Cocktail,
  RecommendationMeta,
} from "@/lib/cocktail-types";
import { AgentType } from "@/lib/cocktail-types";
import { asyncStorage, removeStorageKeysAsync } from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { generateImagePrompt } from "@/api/image";
import { generateSessionId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktailForm } from "@/context/CocktailFormContext";
import { withTimeout } from "@/utils/withTimeout";

const STORAGE_KEYS = {
  RECOMMENDATION: "moodshaker-recommendation",
  RECOMMENDATION_META: "moodshaker-recommendation-meta",
  SESSION_ID: "moodshaker-session-id",
  REQUEST: "moodshaker-request",
  IMAGE_DATA: "moodshaker-image-data",
};

const MAX_PERSISTED_IMAGE_BYTES = 320 * 1024;
const IMAGE_PERSIST_DEBOUNCE_MS = 5000;
const COCKTAIL_REQUEST_TIMEOUT_MS = 90000;
const COCKTAIL_REQUEST_RETRY_LIMIT = 2;

interface CocktailResultContextType {
  recommendation: Cocktail | null;
  recommendationMeta: RecommendationMeta | null;
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

interface CocktailResultProviderProps {
  children: ReactNode;
}

export const CocktailResultProvider = ({
  children,
}: CocktailResultProviderProps) => {
  const { t, language } = useLanguage();
  const { answers, baseSpirits, userFeedback } = useCocktailForm();

  const {
    data: savedData,
    isLoading: isDataLoading,
    updateItem,
    reload: reloadData,
  } = useBatchAsyncState<{
    recommendation: Cocktail | null;
    recommendationMeta: RecommendationMeta | null;
    request: BartenderRequest | null;
    imageData: string | null;
  }>([
    {
      key: "recommendation",
      storageKey: STORAGE_KEYS.RECOMMENDATION,
      defaultValue: null,
    },
    {
      key: "recommendationMeta",
      storageKey: STORAGE_KEYS.RECOMMENDATION_META,
      defaultValue: null,
    },
    {
      key: "request",
      storageKey: STORAGE_KEYS.REQUEST,
      defaultValue: null,
    },
    {
      key: "imageData",
      storageKey: STORAGE_KEYS.IMAGE_DATA,
      defaultValue: null,
    },
  ]);

  const recommendation = savedData.recommendation || null;
  const recommendationMeta = savedData.recommendationMeta || null;
  const persistedImageData = savedData.imageData || null;

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

  const scopedPersistedImageData =
    recommendation &&
    recommendationMeta &&
    String(recommendation.id || "") === recommendationMeta.recommendationId
      ? persistedImageData
      : null;

  const imageData =
    volatileImageData || scopedPersistedImageData || recommendation?.image || null;

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

  const updateRecommendationImage = useCallback(
    async (
      baseRecommendation: Cocktail | null,
      image: string | null,
      thumbnail?: string | null,
    ) => {
      if (!baseRecommendation) {
        return;
      }

      await updateItem("recommendation", {
        ...baseRecommendation,
        image: image || undefined,
        thumbnail: thumbnail || baseRecommendation.thumbnail,
      });
    },
    [updateItem],
  );

  const submitRequest = useCallback(
    async (regenerate: boolean = false): Promise<Cocktail> => {
      setIsLoading(true);
      setError(null);
      setImageError(null);
      setProgressPercentage(0);
      setVolatileImageData(null);

      let nextRecommendation: Cocktail | null = null;
      let nextRecommendationMeta: RecommendationMeta | null = null;

      try {
        let sessionId =
          (await asyncStorage.getItem(STORAGE_KEYS.SESSION_ID, "")) || "";
        if (!sessionId) {
          sessionId = generateSessionId();
          await asyncStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        }

        const request: BartenderRequest = {
          answers,
          baseSpirits,
          sessionId,
          specialRequests: regenerate
            ? `${userFeedback}\n\n[REGENERATE] Please provide a different cocktail recommendation than before, while keeping the same preferences.`
            : userFeedback,
        };

        const agentType =
          answers["1"] === "creative"
            ? AgentType.CREATIVE_BARTENDER
            : AgentType.CLASSIC_BARTENDER;

        await asyncStorage.setItem(STORAGE_KEYS.REQUEST, request);
        await updateItem("request", request);
        await updateItem("imageData", null);

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
                  agentType,
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
                if (typeof errorData?.error?.message === "string") {
                  errorMessage = errorData.error.message;
                }
              } catch {
                // ignore invalid error payloads
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
          } catch (requestError) {
            const resolvedError =
              requestError instanceof Error
                ? requestError
                : new Error(t("error.generationFailed"));
            lastRequestError = resolvedError;

            if (attempt < COCKTAIL_REQUEST_RETRY_LIMIT) {
              cocktailLogger.warn("Cocktail request failed, retrying", {
                attempt,
                message: resolvedError.message,
              });
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
            setProgressPercentage(100);
            return recommendation;
          }
          throw lastRequestError || new Error(t("error.generationFailed"));
        }

        const payload = await cocktailResponse.json();
        nextRecommendation = payload?.data?.cocktail || null;
        nextRecommendationMeta = payload?.data?.meta || null;

        if (!nextRecommendation || !nextRecommendationMeta) {
          throw new Error(t("error.invalidData"));
        }

        nextRecommendation = {
          ...nextRecommendation,
          id: nextRecommendationMeta.recommendationId,
        };

        await updateItem("recommendation", nextRecommendation);
        await updateItem("recommendationMeta", nextRecommendationMeta);
        await persistImageData(nextRecommendation.image || null, true);

        setIsImageLoadingState(true);

        const prompt = generateImagePrompt(nextRecommendation);
        void (async () => {
          try {
            const imageResponse = await withTimeout(
              fetch("/api/image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recommendationId: nextRecommendationMeta?.recommendationId,
                  editToken: nextRecommendationMeta?.editToken,
                  prompt,
                }),
              }),
              30000,
              "Image generation timeout",
            );

            if (!imageResponse.ok) {
              const errorPayload = await imageResponse.json().catch(() => null);
              cocktailLogger.warn(
                "Image generation failed",
                errorPayload?.error?.message,
              );
              setImageError(
                language === "en"
                  ? "Image generation failed. Using default image."
                  : "图片生成失败，使用默认图片。",
              );
              await persistImageData(null, true);
              return;
            }

            const imagePayload = await imageResponse.json();
            const nextImage = imagePayload?.data?.image || null;
            const nextThumbnail = imagePayload?.data?.thumbnail || null;
            await persistImageData(nextImage, true);
            await updateRecommendationImage(
              nextRecommendation,
              nextImage,
              nextThumbnail,
            );
            setImageError(null);
          } catch (imageGenerationError) {
            setImageError(
              language === "en"
                ? "Image generation failed. Using default image."
                : "图片生成失败，使用默认图片。",
            );
            cocktailLogger.error(
              "Background image generation failed",
              imageGenerationError,
            );
            await persistImageData(null, true);
          } finally {
            setIsImageLoadingState(false);
          }
        })();

        setProgressPercentage(100);
        return nextRecommendation;
      } catch (submitError) {
        const errorMessage =
          submitError instanceof Error
            ? submitError.message
            : "Failed to generate cocktail recommendation.";
        setError(errorMessage);
        cocktailLogger.error(
          "Error generating cocktail recommendation",
          submitError,
        );
        throw submitError;
      } finally {
        setIsLoading(false);
      }
    },
    [
      answers,
      baseSpirits,
      language,
      recommendation,
      t,
      updateItem,
      userFeedback,
      persistImageData,
      updateRecommendationImage,
    ],
  );

  const setIsImageLoading = useCallback((loading: boolean) => {
    setIsImageLoadingState(loading);
  }, []);

  const refreshImage = useCallback(async (): Promise<string | null> => {
    setIsImageLoading(true);
    setImageError(null);

    try {
      if (!recommendation || !recommendationMeta) {
        throw new Error("No cocktail recommendation available.");
      }

      const prompt = generateImagePrompt(recommendation);
      const imageResponse = await withTimeout(
        fetch("/api/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendationId: recommendationMeta.recommendationId,
            editToken: recommendationMeta.editToken,
            prompt,
            forceRefresh: true,
          }),
        }),
        30000,
        "Image generation timeout",
      );

      if (!imageResponse.ok) {
        const errorPayload = await imageResponse.json().catch(() => null);
        throw new Error(
          errorPayload?.error?.message || "Failed to refresh image",
        );
      }

      const payload = await imageResponse.json();
      const nextImage = payload?.data?.image || null;
      const nextThumbnail = payload?.data?.thumbnail || null;
      await persistImageData(nextImage, true);
      await updateRecommendationImage(recommendation, nextImage, nextThumbnail);
      return nextImage;
    } catch (refreshError) {
      setImageError(
        language === "en"
          ? "Failed to refresh image. Please try again."
          : "刷新图片失败，请重试。",
      );
      cocktailLogger.error("Error refreshing cocktail image", refreshError);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [
    recommendation,
    recommendationMeta,
    language,
    persistImageData,
    setIsImageLoading,
    updateRecommendationImage,
  ]);

  const resetResult = useCallback(async () => {
    try {
      await removeStorageKeysAsync([
        STORAGE_KEYS.RECOMMENDATION,
        STORAGE_KEYS.RECOMMENDATION_META,
        STORAGE_KEYS.SESSION_ID,
        STORAGE_KEYS.REQUEST,
        STORAGE_KEYS.IMAGE_DATA,
      ]);
      await reloadData();
      setError(null);
      setImageError(null);
      setProgressPercentage(0);
      setVolatileImageData(null);
      imagePersistenceRef.current = { signature: "", timestamp: 0 };
    } catch {
      cocktailLogger.error("Failed to reset result data");
      setError(t("error.resetData"));
    }
  }, [reloadData, t]);

  const contextValue = useMemo(
    () => ({
      recommendation,
      recommendationMeta,
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
      recommendationMeta,
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

export const useCocktailResult = () => {
  const context = useContext(CocktailResultContext);
  if (!context) {
    throw new Error(
      "useCocktailResult must be used within a CocktailResultProvider",
    );
  }
  return context;
};
