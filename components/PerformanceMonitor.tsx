/**
 * 增强的性能监控组件 - 实时监控和优化建议
 * 在开发环境下显示详细性能指标，帮助验证优化成果
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { asyncStorage } from "@/utils/asyncStorage";
import { appLogger, safeLogger } from "@/utils/logger";
import { cacheMetrics } from "@/utils/cache-utils";

interface PerformanceMetrics {
  pageLoadTime: number;
  storageOperations: number;
  cacheHitRate: number;
  renderTime: number;
  memoryUsage?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
  apiCallCount: number;
  averageApiTime: number;
  componentRenderCount: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    storageOperations: 0,
    cacheHitRate: 0,
    renderTime: 0,
    apiCallCount: 0,
    averageApiTime: 0,
    componentRenderCount: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<
    string[]
  >([]);
  const startTime = useRef(performance.now());

  // 将measurePerformance函数移到useCallback中，在组件顶层定义
  const measurePerformance = useCallback(() => {
    const endTime = performance.now();
    const pageLoadTime = endTime - startTime.current;

    // 获取存储统计
    const storageStats = asyncStorage.getStats();

    // 获取内存使用情况（如果支持）
    let memoryUsage;
    if ("memory" in performance) {
      const perfMemory = (performance as any).memory;
      memoryUsage = perfMemory.usedJSHeapSize / 1024 / 1024; // MB
    }

    // 获取Web Vitals指标
    const vitals = getWebVitals();

    // 获取API调用数据
    const apiData = performanceUtils.getApiCallData();

    const newMetrics = {
      pageLoadTime,
      storageOperations: storageStats.queueLength,
      cacheHitRate: cacheMetrics.getHitRate() * 100,
      renderTime: endTime - startTime.current,
      memoryUsage,
      firstContentfulPaint: vitals.fcp,
      largestContentfulPaint: vitals.lcp,
      cumulativeLayoutShift: vitals.cls,
      firstInputDelay: vitals.fid,
      apiCallCount: apiData.count,
      averageApiTime: apiData.average,
      componentRenderCount: performanceUtils.getRenderCount(),
    };

    setMetrics(newMetrics);
    setOptimizationSuggestions(generateOptimizationSuggestions(newMetrics));

    appLogger.debug("Performance metrics updated");
  }, []);

  useEffect(() => {
    // 只在开发环境显示
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // 延迟测量，确保页面完全加载
    const timer = setTimeout(measurePerformance, 1000);

    // 定期更新指标
    const interval = setInterval(measurePerformance, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [measurePerformance]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg transition-colors"
        title="性能监控"
      >
        📊 性能
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-black/90 text-white text-xs p-4 rounded-lg shadow-xl backdrop-blur-sm min-w-80 max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-3 text-yellow-400">🚀 性能指标</h3>

          <div className="space-y-2">
            {/* 核心指标 */}
            <div className="flex justify-between">
              <span>页面加载:</span>
              <span
                className={
                  metrics.pageLoadTime < 3000
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {metrics.pageLoadTime.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>渲染时间:</span>
              <span
                className={
                  metrics.renderTime < 100
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                {metrics.renderTime.toFixed(0)}ms
              </span>
            </div>

            {/* 缓存指标 */}
            <div className="flex justify-between">
              <span>缓存命中率:</span>
              <span
                className={
                  metrics.cacheHitRate > 80
                    ? "text-green-400"
                    : "text-orange-400"
                }
              >
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span>存储队列:</span>
              <span
                className={
                  metrics.storageOperations === 0
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                {metrics.storageOperations}
              </span>
            </div>

            {/* API指标 */}
            <div className="flex justify-between">
              <span>API调用次数:</span>
              <span
                className={
                  metrics.apiCallCount < 5
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                {metrics.apiCallCount}
              </span>
            </div>

            <div className="flex justify-between">
              <span>平均API时间:</span>
              <span
                className={
                  metrics.averageApiTime < 500
                    ? "text-green-400"
                    : "text-orange-400"
                }
              >
                {metrics.averageApiTime.toFixed(0)}ms
              </span>
            </div>

            {/* 内存指标 */}
            {metrics.memoryUsage && (
              <div className="flex justify-between">
                <span>内存使用:</span>
                <span
                  className={
                    metrics.memoryUsage < 50
                      ? "text-green-400"
                      : "text-orange-400"
                  }
                >
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
            )}

            {/* Web Vitals */}
            {metrics.firstContentfulPaint && (
              <div className="flex justify-between">
                <span>FCP:</span>
                <span
                  className={
                    metrics.firstContentfulPaint < 1800
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                >
                  {metrics.firstContentfulPaint.toFixed(0)}ms
                </span>
              </div>
            )}

            {metrics.largestContentfulPaint && (
              <div className="flex justify-between">
                <span>LCP:</span>
                <span
                  className={
                    metrics.largestContentfulPaint < 2500
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                >
                  {metrics.largestContentfulPaint.toFixed(0)}ms
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>组件渲染次数:</span>
              <span
                className={
                  metrics.componentRenderCount < 10
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                {metrics.componentRenderCount}
              </span>
            </div>
          </div>

          {/* 优化建议 */}
          {optimizationSuggestions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-600">
              <h4 className="font-semibold mb-2 text-orange-400">
                🔧 优化建议
              </h4>
              <div className="space-y-1">
                {optimizationSuggestions.map((suggestion, index) => (
                  <div key={index} className="text-xs text-orange-300">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              💡 绿色=优秀, 黄色=良好, 红色=需优化
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📊 FCP=First Contentful Paint, LCP=Largest Contentful Paint
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// 获取Web Vitals指标
function getWebVitals() {
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType("paint");

  const fcp = paint.find(
    (entry) => entry.name === "first-contentful-paint",
  )?.startTime;
  const lcp = paint.find(
    (entry) => entry.name === "largest-contentful-paint",
  )?.startTime;

  return {
    fcp,
    lcp,
    cls: 0, // 需要LayoutShift API
    fid: 0, // 需要EventTiming API
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
  };
}

// 生成优化建议
function generateOptimizationSuggestions(metrics: PerformanceMetrics) {
  const suggestions: string[] = [];

  // 页面加载时间
  if (metrics.pageLoadTime > 3000) {
    suggestions.push("⚠️ 页面加载时间过长，建议检查代码分割和懒加载");
  }

  // 内存使用
  if (metrics.memoryUsage && metrics.memoryUsage > 100) {
    suggestions.push("⚠️ 内存使用过高，建议检查内存泄漏");
  }

  // 缓存命中率
  if (metrics.cacheHitRate < 70) {
    suggestions.push("⚠️ 缓存命中率较低，建议优化缓存策略");
  }

  // API调用
  if (metrics.apiCallCount > 10) {
    suggestions.push("⚠️ API调用次数过多，建议实现请求去重");
  }

  if (metrics.averageApiTime > 1000) {
    suggestions.push("⚠️ API响应时间过长，建议优化API性能");
  }

  return suggestions;
}

// 创建全局状态来跟踪性能数据
let globalApiCallTimes: number[] = [];
let globalRenderCount = 0;

// 性能监控工具函数 (internal use only)
const performanceUtils = {
  // 记录API调用时间
  recordApiCall: (duration: number) => {
    globalApiCallTimes.push(duration);
  },

  // 记录组件渲染
  recordComponentRender: () => {
    globalRenderCount += 1;
  },

  // 获取当前API调用数据
  getApiCallData: () => ({
    times: [...globalApiCallTimes],
    count: globalApiCallTimes.length,
    average:
      globalApiCallTimes.length > 0
        ? globalApiCallTimes.reduce((a, b) => a + b, 0) /
          globalApiCallTimes.length
        : 0,
  }),

  // 获取渲染计数
  getRenderCount: () => globalRenderCount,

  // 重置计数器
  resetCounters: () => {
    globalApiCallTimes = [];
    globalRenderCount = 0;
  },
};
