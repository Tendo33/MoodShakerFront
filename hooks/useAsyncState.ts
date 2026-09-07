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

  // defaultValue / onSuccess / onError 存进 ref，不进 loadData 的依赖数组。
  //
  // 这三个参数在调用处几乎都是内联字面量或内联箭头函数，每次渲染都是新引用。
  // 之前 loadData 依赖它们，于是每渲染一次 loadData 就重建一次，依赖 loadData
  // 的初始化 effect 跟着重跑，setState 再触发渲染 —— 闭环。
  //
  // 实测 Home.tsx 的调用形态（内联 defaultValue: {}）：1.5 秒内渲染 475 次，
  // 换成稳定引用只有 3 次。首页一直在无界重渲染循环里，只是被存储层的批处理
  // 延迟限了速，所以没表现成页面卡死。
  // 写入放在 effect 里，不在渲染期间：并发渲染下渲染可能被丢弃或重放，渲染期间
  // 改 ref 的时机没有保证。useRef 的初值就是首次渲染的这三个值，所以挂载时
  // loadData 读到的已经是对的；之后由这个 effect 保持同步。
  const optionsRef = useRef({ defaultValue, onSuccess, onError });
  useEffect(() => {
    optionsRef.current = { defaultValue, onSuccess, onError };
  }, [defaultValue, onSuccess, onError]);

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
      const result = await asyncStorage.getItem<T>(
        storageKey,
        optionsRef.current.defaultValue,
      );

      if (!mountedRef.current) return;

      setData(result);
      setPhase("success");

      // 成功回调。
      //
      // 判 null 而不是判真值：之前写的是 `if (result && onSuccess)`，于是存储的
      // false、0、"" 都不会触发回调 —— 一个存着 false 的开关状态，恢复时看起来
      // 和"没有存过"完全一样。
      if (result !== null && optionsRef.current.onSuccess) {
        optionsRef.current.onSuccess(result);
      }

      appLogger.debug("Async state loaded successfully");
    } catch (err) {
      if (!mountedRef.current) return;

      const error =
        err instanceof Error ? err : new Error("Data loading failed");
      setError(error);
      setPhase("error");

      // 错误回调
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error);
      }

      appLogger.error("Async state loading failed");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
    // 只依赖 storageKey。其余三个参数经 optionsRef 读取，因此换了 key 才需要重建
    // 这个回调，而不是每次渲染都重建。
  }, [storageKey]);

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
        const error =
          err instanceof Error ? err : new Error("Data save failed");
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
export function useBatchAsyncState<T extends Record<string, unknown>>(
  configs: Array<{
    key: keyof T;
    storageKey: string;
    defaultValue?: unknown;
  }>,
): {
  data: Partial<T>;
  isLoading: boolean;
  errors: Record<string, Error>;
  phase: LoadingPhase;
  reload: () => Promise<void>;
  updateItem: <K extends keyof T>(
    key: K,
    valueOrUpdater: T[K] | ((prev: T[K] | undefined) => T[K]),
  ) => Promise<void>;
} {
  const [data, setData] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [phase, setPhase] = useState<LoadingPhase>("idle");

  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const configsRef = useRef(configs);

  // 与 data 同步的镜像，供 updateItem 的函数式更新读取最新值。
  //
  // state 本身不能用：同一次渲染内的两次 updateItem 拿到的是同一份 data 快照，
  // 后一次会覆盖前一次。ref 是同步更新的，所以第二次能看到第一次的结果。
  const dataRef = useRef<Partial<T>>({});

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
        const value = results[index] as T[typeof config.key] | undefined;
        newData[config.key] = value;
      });

      dataRef.current = newData;
      setData(newData);
      setPhase("success");

      appLogger.debug("Batch async state loaded successfully");
    } catch (err) {
      if (!mountedRef.current) return;

      const error =
        err instanceof Error ? err : new Error("Batch data loading failed");
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
    async <K extends keyof T>(
      key: K,
      // 也接受更新函数。只能传具体值时，调用方必须先从 state 里读旧值再合并，
      // 而同一次渲染内的两次调用读到的是同一份快照 —— 后一次覆盖前一次。
      //
      // 实测：并发保存两个不同问题的答案，只有后一个留下。目前问卷 UI 有
      // selectedOption 守卫把调用串行化了，所以这条路径暂时走不到，但这是
      // context API 的性质，不该依赖调用方恰好串行。
      valueOrUpdater: T[K] | ((prev: T[K] | undefined) => T[K]),
    ): Promise<void> => {
      const config = configsRef.current.find((c) => c.key === key);
      if (!config) {
        throw new Error(`未找到配置项: ${String(key)}`);
      }

      // 从 ref 读旧值，不从 state 读：ref 是同步更新的，所以同一次渲染内的
      // 第二次调用能看到第一次的结果。
      const value =
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (prev: T[K] | undefined) => T[K])(
              dataRef.current[key],
            )
          : valueOrUpdater;

      try {
        // 立即更新本地状态
        dataRef.current = { ...dataRef.current, [key]: value };
        setData((prev) => ({ ...prev, [key]: value }));

        // 异步保存
        await asyncStorage.setItem(config.storageKey, value);

        appLogger.debug("Batch state item updated successfully");
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Data save failed");
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
