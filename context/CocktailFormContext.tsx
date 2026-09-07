"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { removeStorageKeysAsync } from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";

const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
};

interface CocktailFormContextType {
  answers: Record<string, string>;
  userFeedback: string;
  baseSpirits: string[];
  isDataLoading: boolean;
  loadSavedData: () => void;
  saveAnswer: (questionId: string, optionId: string) => Promise<void>;
  removeAnswer: (questionId: string) => Promise<void>;
  saveFeedback: (feedback: string) => Promise<void>;
  saveBaseSpirits: (spirits: string[]) => Promise<void>;
  toggleBaseSpirit: (spiritId: string) => Promise<void>;
  isQuestionAnswered: (questionId: string) => boolean;
  resetForm: () => Promise<void>;
}

const CocktailFormContext = createContext<CocktailFormContextType | undefined>(
  undefined,
);

interface CocktailFormProviderProps {
  children: ReactNode;
}

export const CocktailFormProvider = ({
  children,
}: CocktailFormProviderProps) => {
  const { t } = useLanguage();

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
  }>([
    { key: "answers", storageKey: STORAGE_KEYS.ANSWERS, defaultValue: {} },
    { key: "feedback", storageKey: STORAGE_KEYS.FEEDBACK, defaultValue: "" },
    {
      key: "baseSpirits",
      storageKey: STORAGE_KEYS.BASE_SPIRITS,
      defaultValue: [],
    },
  ]);

  const answers = useMemo(() => savedData.answers ?? {}, [savedData.answers]);
  const userFeedback = savedData.feedback || "";
  const baseSpirits = useMemo(
    () => savedData.baseSpirits ?? [],
    [savedData.baseSpirits],
  );

  useEffect(() => {
    if (Object.keys(dataErrors).length > 0) {
      cocktailLogger.error("Form data loading error");
    }
  }, [dataErrors]);

  const loadSavedData = useCallback(() => {
    reloadData().catch(() => {
      cocktailLogger.error("Failed to reload form data");
    });
  }, [reloadData]);

  // 用更新函数而不是展开当前的 answers。
  //
  // 之前是 `updateItem("answers", { ...answers, [id]: value })`，answers 由闭包
  // 捕获，于是同一次渲染内的两次调用读到同一份快照，后一次覆盖前一次。实测并发
  // 保存两个答案只留下一个。
  //
  // 顺带把 answers 从依赖数组里去掉，回调本身也就稳定了。
  const saveAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      try {
        await updateItem("answers", (prev) => ({
          ...(prev ?? {}),
          [questionId]: optionId,
        }));
      } catch {
        cocktailLogger.error("Failed to save answer");
        throw new Error(t("error.saveAnswers"));
      }
    },
    [t, updateItem],
  );

  const removeAnswer = useCallback(
    async (questionId: string) => {
      try {
        await updateItem("answers", (prev) => {
          const nextAnswers = { ...(prev ?? {}) };
          delete nextAnswers[questionId];
          return nextAnswers;
        });
      } catch {
        cocktailLogger.error("Failed to remove answer");
        throw new Error(t("error.saveAnswers"));
      }
    },
    [t, updateItem],
  );

  const saveFeedback = useCallback(
    async (feedback: string) => {
      try {
        await updateItem("feedback", feedback);
      } catch {
        cocktailLogger.error("Failed to save feedback");
        throw new Error(t("error.saveFeedback"));
      }
    },
    [t, updateItem],
  );

  const saveBaseSpirits = useCallback(
    async (spirits: string[]) => {
      try {
        await updateItem("baseSpirits", spirits);
      } catch {
        cocktailLogger.error("Failed to save base spirits");
      }
    },
    [updateItem],
  );

  // 同样改成更新函数。这个比 saveAnswer 更容易被真实触发：基酒是多选标签，
  // 用户快速连点两个不同标签就会产生两次并发切换，闭包捕获的旧数组会让后一次
  // 覆盖前一次 —— 表现为点了两个只选上一个。
  const toggleBaseSpirit = useCallback(
    async (spiritId: string) => {
      try {
        await updateItem("baseSpirits", (prev) => {
          const current = prev ?? [];
          return current.includes(spiritId)
            ? current.filter((id) => id !== spiritId)
            : [...current, spiritId];
        });
      } catch {
        cocktailLogger.error("Failed to toggle base spirit");
      }
    },
    [updateItem],
  );

  const isQuestionAnswered = useCallback(
    (questionId: string) => Boolean(answers[questionId]),
    [answers],
  );

  const resetForm = useCallback(async () => {
    try {
      await removeStorageKeysAsync([
        STORAGE_KEYS.ANSWERS,
        STORAGE_KEYS.FEEDBACK,
        STORAGE_KEYS.BASE_SPIRITS,
      ]);
      await reloadData();
    } catch {
      cocktailLogger.error("Failed to reset form data");
    }
  }, [reloadData]);

  const contextValue = useMemo(
    () => ({
      answers,
      userFeedback,
      baseSpirits,
      isDataLoading,
      loadSavedData,
      saveAnswer,
      removeAnswer,
      saveFeedback,
      saveBaseSpirits,
      toggleBaseSpirit,
      isQuestionAnswered,
      resetForm,
    }),
    [
      answers,
      userFeedback,
      baseSpirits,
      isDataLoading,
      loadSavedData,
      saveAnswer,
      removeAnswer,
      saveFeedback,
      saveBaseSpirits,
      toggleBaseSpirit,
      isQuestionAnswered,
      resetForm,
    ],
  );

  return (
    <CocktailFormContext.Provider value={contextValue}>
      {children}
    </CocktailFormContext.Provider>
  );
};

export const useCocktailForm = () => {
  const context = useContext(CocktailFormContext);
  if (!context) {
    throw new Error(
      "useCocktailForm must be used within a CocktailFormProvider",
    );
  }
  return context;
};
