"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import LiquidMixingAnimation from "./LiquidMixingAnimation"

interface SmartLoadingSystemProps {
  isShowing: boolean
  onComplete?: () => void
  message?: string
  type?: 'cocktail-mixing' | 'recommendation' | 'image-generation' | 'api-call' | 'navigation'
  actualProgress?: number // 真实进度值 0-100
  estimatedDuration?: number // 预估完成时间（毫秒）
}

interface LoadingConfig {
  variant: 'cocktail' | 'martini' | 'wine' | 'shot'
  message: string
  glassStyle: string
  ambientColor: string
  duration: number
}

export default function SmartLoadingSystem({ 
  isShowing, 
  onComplete,
  message,
  type = 'cocktail-mixing',
  actualProgress = 0,
  estimatedDuration = 3000
}: SmartLoadingSystemProps) {
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [loadingConfig, setLoadingConfig] = useState<LoadingConfig>()

  // 根据加载类型选择最合适的动画配置
  useEffect(() => {
    const configs: Record<string, LoadingConfig> = {
      'cocktail-mixing': {
        variant: 'cocktail',
        message: message || "正在为您调制专属鸡尾酒...",
        glassStyle: 'elegant',
        ambientColor: 'amber-pink',
        duration: 3500
      },
      'recommendation': {
        variant: 'martini',
        message: message || "正在分析您的口味偏好...",
        glassStyle: 'sophisticated',
        ambientColor: 'blue-purple',
        duration: 2800
      },
      'image-generation': {
        variant: 'wine',
        message: message || "正在生成精美图片...",
        glassStyle: 'artistic',
        ambientColor: 'rose-gold',
        duration: 4000
      },
      'api-call': {
        variant: 'shot',
        message: message || "正在连接服务器...",
        glassStyle: 'minimal',
        ambientColor: 'cool-blue',
        duration: 1500
      },
      'navigation': {
        variant: 'cocktail',
        message: message || "正在切换页面...",
        glassStyle: 'smooth',
        ambientColor: 'warm-amber',
        duration: 800
      }
    }

    setLoadingConfig(configs[type] || configs['cocktail-mixing'])
  }, [type, message])

  // 智能进度模拟 - 结合真实进度和预估时间
  useEffect(() => {
    if (!isShowing || !loadingConfig) return

    let startTime = Date.now()
    let animationFrame: number

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const estimatedProgress = Math.min((elapsed / estimatedDuration) * 100, 95)
      
      // 混合真实进度和预估进度，给用户更好的感知
      const combinedProgress = actualProgress > 0 
        ? Math.max(actualProgress, estimatedProgress * 0.7) 
        : estimatedProgress

      // 添加轻微的波动使进度看起来更自然
      const naturalProgress = combinedProgress + Math.sin(elapsed * 0.01) * 2

      setSimulatedProgress(Math.min(naturalProgress, 100))

      if (combinedProgress < 100) {
        animationFrame = requestAnimationFrame(updateProgress)
      } else {
        // 进度达到100%后短暂延迟，让动画完整播放
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
    }

    animationFrame = requestAnimationFrame(updateProgress)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isShowing, actualProgress, estimatedDuration, onComplete, loadingConfig])

  if (!loadingConfig) return null

  return (
    <LiquidMixingAnimation
      isShowing={isShowing}
      onComplete={onComplete}
      message={loadingConfig.message}
      progress={simulatedProgress}
      variant={loadingConfig.variant}
    />
  )
}

// 便捷的Hook用于不同场景
export function useSmartLoading() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const startLoading = (type?: SmartLoadingSystemProps['type']) => {
    setIsLoading(true)
    setProgress(0)
  }

  const updateProgress = (newProgress: number) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100))
  }

  const completeLoading = () => {
    setProgress(100)
    setTimeout(() => {
      setIsLoading(false)
      setProgress(0)
    }, 500)
  }

  return {
    isLoading,
    progress,
    startLoading,
    updateProgress,
    completeLoading,
    LoadingComponent: (props: Omit<SmartLoadingSystemProps, 'isShowing' | 'actualProgress'>) => (
      <SmartLoadingSystem
        {...props}
        isShowing={isLoading}
        actualProgress={progress}
      />
    )
  }
}