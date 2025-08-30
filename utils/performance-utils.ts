// 性能优化工具函数
// {{CHENGQI:
// Action: [Added]; Timestamp: [2025-08-23 14:51:20]; Reason: 性能优化 - 提供性能优化工具函数; Principle_Applied: 性能优先原则;
// }}

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { appLogger } from "@/utils/logger";

// 防抖 Hook - 减少频繁触发
export const useDebounce = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  ) as T;
};



// 图片预加载 Hook
export const useImagePreload = (imageSources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
    };

    const preloadImages = async () => {
      try {
        const loaded = await Promise.allSettled(imageSources.map(preloadImage));

        const successful = loaded
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<string>).value);

        setLoadedImages(new Set(successful));
      } catch (error) {
        appLogger.warn("Image preload failed", error);
      }
    };

    if (imageSources.length > 0) {
      preloadImages();
    }
  }, [imageSources]);

  return loadedImages;
};

export const useVirtualization = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 1,
      items.length,
    );

    return {
      start,
      end,
      items: items.slice(start, end),
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return { visibleItems, handleScroll };
};

export const useIntersectionObserver = (
  threshold = 0.1,
  rootMargin = "100px",
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold, rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return [elementRef, isVisible] as const;
};

// 性能监控
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;

    if (renderTime > 16) {
      // 超过一帧时间 (16ms)
      appLogger.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  });
};


