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
  asyncStorage,
  clearStorageWithPrefixAsync,
} from "@/utils/asyncStorage";
import { useBatchAsyncState } from "@/hooks/useAsyncState";
import { cocktailLogger } from "@/utils/logger";
import { useLanguage } from "@/context/LanguageContext";

// Storage key constants
const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
};

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface CocktailFormContextType {
  answers: Record<string, string>;
  userFeedback: string;
  baseSpirits: string[];
  isDataLoading: boolean;
  loadSavedData: () => void;
  saveAnswer: (questionId: string, optionId: string) => Promise<void>;
  saveFeedback: (feedback: string) => Promise<void>;
  saveBaseSpirits: (spirits: string[]) => void;
  toggleBaseSpirit: (spiritId: string) => void;
  isQuestionAnswered: (questionId: string) => boolean;
  resetForm: () => Promise<void>;
}

const CocktailFormContext = createContext<CocktailFormContextType | undefined>(
  undefined,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CocktailFormProviderProps {
  children: ReactNode;
}

export const CocktailFormProvider = ({
  children,
}: CocktailFormProviderProps) => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

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

  // Derived values
  const answers = useMemo(
    () => savedData.answers ?? {},
    [savedData.answers],
  );
  const userFeedback = savedData.feedback || "";
  const baseSpirits = useMemo(
    () => savedData.baseSpirits ?? [],
    [savedData.baseSpirits],
  );

  // Log data-loading errors once
  useEffect(() => {
    const errorKeys = Object.keys(dataErrors);
    if (errorKeys.length > 0) {
      cocktailLogger.error("Form data loading error");
    }
  }, [dataErrors]);

  // ------ actions ------

  const loadSavedData = useCallback(() => {
    reloadData().catch(() => {
      cocktailLogger.error("Failed to reload form data");
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

  const isQuestionAnswered = useCallback(
    (questionId: string) => !!answers[questionId],
    [answers],
  );

  const resetForm = useCallback(async () => {
    try {
      await clearStorageWithPrefixAsync("moodshaker-");
      await reloadData();
      setError(null);
      cocktailLogger.debug("Form data reset successfully");
    } catch {
      cocktailLogger.error("Failed to reset form data");
      setError(t("error.resetData"));
    }
  }, [reloadData, t]);

  // ------ memo value ------

  const contextValue = useMemo(
    () => ({
      answers,
      userFeedback,
      baseSpirits,
      isDataLoading,
      loadSavedData,
      saveAnswer,
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCocktailForm = () => {
  const context = useContext(CocktailFormContext);
  if (!context) {
    throw new Error(
      "useCocktailForm must be used within a CocktailFormProvider",
    );
  }
  return context;
};
