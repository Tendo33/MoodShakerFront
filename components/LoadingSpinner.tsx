"use client";

import { motion } from "framer-motion"
import QuickLoadingDots, { PulseRingLoader, InlineLoading } from "./animations/QuickLoadingDots"

interface LoadingSpinnerProps {
  text?: string;
  colorClass?: string;
  variant?: 'classic' | 'modern' | 'dots' | 'ring' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({
  text,
  colorClass = "border-amber-500",
  variant = 'modern',
  size = 'md'
}: LoadingSpinnerProps) {
  
  const sizeConfig = {
    sm: { spinner: 'w-8 h-8', text: 'text-sm' },
    md: { spinner: 'w-12 h-12', text: 'text-lg' },
    lg: { spinner: 'w-16 h-16', text: 'text-xl' }
  }

  // 如果是内联模式，使用专门的内联组件
  if (variant === 'inline') {
    return <InlineLoading text={text} />
  }

  // 如果是点状加载器
  if (variant === 'dots') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <QuickLoadingDots size={size} />
        {text && (
          <motion.div 
            className={`${sizeConfig[size].text} text-gray-400`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {text}
          </motion.div>
        )}
      </div>
    );
  }

  // 如果是环形加载器
  if (variant === 'ring') {
    const ringSize = size === 'sm' ? 24 : size === 'md' ? 32 : 40
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <PulseRingLoader size={ringSize} color={colorClass} />
        {text && (
          <div className={`${sizeConfig[size].text} text-gray-400`}>
            {text}
          </div>
        )}
      </div>
    );
  }

  // 现代版本的旋转加载器
  if (variant === 'modern') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          {/* 背景环 */}
          <div className={`${sizeConfig[size].spinner} rounded-full border-4 border-gray-800`}></div>
          
          {/* 动态进度环 */}
          <motion.div
            className={`${sizeConfig[size].spinner} rounded-full absolute top-0 border-4 border-transparent ${colorClass} border-t-current`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear"
            }}
          />
          
          {/* 内部脉冲 */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-gradient-to-br from-amber-400 to-pink-400 rounded-full -translate-x-1/2 -translate-y-1/2"
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {text && (
          <motion.div 
            className={`${sizeConfig[size].text} text-gray-300 text-center tracking-wide`}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ 
              duration: 2.5, 
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut"
            }}
          >
            {text}
          </motion.div>
        )}
      </div>
    );
  }

  // 经典版本（向后兼容）
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className={`${sizeConfig[size].spinner} rounded-full absolute border-4 border-solid border-gray-200`}></div>
        <div
          className={`${sizeConfig[size].spinner} rounded-full animate-spin absolute border-4 border-solid border-transparent ${colorClass} border-t-current`}
        ></div>
      </div>
      {text && <div className={`ml-4 ${sizeConfig[size].text}`}>{text}</div>}
    </div>
  );
}
