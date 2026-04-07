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

  const saveAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      try {
        await updateItem("answers", {
          ...answers,
          [questionId]: optionId,
        });
      } catch {
        cocktailLogger.error("Failed to save answer");
        throw new Error(t("error.saveAnswers"));
      }
    },
    [answers, t, updateItem],
  );

  const removeAnswer = useCallback(
    async (questionId: string) => {
      const nextAnswers = { ...answers };
      delete nextAnswers[questionId];

      try {
        await updateItem("answers", nextAnswers);
      } catch {
        cocktailLogger.error("Failed to remove answer");
        throw new Error(t("error.saveAnswers"));
      }
    },
    [answers, t, updateItem],
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

  const toggleBaseSpirit = useCallback(
    async (spiritId: string) => {
      const nextSpirits = baseSpirits.includes(spiritId)
        ? baseSpirits.filter((id) => id !== spiritId)
        : [...baseSpirits, spiritId];

      try {
        await updateItem("baseSpirits", nextSpirits);
      } catch {
        cocktailLogger.error("Failed to toggle base spirit");
      }
    },
    [baseSpirits, updateItem],
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
