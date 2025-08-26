/**
 * 轻量级状态管理Hook - 替代复杂Context
 * 使用useReducer和useMemo优化性能
 */

import { useReducer, useMemo, useCallback, useEffect } from 'react';
import { asyncStorage } from '@/utils/asyncStorage';
import { cocktailLogger } from '@/utils/logger';

// 状态类型
interface CocktailState {
  answers: Record<string, string>;
  userFeedback: string;
  baseSpirits: string[];
  recommendation: any;
  imageData: string | null;
  isLoading: boolean;
  isImageLoading: boolean;
  error: string | null;
  progressPercentage: number;
}

// Action类型
type CocktailAction = 
  | { type: 'SET_ANSWER'; payload: { questionId: string; optionId: string } }
  | { type: 'SET_FEEDBACK'; payload: string }
  | { type: 'SET_BASE_SPIRITS'; payload: string[] }
  | { type: 'TOGGLE_BASE_SPIRIT'; payload: { spiritId: string; allSpirits: any[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_IMAGE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_RECOMMENDATION'; payload: any }
  | { type: 'SET_IMAGE_DATA'; payload: string | null }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_SAVED_DATA'; payload: Partial<CocktailState> };

// 初始状态
const initialState: CocktailState = {
  answers: {},
  userFeedback: '',
  baseSpirits: [],
  recommendation: null,
  imageData: null,
  isLoading: false,
  isImageLoading: false,
  error: null,
  progressPercentage: 0,
};

// Reducer
function cocktailReducer(state: CocktailState, action: CocktailAction): CocktailState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.questionId]: action.payload.optionId }
      };
    case 'SET_FEEDBACK':
      return { ...state, userFeedback: action.payload };
    case 'SET_BASE_SPIRITS':
      return { ...state, baseSpirits: action.payload };
    case 'TOGGLE_BASE_SPIRIT':
      const updatedSpirits = state.baseSpirits.includes(action.payload.spiritId)
        ? state.baseSpirits.filter(id => id !== action.payload.spiritId)
        : [...state.baseSpirits, action.payload.spiritId];
      return { ...state, baseSpirits: updatedSpirits };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_IMAGE_LOADING':
      return { ...state, isImageLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROGRESS':
      return { ...state, progressPercentage: action.payload };
    case 'SET_RECOMMENDATION':
      return { ...state, recommendation: action.payload };
    case 'SET_IMAGE_DATA':
      return { ...state, imageData: action.payload };
    case 'RESET_ALL':
      return initialState;
    case 'LOAD_SAVED_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// 存储键
const STORAGE_KEYS = {
  ANSWERS: "moodshaker-answers",
  FEEDBACK: "moodshaker-feedback",
  BASE_SPIRITS: "moodshaker-base-spirits",
  RECOMMENDATION: "moodshaker-recommendation",
  IMAGE_DATA: "moodshaker-image-data",
};

/**
 * 优化的Cocktail状态管理Hook
 */
export function useOptimizedCocktailState() {
  const [state, dispatch] = useReducer(cocktailReducer, initialState);

  // 加载保存的数据
  const loadSavedData = useCallback(async () => {
    try {
      const [answers, feedback, baseSpirits, recommendation, imageData] = await Promise.all([
        asyncStorage.getItem(STORAGE_KEYS.ANSWERS, {}),
        asyncStorage.getItem(STORAGE_KEYS.FEEDBACK, ""),
        asyncStorage.getItem(STORAGE_KEYS.BASE_SPIRITS, []),
        asyncStorage.getItem(STORAGE_KEYS.RECOMMENDATION, null),
        asyncStorage.getItem(STORAGE_KEYS.IMAGE_DATA, null)
      ]);

      dispatch({
        type: 'LOAD_SAVED_DATA',
        payload: { answers, feedback, baseSpirits, recommendation, imageData }
      });

      cocktailLogger.debug('数据加载成功');
    } catch (error) {
      cocktailLogger.error('数据加载失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '数据加载失败' });
    }
  }, []);

  // 保存答案
  const saveAnswer = useCallback(async (questionId: string, optionId: string) => {
    try {
      dispatch({ type: 'SET_ANSWER', payload: { questionId, optionId } });
      await asyncStorage.setItem(STORAGE_KEYS.ANSWERS, state.answers);
      cocktailLogger.debug(`答案保存成功: ${questionId} = ${optionId}`);
    } catch (error) {
      cocktailLogger.error('保存答案失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存答案失败' });
    }
  }, [state.answers]);

  // 保存反馈
  const saveFeedback = useCallback(async (feedback: string) => {
    try {
      dispatch({ type: 'SET_FEEDBACK', payload: feedback });
      await asyncStorage.setItem(STORAGE_KEYS.FEEDBACK, feedback);
      cocktailLogger.debug('反馈保存成功');
    } catch (error) {
      cocktailLogger.error('保存反馈失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存反馈失败' });
    }
  }, []);

  // 保存基酒选择
  const saveBaseSpirits = useCallback(async (spirits: string[]) => {
    try {
      dispatch({ type: 'SET_BASE_SPIRITS', payload: spirits });
      await asyncStorage.setItem(STORAGE_KEYS.BASE_SPIRITS, spirits);
      cocktailLogger.debug('基酒选择保存成功:', spirits);
    } catch (error) {
      cocktailLogger.error('保存基酒选择失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '保存基酒选择失败' });
    }
  }, []);

  // 切换基酒
  const toggleBaseSpirit = useCallback(async (spiritId: string, allSpirits: any[]) => {
    try {
      dispatch({ type: 'TOGGLE_BASE_SPIRIT', payload: { spiritId, allSpirits } });
      await asyncStorage.setItem(STORAGE_KEYS.BASE_SPIRITS, state.baseSpirits);
      cocktailLogger.debug('基酒切换成功', { spiritId, updatedSpirits: state.baseSpirits });
    } catch (error) {
      cocktailLogger.error('切换基酒失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '切换基酒失败' });
    }
  }, [state.baseSpirits]);

  // 检查问题是否已回答
  const isQuestionAnswered = useCallback((questionId: string) => {
    return !!state.answers[questionId];
  }, [state.answers]);

  // 重置所有数据
  const resetAll = useCallback(async () => {
    try {
      // 清除所有相关存储
      await Promise.all([
        asyncStorage.removeItem(STORAGE_KEYS.ANSWERS),
        asyncStorage.removeItem(STORAGE_KEYS.FEEDBACK),
        asyncStorage.removeItem(STORAGE_KEYS.BASE_SPIRITS),
        asyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATION),
        asyncStorage.removeItem(STORAGE_KEYS.IMAGE_DATA)
      ]);

      dispatch({ type: 'RESET_ALL' });
      cocktailLogger.debug('重置所有数据成功');
    } catch (error) {
      cocktailLogger.error('重置数据失败:', error);
      dispatch({ type: 'SET_ERROR', payload: '重置数据失败' });
    }
  }, []);

  // 设置图片加载状态
  const setIsImageLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_IMAGE_LOADING', payload: loading });
  }, []);

  // 使用useMemo优化返回值
  const contextValue = useMemo(() => ({
    // 状态
    answers: state.answers,
    userFeedback: state.userFeedback,
    baseSpirits: state.baseSpirits,
    recommendation: state.recommendation,
    imageData: state.imageData,
    isLoading: state.isLoading,
    isImageLoading: state.isImageLoading,
    error: state.error,
    progressPercentage: state.progressPercentage,
    
    // 方法
    loadSavedData,
    saveAnswer,
    saveFeedback,
    saveBaseSpirits,
    toggleBaseSpirit,
    isQuestionAnswered,
    resetAll,
    setIsImageLoading,
  }), [
    state.answers,
    state.userFeedback,
    state.baseSpirits,
    state.recommendation,
    state.imageData,
    state.isLoading,
    state.isImageLoading,
    state.error,
    state.progressPercentage,
    loadSavedData,
    saveAnswer,
    saveFeedback,
    saveBaseSpirits,
    toggleBaseSpirit,
    isQuestionAnswered,
    resetAll,
    setIsImageLoading
  ]);

  return contextValue;
}