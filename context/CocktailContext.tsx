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
import { getCocktailImage } from "@/api/image";
import {
  requestCocktailRecommendation,
  AlcoholLevel,
  DifficultyLevel,
  AgentType,
  type Cocktail,
  type BartenderRequest,
} from "@/api/cocktail";
import {
  getFromStorage,
  saveToStorage,
  clearStorageWithPrefix,
} from "@/utils/localStorage";
import { generateCocktailImage, generateImagePrompt } from "@/api/image";

// 存储键常量
const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
  RECOMMENDATION: "moodshaker-recommendation",
  SESSION_ID: "moodshaker-session-id",
  REQUEST: "moodshaker-request",
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
  // 状态
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userFeedback, setUserFeedback] = useState<string>("");
  const [baseSpirits, setBaseSpirits] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Cocktail | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [imageVersion, setImageVersion] = useState<number>(Date.now());

  // 初始化会话ID
  useEffect(() => {
    if (!sessionId) {
      const savedSessionId = getFromStorage<string>(
        STORAGE_KEYS.SESSION_ID,
        "",
      );
      if (savedSessionId) {
        setSessionId(savedSessionId);
      } else {
        const newSessionId = `session-${Math.random().toString(36).substring(2, 15)}`;
        setSessionId(newSessionId);
        saveToStorage(STORAGE_KEYS.SESSION_ID, newSessionId);
      }
    }
  }, [sessionId]);

  // 计算进度百分比
  const progressPercentage = useMemo(() => {
    const totalQuestions = 4; // 问题总数
    const answeredCount = Object.keys(answers).length;
    return (answeredCount / totalQuestions) * 100;
  }, [answers]);

  // 检查问题是否已回答
  const isQuestionAnswered = useCallback(
    (questionId: string): boolean => {
      return answers[questionId] !== undefined;
    },
    [answers],
  );

  // Add a function to refresh the image
  const refreshImage = useCallback(async (): Promise<string | null> => {
    if (!recommendation) return null;

    try {
      setIsImageLoading(true);
      console.log(
        "Refreshing image for:",
        recommendation.english_name || recommendation.name,
      );

      const imagePrompt = generateImagePrompt(recommendation);
      const imageUrl = await generateCocktailImage(imagePrompt, sessionId);

      if (imageUrl) {
        // Add timestamp to ensure it's fresh
        const timestampedUrl = imageUrl.includes("?")
          ? `${imageUrl}&_t=${Date.now()}`
          : `${imageUrl}?_t=${Date.now()}`;

        setImageData(timestampedUrl);
        setImageVersion(Date.now());

        console.log("DEBUG", "Generated fresh image", { sessionId });

        return timestampedUrl;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing image:", error);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [recommendation, sessionId]);

  // 加载保存的数据
  const loadSavedData = useCallback((): void => {
    try {
      const savedAnswers = getFromStorage<Record<string, string>>(
        STORAGE_KEYS.ANSWERS,
        {},
      );
      const savedFeedback = getFromStorage<string>(STORAGE_KEYS.FEEDBACK, "");
      const savedSpirits = getFromStorage<string[]>(
        STORAGE_KEYS.BASE_SPIRITS,
        [],
      );
      const savedRecommendation = getFromStorage<Cocktail | null>(
        STORAGE_KEYS.RECOMMENDATION,
        null,
      );
      const savedSessionId = getFromStorage<string>(
        STORAGE_KEYS.SESSION_ID,
        "",
      );

      setAnswers(savedAnswers);
      setUserFeedback(savedFeedback);
      setBaseSpirits(savedSpirits);
      setRecommendation(savedRecommendation);

      // Only update sessionId if it's not already set
      if (savedSessionId && !sessionId) {
        setSessionId(savedSessionId);
      }

      // Check for current image data
      if (savedSessionId) {
        const currentImage = getCocktailImage(savedSessionId);
        if (currentImage) {
          setImageData(currentImage);
          setImageVersion(Date.now());
        }
      }
    } catch (e) {
      console.error("Error loading saved data:", e);
      setError("加载保存的数据时出错");
    }
  }, [sessionId]); // Keep sessionId in the dependency array for this function

  // 保存答案
  const saveAnswer = useCallback(
    (questionId: string, optionId: string): void => {
      const newAnswers = { ...answers, [questionId]: optionId };
      setAnswers(newAnswers);
      saveToStorage(STORAGE_KEYS.ANSWERS, newAnswers);
    },
    [answers],
  );

  // 保存用户反馈
  const saveFeedback = useCallback((feedback: string): void => {
    setUserFeedback(feedback);
    saveToStorage(STORAGE_KEYS.FEEDBACK, feedback);
  }, []);

  // 保存基酒选择
  const saveBaseSpirits = useCallback((spirits: string[]): void => {
    setBaseSpirits(spirits);
    saveToStorage(STORAGE_KEYS.BASE_SPIRITS, spirits);
  }, []);

  // 切换基酒选择
  const toggleBaseSpirit = useCallback(
    (spiritId: string, allSpiritsOptions: SpiritOption[]): void => {
      let newSpirits = [...baseSpirits];

      if (spiritId === "all") {
        if (baseSpirits.includes("all")) {
          newSpirits = [];
        } else {
          newSpirits = allSpiritsOptions
            .filter((option) => option.id !== "all")
            .map((option) => option.id);
        }
      } else {
        if (baseSpirits.includes(spiritId)) {
          newSpirits = baseSpirits.filter(
            (id) => id !== spiritId && id !== "all",
          );
        } else {
          newSpirits = [...baseSpirits.filter((id) => id !== "all"), spiritId];

          // 检查是否选择了所有基酒
          const allOtherSpirits = allSpiritsOptions
            .filter((option) => option.id !== "all")
            .map((option) => option.id);

          if (allOtherSpirits.every((id) => newSpirits.includes(id))) {
            newSpirits.push("all");
          }
        }
      }

      saveBaseSpirits(newSpirits);
    },
    [baseSpirits, saveBaseSpirits],
  );

  // 创建请求对象
  const createRequestObject = useCallback((): BartenderRequest => {
    const alcoholLevel = (answers[2] as AlcoholLevel) || AlcoholLevel.MEDIUM;
    const difficultyLevel =
      (answers[3] as DifficultyLevel) || DifficultyLevel.MEDIUM;
    const filteredSpirits = baseSpirits.filter((spirit) => spirit !== "");

    return {
      message: userFeedback,
      alcohol_level: alcoholLevel,
      difficulty_level: difficultyLevel,
      base_spirits: filteredSpirits.length > 0 ? filteredSpirits : null,
      session_id: sessionId,
    };
  }, [answers, baseSpirits, sessionId, userFeedback]);

  // 提交请求获取推荐
  const submitRequest = async (): Promise<Cocktail> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create request object
      const request = createRequestObject();

      // Save request object
      saveToStorage(STORAGE_KEYS.REQUEST, request);

      // Determine which bartender type to use
      const bartenderType =
        answers[1] === "classic"
          ? AgentType.CLASSIC_BARTENDER
          : AgentType.CREATIVE_BARTENDER;

      console.log("Submitting request:", JSON.stringify(request, null, 2));
      console.log("Using bartender type:", bartenderType);

      // Send request to get cocktail recommendation
      const result = await requestCocktailRecommendation(
        request,
        bartenderType,
      );

      console.log("Received recommendation:", result);

      if (result) {
        // Save recommendation result
        setRecommendation(result);
        saveToStorage(STORAGE_KEYS.RECOMMENDATION, result);

        // Clear any previous image data
        if (typeof window !== "undefined" && window.__currentCocktailImage) {
          window.__currentCocktailImage = undefined;
        }

        // Generate image using the cocktail name
        try {
          setIsImageLoading(true);
          console.log(
            "Generating image for:",
            result.english_name || result.name,
          );
          const imagePrompt = generateImagePrompt(result);
          const imageUrl = await generateCocktailImage(imagePrompt, sessionId);

          if (imageUrl) {
            // Add timestamp to ensure it's fresh
            const timestampedUrl = imageUrl.includes("?")
              ? `${imageUrl}&_t=${Date.now()}`
              : `${imageUrl}?_t=${Date.now()}`;

            setImageData(timestampedUrl);
            setImageVersion(Date.now());

            console.log(
              "DEBUG",
              "Generated fresh image for new recommendation",
              {
                sessionId,
                cocktailName: result.name,
              },
            );
          }
        } catch (imageError) {
          console.error("Error generating image:", imageError);
          // Continue even if image generation fails
        } finally {
          setIsImageLoading(false);
        }
      }

      return result;
    } catch (e) {
      console.error("Error submitting request:", e);
      setError(
        `获取推荐时出错: ${e instanceof Error ? e.message : "未知错误"}`,
      );
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // 重置所有数据
  const resetAll = useCallback((): void => {
    setAnswers({});
    setUserFeedback("");
    setBaseSpirits([]);
    setRecommendation(null);
    setImageData(null);
    setError(null);
    setImageVersion(Date.now());

    // Generate new session ID
    const newSessionId = `session-${Math.random().toString(36).substring(2, 15)}`;
    setSessionId(newSessionId);
    saveToStorage(STORAGE_KEYS.SESSION_ID, newSessionId);

    // Clear current image data
    if (typeof window !== "undefined" && window.__currentCocktailImage) {
      window.__currentCocktailImage = undefined;
    }

    // Clear all localStorage items with the moodshaker prefix
    if (typeof window !== "undefined") {
      // Then clear all other moodshaker data
      clearStorageWithPrefix("moodshaker-");

      // Log the cleanup for debugging
      console.log("DEBUG", "Reset all data and cleared storage", {
        newSessionId,
      });
    }
  }, []);

  // Include setIsImageLoading and refreshImage in the contextValue
  const contextValue = useMemo(
    () => ({
      answers,
      userFeedback,
      baseSpirits,
      recommendation,
      imageData,
      isLoading,
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
    }),
    [
      answers,
      userFeedback,
      baseSpirits,
      recommendation,
      imageData,
      isLoading,
      isImageLoading,
      error,
      progressPercentage,
      loadSavedData,
      saveAnswer,
      saveFeedback,
      saveBaseSpirits,
      toggleBaseSpirit,
      isQuestionAnswered,
      resetAll,
      setIsImageLoading,
      refreshImage,
      imageVersion, // Include imageVersion in dependencies to ensure context updates when image refreshes
    ],
  );

  return (
    <CocktailContext.Provider value={contextValue}>
      {children}
    </CocktailContext.Provider>
  );
};

/**
 * 使用鸡尾酒上下文的Hook
 * @returns 鸡尾酒上下文
 */
export const useCocktail = (): CocktailContextType => {
  const context = useContext(CocktailContext);
  if (context === undefined) {
    throw new Error("useCocktail must be used within a CocktailProvider");
  }
  return context;
};
