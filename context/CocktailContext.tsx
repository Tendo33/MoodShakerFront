"use client";

/**
 * Backward-compatible facade — merges Form + Result contexts into one hook
 * so that existing consumers (`useCocktail`, `useCocktailContext`) keep working
 * without changes.
 *
 * New code should prefer the more granular hooks:
 *   - `useCocktailForm()`   — form/questionnaire state only
 *   - `useCocktailResult()` — recommendation/image/API state only
 */

import type { ReactNode } from "react";
import {
  CocktailFormProvider,
  useCocktailForm,
} from "@/context/CocktailFormContext";
import {
  CocktailResultProvider,
  useCocktailResult,
} from "@/context/CocktailResultContext";
import { useCallback } from "react";

// ---------------------------------------------------------------------------
// Combined Provider (maintains the same nesting contract for layout.tsx)
// ---------------------------------------------------------------------------

interface CocktailProviderProps {
  children: ReactNode;
}

export const CocktailProvider = ({ children }: CocktailProviderProps) => {
  return (
    <CocktailFormProvider>
      <CocktailResultProvider>{children}</CocktailResultProvider>
    </CocktailFormProvider>
  );
};

// ---------------------------------------------------------------------------
// Combined Hook — merges both sub-contexts into a single flat object
// ---------------------------------------------------------------------------

function useCombinedCocktailContext() {
  const form = useCocktailForm();
  const result = useCocktailResult();

  // Combine resetForm + resetResult into a single resetAll for backward compat
  const resetAll = useCallback(async () => {
    await form.resetForm();
    await result.resetResult();
  }, [form, result]);

  // Merge loadSavedData from both contexts
  const loadSavedData = useCallback(() => {
    form.loadSavedData();
    result.loadSavedData();
  }, [form, result]);

  return {
    // Form state
    answers: form.answers,
    userFeedback: form.userFeedback,
    baseSpirits: form.baseSpirits,
    saveAnswer: form.saveAnswer,
    saveFeedback: form.saveFeedback,
    saveBaseSpirits: form.saveBaseSpirits,
    toggleBaseSpirit: form.toggleBaseSpirit,
    isQuestionAnswered: form.isQuestionAnswered,

    // Result state
    recommendation: result.recommendation,
    imageData: result.imageData,
    isLoading: result.isLoading,
    isImageLoading: result.isImageLoading,
    error: result.error,
    imageError: result.imageError,
    progressPercentage: result.progressPercentage,
    submitRequest: result.submitRequest,
    setIsImageLoading: result.setIsImageLoading,
    refreshImage: result.refreshImage,

    // Combined actions
    resetAll,
    loadSavedData,
  };
}

/**
 * @deprecated — prefer `useCocktailForm()` or `useCocktailResult()` for
 * fine-grained re-render control.
 */
export const useCocktailContext = () => {
  return useCombinedCocktailContext();
};

/**
 * @deprecated — prefer `useCocktailForm()` or `useCocktailResult()` for
 * fine-grained re-render control.
 */
export const useCocktail = () => {
  return useCombinedCocktailContext();
};
