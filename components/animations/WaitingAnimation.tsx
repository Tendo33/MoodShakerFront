"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface WaitingAnimationProps {
  isShowing?: boolean
  onComplete?: () => void
  message?: string
  progress?: number
  variant?: 'cocktail' | 'martini' | 'wine' | 'shot'
}

export default function WaitingAnimation({ 
  isShowing = true, 
  onComplete,
  message = "正在调制中",
  progress: externalProgress,
  variant = 'cocktail'
}: WaitingAnimationProps) {
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    // 这只是一个纯视觉动画，与实际加载进度无关
    let animationFrame: number
    const startTime = Date.now()
    const cycleDuration = 4000 // 每个周期4秒

    const updateAnimation = () => {
      const elapsed = (Date.now() - startTime) % cycleDuration
      const progress = (elapsed / cycleDuration) * 100
      setAnimationProgress(progress)
      
      animationFrame = requestAnimationFrame(updateAnimation)
    }

    animationFrame = requestAnimationFrame(updateAnimation)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  // 外部控制完成时机
  useEffect(() => {
    if (externalProgress && externalProgress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [externalProgress, onComplete])

  if (!isShowing) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full text-center space-y-20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative mx-auto w-40 h-40">
          <motion.div className="absolute inset-0 rounded-full border-2 border-slate-700/30" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent"
            style={{
              background: "conic-gradient(from 0deg, transparent, #FFB74D, #FF4081, #FF6B35, transparent)",
              borderRadius: "50%",
              mask: "radial-gradient(circle at center, transparent 68%, black 72%, black 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-400/25 to-pink-400/25 backdrop-blur-sm"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            🍸
          </motion.div>
        </div>

        <div className="space-y-12">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-4xl font-medium bg-gradient-to-r from-amber-300 via-orange-300 to-pink-300 bg-clip-text text-transparent tracking-wide">
              {message}
            </h2>
            <motion.p
              className="text-lg text-slate-300 font-light"
              animate={{
                opacity: [0.6, 1, 0.6],
                color: ["rgb(203 213 225)", "rgb(251 191 36)", "rgb(203 213 225)"],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              为您精心调配完美口感
            </motion.p>
          </motion.div>

          <div className="w-full h-2 rounded-full overflow-hidden relative bg-slate-700/50">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-full shadow-lg shadow-amber-400/20"
              style={{ width: `${animationProgress}%` }}
            ></motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
