/**
 * 性能监控组件 - 用于测试和展示优化效果
 * 在开发环境下显示性能指标，帮助验证优化成果
 */

"use client";

import { useEffect, useState, useRef } from 'react';
import { asyncStorage } from '@/utils/asyncStorage';
import { appLogger } from '@/utils/logger';

interface PerformanceMetrics {
  pageLoadTime: number;
  storageOperations: number;
  cacheHitRate: number;
  renderTime: number;
  memoryUsage?: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    storageOperations: 0,
    cacheHitRate: 0,
    renderTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const startTime = useRef(performance.now());

  useEffect(() => {
    // 只在开发环境显示
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const measurePerformance = () => {
      const endTime = performance.now();
      const pageLoadTime = endTime - startTime.current;
      
      // 获取存储统计
      const storageStats = asyncStorage.getStats();
      
      // 获取内存使用情况（如果支持）
      let memoryUsage;
      if ('memory' in performance) {
        const perfMemory = (performance as any).memory;
        memoryUsage = perfMemory.usedJSHeapSize / 1024 / 1024; // MB
      }

      setMetrics({
        pageLoadTime,
        storageOperations: storageStats.queueLength,
        cacheHitRate: storageStats.cacheHitRate * 100,
        renderTime: endTime - startTime.current,
        memoryUsage,
      });

      appLogger.debug('性能指标更新', {
        pageLoadTime: `${pageLoadTime.toFixed(2)}ms`,
        storageOperations: storageStats.queueLength,
        cacheHitRate: `${(storageStats.cacheHitRate * 100).toFixed(1)}%`,
        cacheSize: storageStats.cacheSize,
      });
    };

    // 延迟测量，确保页面完全加载
    const timer = setTimeout(measurePerformance, 1000);
    
    // 定期更新指标
    const interval = setInterval(measurePerformance, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
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
        <div className="absolute bottom-12 right-0 bg-black/90 text-white text-xs p-4 rounded-lg shadow-xl backdrop-blur-sm min-w-64">
          <h3 className="font-bold mb-3 text-yellow-400">🚀 性能指标</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>页面加载:</span>
              <span className={metrics.pageLoadTime < 1000 ? 'text-green-400' : 'text-red-400'}>
                {metrics.pageLoadTime.toFixed(0)}ms
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>存储队列:</span>
              <span className={metrics.storageOperations === 0 ? 'text-green-400' : 'text-yellow-400'}>
                {metrics.storageOperations}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>缓存命中率:</span>
              <span className={metrics.cacheHitRate > 80 ? 'text-green-400' : 'text-orange-400'}>
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>渲染时间:</span>
              <span className={metrics.renderTime < 100 ? 'text-green-400' : 'text-yellow-400'}>
                {metrics.renderTime.toFixed(0)}ms
              </span>
            </div>
            
            {metrics.memoryUsage && (
              <div className="flex justify-between">
                <span>内存使用:</span>
                <span className={metrics.memoryUsage < 50 ? 'text-green-400' : 'text-orange-400'}>
                  {metrics.memoryUsage.toFixed(1)}MB
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              💡 绿色=优秀, 黄色=良好, 红色=需优化
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 性能监控Hook - 用于其他组件中测量性能
 */
export function usePerformanceTimer(componentName: string) {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        appLogger.warn(`${componentName} 渲染时间过长: ${duration.toFixed(2)}ms`);
      }
    };
  });
  
  return {
    markTime: (label: string) => {
      const currentTime = performance.now();
      const elapsed = currentTime - startTime.current;
      appLogger.debug(`${componentName} - ${label}: ${elapsed.toFixed(2)}ms`);
    }
  };
}
