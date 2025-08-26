"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import {
  requestCocktailRecommendation,
  type Cocktail,
  type BartenderRequest,
} from "@/api/cocktail";
import {
  asyncStorage,
  saveToStorageAsync,
  clearStorageWithPrefixAsync,
} from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { generateCocktailImage, generateImagePrompt } from "@/api/image";
import { generateSessionId } from "@/utils/generateId";
import { cocktailLogger } from "@/utils/logger";

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
  progressPercentage: number;
  loadSavedData: () => void;
  saveAnswer: (questionId: string, optionId: string) => void;
  saveFeedback: (feedback: string) => void;
  saveBaseSpirits: (spirits: string[]) => void;
  toggleBaseSpirit: (
    spiritId: string,
    allSpiritsOptions: SpiritOption[],
  ) => void;
  submitRequest: () => Promise<Cocktail>;
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
  const [progressPercentage, setProgressPercentage] = useState(0);

  // 检查数据加载错误
  useEffect(() => {
    const errorKeys = Object.keys(dataErrors);
    if (errorKeys.length > 0) {
      const errorMessages = errorKeys.map(
        (key) => `${key}: ${dataErrors[key].message}`,
      );
      cocktailLogger.error("数据加载错误:", errorMessages);
    }
  }, [dataErrors]);

  // 兼容原有的 loadSavedData 方法
  const loadSavedData = useCallback(() => {
    reloadData().catch((error) => {
      cocktailLogger.error("重新加载数据失败:", error);
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
        cocktailLogger.debug(`答案保存成功: ${questionId} = ${optionId}`);
      } catch (error) {
        cocktailLogger.error("保存答案失败:", error);
        setError("保存答案失败，请重试");
      }
    },
    [answers, updateItem],
  );

  const saveFeedback = useCallback(
    async (feedback: string) => {
      try {
        await updateItem("feedback", feedback);
        cocktailLogger.debug("反馈保存成功:", feedback);
      } catch (error) {
        cocktailLogger.error("保存反馈失败:", error);
        setError("保存反馈失败，请重试");
      }
    },
    [updateItem],
  );

  const saveBaseSpirits = useCallback(
    async (spirits: string[]) => {
      try {
        await updateItem("baseSpirits", spirits);
        cocktailLogger.debug("基酒选择保存成功:", spirits);
      } catch (error) {
        cocktailLogger.error("保存基酒选择失败:", error);
        setError("保存基酒选择失败，请重试");
      }
    },
    [updateItem],
  );

  const toggleBaseSpirit = useCallback(
    async (spiritId: string, allSpiritsOptions: SpiritOption[]) => {
      const updatedSpirits = baseSpirits.includes(spiritId)
        ? baseSpirits.filter((id) => id !== spiritId)
        : [...baseSpirits, spiritId];

      try {
        await updateItem("baseSpirits", updatedSpirits);
        cocktailLogger.debug("基酒切换成功:", { spiritId, updatedSpirits });
      } catch (error) {
        cocktailLogger.error("切换基酒失败:", error);
        setError("切换基酒失败，请重试");
      }
    },
    [baseSpirits, updateItem],
  );

  const submitRequest = useCallback(async (): Promise<Cocktail> => {
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
      };

      await asyncStorage.setItem(STORAGE_KEYS.REQUEST, request);

      recommendation = await requestCocktailRecommendation(request);
      await updateItem("recommendation", recommendation);

      const prompt = generateImagePrompt(recommendation);
      const imageDataResult = await generateCocktailImage(prompt, sessionId);
      await updateItem("imageData", imageDataResult);

      setProgressPercentage(100);
      return recommendation;
    } catch (err) {
      setError("Failed to generate cocktail recommendation.");
      cocktailLogger.error("Error generating cocktail recommendation:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [answers, baseSpirits]);

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
      cocktailLogger.debug("重置所有数据成功");
    } catch (error) {
      cocktailLogger.error("重置数据失败:", error);
      setError("重置数据失败，请刷新页面重试");
    }
  }, [reloadData]);

  const setIsImageLoading = useCallback((loading: boolean) => {
    setIsImageLoadingState(loading);
  }, []);

  const refreshImage = useCallback(async (): Promise<string | null> => {
    setIsImageLoading(true);
    setError(null);

    try {
      if (!recommendation) {
        throw new Error("No cocktail recommendation available.");
      }

      const sessionId =
        (await asyncStorage.getItem(STORAGE_KEYS.SESSION_ID, "")) || "";
      const prompt = generateImagePrompt(recommendation);
      const imageDataResult = await generateCocktailImage(
        prompt,
        sessionId,
        true,
      ); // Force refresh
      await updateItem("imageData", imageDataResult);

      return imageDataResult;
    } catch (err) {
      setError("Failed to refresh cocktail image.");
      cocktailLogger.error("Error refreshing cocktail image:", err);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [recommendation]);

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
