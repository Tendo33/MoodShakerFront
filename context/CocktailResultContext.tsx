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

  /**
   * 标记「当前这一轮推荐」。每次提交或重置都递增。
   *
   * 图片生成是 fire-and-forget 的，最长 30 秒，期间闭包捕获了那一轮的
   * nextRecommendation。请求返回后它会无条件写回 state 和 localStorage，于是：
   * 用户在生成中点「重新开始」，重置当场看起来是成功的（state 和存储都空了），
   * 一两秒后旧推荐在界面和存储里双双复活。
   *
   * 实测确认过这条链路。后台任务写回前先核对代次，不是自己那一轮就丢弃结果。
   */
  const generationEpochRef = useRef(0);

  const scopedPersistedImageData =
    recommendation &&
    recommendationMeta &&
    String(recommendation.id || "") === recommendationMeta.recommendationId
      ? persistedImageData
      : null;

  const imageData =
    volatileImageData ||
    scopedPersistedImageData ||
    recommendation?.imageUrl ||
    null;

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
  /**
   * 两个写入函数都接受一个可选的 `stillCurrent` 守卫，在真正落盘的那一刻同步核对。
   *
   * 为什么不能只在调用前检查一次：检查和写入之间隔着 await，后台任务在这段时间里
   * 让出执行权，resetResult 的清除就在此期间跑完，写入随后落地 —— 典型的
   * check-then-act 竞态。实测的时序是 DEL、DEL、SET，SET 赢在最后。
   *
   * 守卫下移到每次 updateItem 的紧前面，中间不再有 await。
   */
  const persistImageUrl = useCallback(
    async (nextImageUrl: string | null, stillCurrent?: () => boolean) => {
      if (stillCurrent && !stillCurrent()) {
        return;
      }
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
      stillCurrent?: () => boolean,
    ) => {
      if (!baseRecommendation) {
        return;
      }
      if (stillCurrent && !stillCurrent()) {
        return;
      }

      await updateItem("recommendation", {
        ...baseRecommendation,
        imageUrl: image || null,
        thumbnailUrl: thumbnail || baseRecommendation.thumbnailUrl,
      });
    },
    [updateItem],
  );

  const submitRequest = useCallback(
    async (regenerate: boolean = false): Promise<Cocktail> => {
      // 开启新一轮：此前那一轮的后台图片任务从现在起不再有权写回。
      const epoch = ++generationEpochRef.current;
      const isCurrentEpoch = () => generationEpochRef.current === epoch;

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
        await persistImageUrl(nextRecommendation.imageUrl || null);

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
              if (!isCurrentEpoch()) {
                return;
              }
              setImageError(
                t("share.error.generate"),
              );
              await persistImageUrl(null, isCurrentEpoch);
              return;
            }

            const imagePayload = await imageResponse.json();
            const nextImage = imagePayload?.data?.imageUrl || null;
            const nextThumbnail = imagePayload?.data?.thumbnailUrl || null;

            // 写回前核对代次。用户在这张图生成期间重置或重新提交过，这一轮就
            // 已经作废；继续写下去会把作废的推荐重新写进 state 和 localStorage。
            //
            // 这里的提前返回只是快速路径。真正保证正确性的是传进去的
            // isCurrentEpoch —— 它在每次落盘的紧前面再核对一次，因为这两个 await
            // 之间还会让出执行权，重置可能正好在此期间跑完。
            if (!isCurrentEpoch()) {
              return;
            }

            await persistImageUrl(nextImage, isCurrentEpoch);
            await updateRecommendationImage(
              nextRecommendation,
              nextImage,
              nextThumbnail,
              isCurrentEpoch,
            );
            if (isCurrentEpoch()) {
              setImageError(null);
            }
          } catch (imageGenerationError) {
            // 同理：作废那一轮的失败不该覆盖当前这一轮的界面状态。
            if (!isCurrentEpoch()) {
              return;
            }

            setImageError(t("share.error.generate"));
            cocktailLogger.error(
              "Background image generation failed",
              imageGenerationError,
            );
            await persistImageUrl(null, isCurrentEpoch);
          } finally {
            // 加载指示器只归属当前这一轮：作废的任务把它关掉，会让正在进行的
            // 新一轮显示成已完成。
            if (isCurrentEpoch()) {
              setIsImageLoadingState(false);
            }
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
    // 先作废进行中的那一轮，再清数据。
    //
    // 少了这一步，重置本身是「成功」的 —— state 和 localStorage 当场都空了 ——
    // 但正在跑的图片任务一两秒后返回，会把刚被清掉的推荐重新写进两处。用户看到
    // 的是：点了「重新开始」，界面短暂空白，然后旧推荐自己回来了。
    generationEpochRef.current += 1;

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
      // 那一轮的 finally 已经因为代次不符而不会再关掉这个指示器，这里自己关。
      setIsImageLoadingState(false);
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
