"use client"

import { motion } from "framer-motion"

interface QuickLoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'amber' | 'pink' | 'blue' | 'gradient'
  speed?: 'slow' | 'normal' | 'fast'
  className?: string
}

export default function QuickLoadingDots({
  size = 'md',
  color = 'gradient',
  speed = 'normal',
  className = ''
}: QuickLoadingDotsProps) {
  
  const sizeConfig = {
    sm: { dot: 'w-1.5 h-1.5', gap: 'space-x-1' },
    md: { dot: 'w-2 h-2', gap: 'space-x-1.5' },
    lg: { dot: 'w-3 h-3', gap: 'space-x-2' }
  }

  const colorConfig = {
    amber: 'bg-amber-500',
    pink: 'bg-pink-500',
    blue: 'bg-blue-500',
    gradient: 'bg-gradient-to-r from-amber-500 to-pink-500'
  }

  const speedConfig = {
    slow: { duration: 1.8, stagger: 0.3 },
    normal: { duration: 1.4, stagger: 0.2 },
    fast: { duration: 1.0, stagger: 0.15 }
  }

  const { dot, gap } = sizeConfig[size]
  const dotColor = colorConfig[color]
  const { duration, stagger } = speedConfig[speed]

  return (
    <div className={`flex items-center justify-center ${gap} ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dot} ${dotColor} rounded-full`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration,
            repeat: Number.POSITIVE_INFINITY,
            delay: index * stagger,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// 脉冲圆环加载器 - 适合按钮内使用
interface PulseRingLoaderProps {
  size?: number
  thickness?: number
  color?: string
  className?: string
}

export function PulseRingLoader({
  size = 20,
  thickness = 2,
  color = 'border-amber-500',
  className = ''
}: PulseRingLoaderProps) {
  return (
    <div className={`inline-block ${className}`}>
      <motion.div
        className={`rounded-full border-solid border-transparent border-t-current ${color}`}
        style={{
          width: size,
          height: size,
          borderWidth: thickness
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear"
        }}
      />
    </div>
  )
}

// 微妙的内联加载指示器
interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ 
  text = "加载中", 
  className = "" 
}: InlineLoadingProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <QuickLoadingDots size="sm" speed="fast" />
      <motion.span
        className="text-sm text-gray-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
      >
        {text}
      </motion.span>
    </div>
  )
}
