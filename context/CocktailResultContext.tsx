"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
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

const COCKTAIL_REQUEST_TIMEOUT_MS = 90000;

/**
 * Attempts for connection failures only — the server never saw the request, so
 * nothing was spent upstream.
 *
 * A returned response is never retried, even a 5xx. The server budget is one
 * generation plus at most one repair; retrying a response here would multiply
 * that, which is how a single failed action used to cost four LLM calls at
 * `max_tokens: 5000`.
 */
const COCKTAIL_CONNECTION_ATTEMPTS = 2;

/** Marks a failure the server responded to, so it is not retried. */
class ResponseError extends Error {}

interface CocktailResultContextType {
  recommendation: Cocktail | null;
  recommendationMeta: RecommendationMeta | null;
  imageData: string | null;
  isLoading: boolean;
  isImageLoading: boolean;
  error: string | null;
  imageError: string | null;
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
  const [volatileImageData, setVolatileImageData] = useState<string | null>(
    null,
  );

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

  /**
   * Stores the image URL.
   *
   * Images now live in object storage, so this persists a short URL rather than
   * a multi-hundred-kilobyte data URL. The former size cap and write debounce
   * existed only to keep base64 payloads out of localStorage and are gone.
   */
  const persistImageUrl = useCallback(
    async (nextImageUrl: string | null) => {
      setVolatileImageData(nextImageUrl);
      await updateItem("imageData", nextImageUrl);
    },
    [updateItem],
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
          attempt <= COCKTAIL_CONNECTION_ATTEMPTS;
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
              let errorMessage =
                response.status === 503
                  ? t("error.serviceUnavailable")
                  : t("error.generationFailed");
              try {
                const errorData = await response.json();
                if (
                  response.status !== 503 &&
                  typeof errorData?.error?.message === "string"
                ) {
                  errorMessage = errorData.error.message;
                }
              } catch {
                // ignore invalid error payloads
              }

              // Not retried, including 5xx. The server already spends up to two
              // LLM calls per request (one generation plus one repair), so a
              // client-side retry on a returned response would double that to
              // four generations for a single user action.
              throw new ResponseError(errorMessage);
            }

            cocktailResponse = response;
            break;
          } catch (requestError) {
            // The server answered, so the LLM budget was already spent. Surface
            // it rather than paying for the same failure again.
            if (requestError instanceof ResponseError) {
              throw requestError;
            }

            const resolvedError =
              requestError instanceof Error
                ? requestError
                : new Error(t("error.generationFailed"));
            lastRequestError = resolvedError;

            if (attempt < COCKTAIL_CONNECTION_ATTEMPTS) {
              cocktailLogger.warn("Cocktail request failed to connect, retrying", {
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
        await persistImageUrl(nextRecommendation.image || null);

        setIsImageLoadingState(true);

        void (async () => {
          try {
            // The prompt is derived server-side from the stored cocktail
            // payload; sending one from here is rejected by the API.
            const imageResponse = await withTimeout(
              fetch("/api/image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  recommendationId: nextRecommendationMeta?.recommendationId,
                  editToken: nextRecommendationMeta?.editToken,
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
                t("share.error.generate"),
              );
              await persistImageUrl(null);
              return;
            }

            const imagePayload = await imageResponse.json();
            const nextImage = imagePayload?.data?.imageUrl || null;
            const nextThumbnail = imagePayload?.data?.thumbnailUrl || null;
            await persistImageUrl(nextImage);
            await updateRecommendationImage(
              nextRecommendation,
              nextImage,
              nextThumbnail,
            );
            setImageError(null);
          } catch (imageGenerationError) {
            setImageError(t("share.error.generate"));
            cocktailLogger.error(
              "Background image generation failed",
              imageGenerationError,
            );
            await persistImageUrl(null);
          } finally {
            setIsImageLoadingState(false);
          }
        })();

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
      persistImageUrl,
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

      // The prompt is derived server-side; a caller-supplied one is rejected.
      // Every call regenerates, so no forceRefresh flag is needed either.
      const imageResponse = await withTimeout(
        fetch("/api/image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recommendationId: recommendationMeta.recommendationId,
            editToken: recommendationMeta.editToken,
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
      const nextImage = payload?.data?.imageUrl || null;
      const nextThumbnail = payload?.data?.thumbnailUrl || null;
      await persistImageUrl(nextImage);
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
    persistImageUrl,
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
      setVolatileImageData(null);
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
