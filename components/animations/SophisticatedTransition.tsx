"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

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
  const [stage, setStage] = useState<"entering" | "holding" | "exiting">("entering")

  useEffect(() => {
    if (isShowing) {
      setStage("entering")
      
      // Enter stage duration
      const enterTimer = setTimeout(() => {
        setStage("holding")
        
        // Hold stage duration
        const holdTimer = setTimeout(() => {
          setStage("exiting")
          
          // Exit stage duration
          const exitTimer = setTimeout(() => {
            onComplete?.()
          }, 800)
          
          return () => clearTimeout(exitTimer)
        }, 2000)
        
        return () => clearTimeout(holdTimer)
      }, 600)
      
      return () => clearTimeout(enterTimer)
    }
  }, [isShowing, onComplete])

  if (!isShowing) return null

  return (
    <AnimatePresence mode="wait">
      {isShowing && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Sophisticated background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Elegant geometric grid */}
            <div className="absolute inset-0 opacity-8">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: "80px 80px",
                }}
              />
            </div>

            {/* Subtle floating orbs */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`orb-${i}`}
                className="absolute rounded-full bg-gradient-to-br from-amber-500/10 to-pink-500/10 backdrop-blur-sm"
                style={{
                  width: `${60 + i * 20}px`,
                  height: `${60 + i * 20}px`,
                  left: `${10 + (i * 15) % 70}%`,
                  top: `${20 + (i * 12) % 60}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.sin(i) * 20, 0],
                  scale: [1, 1.1, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Refined light rays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`ray-${i}`}
                  className="absolute origin-center"
                  style={{
                    width: "300px",
                    height: "1px",
                    background: `linear-gradient(90deg, transparent, ${
                      i % 2 === 0 ? "rgba(245, 158, 11, 0.2)" : "rgba(236, 72, 153, 0.2)"
                    }, transparent)`,
                    transform: `rotate(${i * 45}deg)`,
                    filter: "blur(0.5px)",
                  }}
                  animate={{
                    opacity: [0.05, 0.4, 0.05],
                    scaleX: [0.3, 1.1, 0.3],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Central sophisticated animation */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Elegant cocktail glass silhouette */}
            <motion.div
              className="relative mx-auto mb-8 w-16 h-24"
              initial={{ rotateY: -25 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Glass body */}
              <motion.div
                className="absolute inset-x-2 top-2 bottom-8 rounded-b-full backdrop-blur-lg border border-white/20 shadow-xl overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {/* Subtle liquid gradient */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1/2 rounded-b-full overflow-hidden opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                    height: ["30%", "60%", "45%"],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              {/* Glass stem */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1 h-6 bg-white/20 rounded-full backdrop-blur-sm" />
              
              {/* Glass base */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full backdrop-blur-sm" />
            </motion.div>

            {/* Elegant message */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.p
                className="text-lg font-light text-gray-300 tracking-wide"
                animate={{
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {message}
              </motion.p>

              {/* Sophisticated progress indicator */}
              <motion.div
                className="w-48 h-0.5 bg-gray-700/50 rounded-full overflow-hidden mx-auto backdrop-blur-sm"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 2.5, 
                    ease: [0.23, 1, 0.32, 1],
                    delay: 0.5
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}