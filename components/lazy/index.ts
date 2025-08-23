// 代码分割优化：延迟加载非关键组件
// {{CHENGQI:
// Action: [Added]; Timestamp: [2025-08-23 14:51:20]; Reason: 性能优化 - 代码分割减少初始加载; Principle_Applied: 按需加载原则;
// }}

import { lazy } from 'react';

// 延迟加载推荐页面组件 - 用户不会立即访问
export const CocktailRecommendationLazy = lazy(() => 
  import('../pages/CocktailRecommendation').then(module => ({
    default: module.default
  }))
);

// 延迟加载详情页面组件
export const CocktailDetailPageLazy = lazy(() => 
  import('../pages/CocktailDetailPage').then(module => ({
    default: module.default
  }))
);

// 延迟加载问卷页面组件
export const QuestionsLazy = lazy(() => 
  import('../pages/Questions').then(module => ({
    default: module.default
  }))
);

// 延迟加载图片组件 - 用于非关键图片
export const CocktailImageLazy = lazy(() => 
  import('../CocktailImage').then(module => ({
    default: module.default
  }))
);

// 加载状态组件
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
  </div>
);

// 错误边界组件
export const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void 
}) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
    <h2 className="text-xl font-bold text-red-500 mb-2">加载失败</h2>
    <p className="text-gray-400 mb-4">{error.message}</p>
    <button 
      onClick={resetErrorBoundary}
      className="bg-gradient-to-r from-amber-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
    >
      重试
    </button>
  </div>
);
