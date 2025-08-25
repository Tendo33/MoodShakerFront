"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useMemo } from "react"

interface SophisticatedTransitionProps {
  isShowing: boolean
  onComplete?: () => void
  message?: string
}

export default function SophisticatedTransition({ 
  isShowing, 
  onComplete,
  message = "正在为您调制专属鸡尾酒..."
}: SophisticatedTransitionProps) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([])
  const [isClient, setIsClient] = useState(false)

  // 预定义粒子位置，避免服务器端和客户端不匹配
  const predefinedParticles = useMemo(() => [
    { id: 0, x: 25, y: 20, delay: 0 },
    { id: 1, x: 75, y: 30, delay: 0.1 },
    { id: 2, x: 45, y: 60, delay: 0.2 },
    { id: 3, x: 85, y: 70, delay: 0.3 },
    { id: 4, x: 15, y: 80, delay: 0.4 },
    { id: 5, x: 65, y: 15, delay: 0.5 },
    { id: 6, x: 35, y: 85, delay: 0.6 },
    { id: 7, x: 90, y: 45, delay: 0.7 },
    { id: 8, x: 10, y: 40, delay: 0.8 },
    { id: 9, x: 55, y: 25, delay: 0.9 },
    { id: 10, x: 80, y: 90, delay: 1.0 },
    { id: 11, x: 30, y: 55, delay: 1.1 }
  ], [])

  // 检测是否在客户端
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isShowing && isClient) {
      setParticles(predefinedParticles)

      const timer = setTimeout(() => {
        onComplete?.()
      }, 2800)
      
      return () => clearTimeout(timer)
    }
  }, [isShowing, onComplete, isClient, predefinedParticles])

  if (!isShowing) return null

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Sophisticated particle system */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 bg-gradient-to-br from-amber-400 to-pink-400 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                }}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0.5],
                  x: [0, (particle.id % 2 === 0 ? 1 : -1) * (50 + particle.id * 10)],
                  y: [0, (particle.id % 3 === 0 ? 1 : -1) * (30 + particle.id * 8)],
                }}
                transition={{
                  duration: 2.5,
                  delay: particle.delay,
                  ease: [0.23, 1, 0.32, 1]
                }}
              />
            ))}
          </div>

          {/* Elegant center animation */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.3,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* Minimal cocktail glass */}
            <motion.div
              className="relative mx-auto mb-8 w-12 h-16"
              animate={{
                rotateY: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            >
              {/* Glass */}
              <div className="absolute inset-x-1 top-1 bottom-4 border-x border-b border-white/30 rounded-b-full">
                {/* Liquid */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 rounded-b-full bg-gradient-to-t from-amber-500/60 to-pink-500/60"
                  animate={{
                    height: ["20%", "60%", "40%"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                />
              </div>
              {/* Stem */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-px h-3 bg-white/30" />
            </motion.div>

            {/* Typography */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.h2 
                className="text-xl font-light text-white tracking-wide"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {message}
              </motion.h2>

              {/* Minimal progress */}
              <motion.div className="w-32 h-px bg-white/20 mx-auto overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.8, delay: 0.5 }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}