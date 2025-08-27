/**
 * 异步状态管理Hook - 专为localStorage优化设计
 * 解决Context初始化竞争和状态同步问题
 *
 * 就像给状态管理装上"缓冲器"，让数据加载变得平稳不阻塞
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { asyncStorage } from "@/utils/asyncStorage";
import { appLogger } from "@/utils/logger";

// 状态加载阶段
export type LoadingPhase = "idle" | "loading" | "success" | "error";

// Hook返回值类型
interface AsyncStateResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  phase: LoadingPhase;
  reload: () => Promise<void>;
  updateData: (newData: T) => Promise<void>;
}

// Hook配置选项
interface AsyncStateOptions<T> {
  storageKey: string;
  defaultValue?: T;
  immediate?: boolean; // 是否立即加载
  cacheDuration?: number; // 缓存持续时间
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * 异步状态Hook - 核心性能优化
 * @param options 配置选项
 * @returns 状态管理对象
 */
export function useAsyncState<T>(
  options: AsyncStateOptions<T>,
): AsyncStateResult<T> {
  const {
    storageKey,
    defaultValue,
    immediate = true,
    cacheDuration = 5 * 60 * 1000, // 5分钟
    onSuccess,
    onError,
  } = options;

  // 状态定义
  const [data, setData] = useState<T | null>(defaultValue ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [phase, setPhase] = useState<LoadingPhase>("idle");

  // 防止重复加载
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // 清理函数
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * 加载数据的核心函数
   */
  const loadData = useCallback(async (): Promise<void> => {
    // 防止重复加载
    if (loadingRef.current || !mountedRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      setPhase("loading");

      // 异步获取数据
      const result = await asyncStorage.getItem<T>(storageKey, defaultValue);

      if (!mountedRef.current) return;

      setData(result);
      setPhase("success");

      // 成功回调
      if (result && onSuccess) {
        onSuccess(result);
      }

      appLogger.debug("Async state loaded successfully");
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error("Data loading failed");
      setError(error);
      setPhase("error");

      // 错误回调
      if (onError) {
        onError(error);
      }

      appLogger.error("Async state loading failed");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [storageKey]); // 移除defaultValue, onSuccess, onError避免循环依赖

  /**
   * 更新数据函数
   */
  const updateData = useCallback(
    async (newData: T): Promise<void> => {
      try {
        // 立即更新本地状态，提供即时反馈
        setData(newData);

        // 异步保存到存储
        await asyncStorage.setItem(storageKey, newData);

        appLogger.debug("Async state updated successfully");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Data save failed");
        setError(error);

        // 保存失败时回滚数据
        await loadData();

        appLogger.error("Async state update failed");
        throw error;
      }
    },
    [storageKey, loadData],
  );

  /**
   * 重新加载数据
   */
  const reload = useCallback(async (): Promise<void> => {
    loadingRef.current = false; // 重置加载标志
    await loadData();
  }, [loadData]);

  // 初始化加载
  useEffect(() => {
    if (immediate) {
      loadData();
    }
  }, [immediate, loadData]);

  return {
    data,
    isLoading,
    error,
    phase,
    reload,
    updateData,
  };
}

/**
 * 批量异步状态Hook - 优化多个存储项的加载
 * @param configs 配置数组
 * @returns 批量状态结果
 */
export function useBatchAsyncState<T extends Record<string, any>>(
  configs: Array<{
    key: keyof T;
    storageKey: string;
    defaultValue?: any;
  }>,
): {
  data: Partial<T>;
  isLoading: boolean;
  errors: Record<string, Error>;
  phase: LoadingPhase;
  reload: () => Promise<void>;
  updateItem: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [phase, setPhase] = useState<LoadingPhase>("idle");

  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const configsRef = useRef(configs);

  // 更新配置引用
  useEffect(() => {
    configsRef.current = configs;
  }, [configs]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * 批量加载数据
   */
  const loadBatchData = useCallback(async (): Promise<void> => {
    if (loadingRef.current || !mountedRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setErrors({});
      setPhase("loading");

      // 构建批量操作
      const currentConfigs = configsRef.current;
      const operations = currentConfigs.map((config) => ({
        type: "get" as const,
        key: config.storageKey,
        defaultValue: config.defaultValue,
      }));

      // 执行批量操作
      const results = await asyncStorage.batchOperations(operations);

      if (!mountedRef.current) return;

      // 构建结果对象
      const newData: Partial<T> = {};
      currentConfigs.forEach((config, index) => {
        newData[config.key] = results[index];
      });

      setData(newData);
      setPhase("success");

      appLogger.debug("Batch async state loaded successfully");
    } catch (err) {
      if (!mountedRef.current) return;

      const error = err instanceof Error ? err : new Error("Batch data loading failed");
      setErrors({ batch: error });
      setPhase("error");

      appLogger.error("Batch async state loading failed", error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, []); // 移除configs依赖，改为使用ref存储

  /**
   * 更新单个项目
   */
  const updateItem = useCallback(
    async <K extends keyof T>(key: K, value: T[K]): Promise<void> => {
      const config = configsRef.current.find((c) => c.key === key);
      if (!config) {
        throw new Error(`未找到配置项: ${String(key)}`);
      }

      try {
        // 立即更新本地状态
        setData((prev) => ({ ...prev, [key]: value }));

        // 异步保存
        await asyncStorage.setItem(config.storageKey, value);

        appLogger.debug("Batch state item updated successfully");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Data save failed");
        setErrors((prev) => ({ ...prev, [String(key)]: error }));

        // 回滚数据
        await loadBatchData();

        appLogger.error("Batch state item update failed");
        throw error;
      }
    },
    [loadBatchData],
  );

  /**
   * 重新加载
   */
  const reload = useCallback(async (): Promise<void> => {
    loadingRef.current = false;
    await loadBatchData();
  }, [loadBatchData]);

  // 初始化加载
  useEffect(() => {
    loadBatchData();
  }, [loadBatchData]);

  return {
    data,
    isLoading,
    errors,
    phase,
    reload,
    updateItem,
  };
}

/**
 * 预加载Hook - 提前加载可能需要的数据
 * @param keys 要预加载的存储键列表
 */
export function usePreloadStorage(keys: string[]): void {
  useEffect(() => {
    const preload = async () => {
      try {
        const operations = keys.map((key) => ({
          type: "get" as const,
          key,
        }));

        await asyncStorage.batchOperations(operations);
        appLogger.debug("Storage preloading completed");
      } catch (error) {
        appLogger.warn("Storage preloading failed", error);
      }
    };

    if (keys.length > 0) {
      // 延迟预加载，避免阻塞初始渲染
      const timer = setTimeout(preload, 100);
      return () => clearTimeout(timer);
    }
  }, [keys]);
}
