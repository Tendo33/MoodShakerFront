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
  type AlcoholLevel,
  type DifficultyLevel,
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
import { generateSessionId } from "@/utils/generateId";

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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [userFeedback, setUserFeedback] = useState<string>("");
  const [baseSpirits, setBaseSpirits] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Cocktail | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => {
    // Use a stable initial session ID
    if (typeof window === "undefined") return "server-session";
    return getFromStorage(
      STORAGE_KEYS.SESSION_ID,
      generateSessionId(),
    );
  });
  const [imageVersion, setImageVersion] = useState<number>(() => {
    // Use a stable initial version
    if (typeof window === "undefined") return 0;
    return Date.now();
  });

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
        const newSessionId = generateSessionId();
        setSessionId(newSessionId);
        saveToStorage(STORAGE_KEYS.SESSION_ID, newSessionId);
      }
    }
  }, [sessionId]);

  // 计算进度百分比
  const progressPercentage = useMemo(() => {
    const totalQuestions = 3; // 问题总数
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

  // 保存答案
  const saveAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: optionId };
      saveToStorage(STORAGE_KEYS.ANSWERS, newAnswers);
      return newAnswers;
    });
  }, []);

  // 保存反馈
  const saveFeedback = useCallback((feedback: string) => {
    setUserFeedback(feedback);
    saveToStorage(STORAGE_KEYS.FEEDBACK, feedback);
  }, []);

  // 保存基酒选择
  const saveBaseSpirits = useCallback((spirits: string[]) => {
    setBaseSpirits(spirits);
    saveToStorage(STORAGE_KEYS.BASE_SPIRITS, spirits);
  }, []);

  // 切换基酒选择
  const toggleBaseSpirit = useCallback(
    (spiritId: string, allSpiritsOptions: SpiritOption[]) => {
      setBaseSpirits((prev) => {
        let newSpirits: string[];
        if (spiritId === "all") {
          // 如果选择"全部"，则选择所有基酒
          newSpirits = allSpiritsOptions
            .filter((spirit) => spirit.id !== "all")
            .map((spirit) => spirit.id);
        } else {
          // 如果已经选择了"全部"，则先移除"全部"
          if (prev.includes("all")) {
            newSpirits = prev.filter((id) => id !== "all");
          } else {
            newSpirits = [...prev];
          }

          // 切换当前基酒的选择状态
          if (newSpirits.includes(spiritId)) {
            newSpirits = newSpirits.filter((id) => id !== spiritId);
          } else {
            newSpirits.push(spiritId);
          }

          // 如果选择了所有基酒，则添加"全部"选项
          if (
            newSpirits.length ===
            allSpiritsOptions.filter((spirit) => spirit.id !== "all").length
          ) {
            newSpirits.push("all");
          }
        }

        saveToStorage(STORAGE_KEYS.BASE_SPIRITS, newSpirits);
        return newSpirits;
      });
    },
    [],
  );

  // 提交请求
  const submitRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current language
      const currentLanguage =
        localStorage.getItem("moodshaker-language") || "cn";

      // Build request
      const request: BartenderRequest = {
        message: userFeedback,
        alcohol_level: answers["2"] as AlcoholLevel,
        difficulty_level: answers["3"] as DifficultyLevel,
        base_spirits: baseSpirits.filter((id) => id !== "all"),
        session_id: sessionId,
      };

      // Save request to local storage
      saveToStorage(STORAGE_KEYS.REQUEST, request);

      // Choose bartender type based on user selection (question 1)
      let agentType: AgentType;
      if (answers["1"] === "classic") {
        agentType = AgentType.CLASSIC_BARTENDER;
      } else if (answers["1"] === "custom") {
        agentType = AgentType.CREATIVE_BARTENDER;
      } else {
        // fallback: default to classic bartender
        agentType = AgentType.CLASSIC_BARTENDER;
      }

      // Send request
      const cocktail = await requestCocktailRecommendation(request, agentType);

      // Save recommendation result
      setRecommendation(cocktail);
      saveToStorage(STORAGE_KEYS.RECOMMENDATION, cocktail);

      // Start image generation in the background
      setIsImageLoading(true);
      generateCocktailImageInBackground(cocktail);

      return cocktail;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [answers, baseSpirits, sessionId, userFeedback]);

  // Add a new function to generate the image in the background
  const generateCocktailImageInBackground = useCallback(
    async (cocktail: Cocktail) => {
      try {
        const imagePrompt = generateImagePrompt(cocktail);
        const image = await generateCocktailImage(imagePrompt, sessionId);
        setImageData(image);
        setImageVersion(Date.now());
        saveToStorage(STORAGE_KEYS.IMAGE_DATA, image);
      } catch (err) {
        console.error("Failed to generate cocktail image:", err);
        // Don't set error state here as it would disrupt the user experience
        // Just log the error and continue
      } finally {
        setIsImageLoading(false);
      }
    },
    [sessionId],
  );

  // 刷新图片
  const refreshImage = useCallback(async () => {
    if (!recommendation) return null;

    setIsImageLoading(true);
    try {
      // 获取当前语言
      const currentLanguage =
        localStorage.getItem("moodshaker-language") || "cn";

      // 生成新的图片提示
      const imagePrompt = generateImagePrompt(recommendation);
      const image = await generateCocktailImage(imagePrompt, sessionId);
      setImageData(image);
      setImageVersion(Date.now());
      return image;
    } catch (err) {
      console.error("Failed to refresh image:", err);
      return null;
    } finally {
      setIsImageLoading(false);
    }
  }, [recommendation, sessionId]);

  // 加载保存的数据
  const loadSavedData = useCallback(() => {
    const savedAnswers = getFromStorage<Record<string, string>>(
      STORAGE_KEYS.ANSWERS,
      {},
    );
    const savedFeedback = getFromStorage<string>(STORAGE_KEYS.FEEDBACK, "");
    const savedBaseSpirits = getFromStorage<string[]>(
      STORAGE_KEYS.BASE_SPIRITS,
      [],
    );
    const savedRecommendation = getFromStorage<Cocktail | null>(
      STORAGE_KEYS.RECOMMENDATION,
      null,
    );
    const savedImageData = getFromStorage<string | null>(
      STORAGE_KEYS.IMAGE_DATA,
      null,
    );

    setAnswers(savedAnswers);
    setUserFeedback(savedFeedback);
    setBaseSpirits(savedBaseSpirits);
    if (savedRecommendation) {
      setRecommendation(savedRecommendation);
    }
    if (savedImageData) {
      setImageData(savedImageData);
    }
  }, []);

  // 重置所有数据
  const resetAll = useCallback(() => {
    setAnswers({});
    setUserFeedback("");
    setBaseSpirits([]);
    setRecommendation(null);
    setImageData(null);
    setError(null);
    clearStorageWithPrefix("moodshaker-");
  }, []);

  const contextValue = {
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
  };

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
