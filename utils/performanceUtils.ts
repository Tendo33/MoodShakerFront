/**
 * 性能优化工具 - 专门解决渲染阻塞问题
 * 针对25秒加载时间的紧急优化
 */

import { useRef, useEffect, useCallback } from 'react';

/**
 * 分时渲染 - 避免大量组件同时渲染造成主线程阻塞
 * @param task 要执行的任务
 * @param timeSlice 时间片，默认5ms
 */
export const timeSliceTask = (task: () => void, timeSlice: number = 5): void => {
  const startTime = performance.now();
  
  function runTask() {
    const currentTime = performance.now();
    
    // 如果当前时间片还有剩余，继续执行
    if (currentTime - startTime < timeSlice) {
      task();
    } else {
      // 时间片用完，让出主线程
      setTimeout(() => {
        task();
      }, 0);
    }
  }
  
  runTask();
};

/**
 * 防止重复渲染的Hook
 * @param fn 要防重复执行的函数
 * @param deps 依赖数组
 * @param delay 防抖延迟
 */
export const useDebounceCallback = <T extends (...args: any[]) => void>(
  fn: T,
  deps: React.DependencyList,
  delay: number = 100
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    }) as T,
    [...deps, delay]
  );
};

/**
 * 延迟加载Hook - 分批加载组件避免阻塞
 * @param shouldLoad 是否应该加载
 * @param delay 延迟时间
 */
export const useDeferredLoading = (shouldLoad: boolean, delay: number = 100): boolean => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  useEffect(() => {
    if (shouldLoad && !isLoaded) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [shouldLoad, isLoaded, delay]);
  
  return isLoaded;
};

/**
 * 批量状态更新 - 避免频繁setState造成重渲染
 */
export class BatchStateUpdater<T> {
  private pendingUpdates: Array<(state: T) => T> = [];
  private timeoutId: NodeJS.Timeout | null = null;
  private setStateRef: React.MutableRefObject<React.Dispatch<React.SetStateAction<T>> | null>;
  
  constructor(setState: React.Dispatch<React.SetStateAction<T>>) {
    this.setStateRef = { current: setState };
  }
  
  update(updater: (state: T) => T): void {
    this.pendingUpdates.push(updater);
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.flush();
    }, 0);
  }
  
  private flush(): void {
    if (this.pendingUpdates.length > 0 && this.setStateRef.current) {
      this.setStateRef.current(prevState => {
        return this.pendingUpdates.reduce((state, updater) => updater(state), prevState);
      });
      this.pendingUpdates = [];
    }
  }
}

/**
 * 优先级调度 - 重要任务优先执行
 */
export const scheduleTask = (
  task: () => void,
  priority: 'immediate' | 'normal' | 'low' = 'normal'
): void => {
  switch (priority) {
    case 'immediate':
      task();
      break;
    case 'normal':
      if ('scheduler' in window && typeof (window as any).scheduler.postTask === 'function') {
        (window as any).scheduler.postTask(task);
      } else {
        setTimeout(task, 0);
      }
      break;
    case 'low':
      if ('requestIdleCallback' in window) {
        requestIdleCallback(task);
      } else {
        setTimeout(task, 100);
      }
      break;
  }
};

/**
 * 内存优化 - 清理不必要的引用
 */
export const useMemoryOptimization = (dependencies: any[]): void => {
  const prevDeps = useRef(dependencies);
  
  useEffect(() => {
    // 清理旧的引用
    prevDeps.current = dependencies;
    
    return () => {
      // 组件卸载时清理引用
      prevDeps.current = [];
    };
  }, dependencies);
};
