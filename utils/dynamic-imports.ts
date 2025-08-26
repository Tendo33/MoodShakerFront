/**
 * 动态导入工具 - 统一管理组件懒加载
 * 提供统一的加载状态和错误处理
 */

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// 加载状态组件
export const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div className="flex justify-center items-center min-h-[200px]">
    <div className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${
      size === 'small' ? 'h-6 w-6' : 
      size === 'large' ? 'h-16 w-16' : 
      'h-12 w-12'
    }`}></div>
  </div>
);

// 页面级加载组件
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// 创建动态导入的高阶函数
export function createDynamicImport<T extends Record<string, any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    loading?: ReactNode;
    ssr?: boolean;
    suspense?: boolean;
  } = {}
) {
  const { loading = <LoadingSpinner />, ssr = false, suspense = false } = options;
  
  return dynamic(importFn, {
    loading,
    ssr,
    suspense
  });
}

// 预定义的动态导入配置
export const dynamicConfigs = {
  // 页面组件 - 禁用SSR以提升首屏速度
  pages: {
    ssr: false,
    loading: <PageLoader />
  },
  // 大型组件 - 启用Suspense
  heavyComponents: {
    ssr: false,
    suspense: true,
    loading: <LoadingSpinner size="large" />
  },
  // 小型组件 - 启用SSR
  lightComponents: {
    ssr: true,
    loading: <LoadingSpinner size="small" />
  }
};

// 常用组件的动态导入
export const LazyComponents = {
  // 页面组件
  Home: createDynamicImport(() => import('@/components/pages/Home'), dynamicConfigs.pages),
  Questions: createDynamicImport(() => import('@/components/pages/Questions'), dynamicConfigs.pages),
  CocktailRecommendation: createDynamicImport(() => import('@/components/pages/CocktailRecommendation'), dynamicConfigs.pages),
  CocktailDetailPage: createDynamicImport(() => import('@/components/pages/CocktailDetailPage'), dynamicConfigs.pages),
  
  // 动画组件 - 较大，懒加载
  SmartLoadingSystem: createDynamicImport(() => import('@/components/animations/SmartLoadingSystem'), dynamicConfigs.heavyComponents),
  WaitingAnimation: createDynamicImport(() => import('@/components/animations/WaitingAnimation'), dynamicConfigs.heavyComponents),
  PageTransition: createDynamicImport(() => import('@/components/animations/PageTransition'), dynamicConfigs.heavyComponents),
  
  // 功能组件
  CocktailImage: createDynamicImport(() => import('@/components/CocktailImage'), dynamicConfigs.lightComponents),
  ErrorAlert: createDynamicImport(() => import('@/components/ErrorAlert'), dynamicConfigs.lightComponents),
  LanguageSelector: createDynamicImport(() => import('@/components/LanguageSelector'), dynamicConfigs.lightComponents),
  
  // 布局组件
  Header: createDynamicImport(() => import('@/components/layout/Header'), dynamicConfigs.lightComponents),
  Footer: createDynamicImport(() => import('@/components/layout/Footer'), dynamicConfigs.lightComponents)
};