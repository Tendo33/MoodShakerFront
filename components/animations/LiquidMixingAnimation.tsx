"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useMemo } from "react"

interface LiquidMixingAnimationProps {
  isShowing: boolean
  onComplete?: () => void
  message?: string
  progress?: number
  variant?: 'cocktail' | 'martini' | 'wine' | 'shot'
}

interface LiquidParticle {
  id: number
  x: number
  y: number
  size: number
  color: string
  velocity: { x: number; y: number }
  opacity: number
}

export default function LiquidMixingAnimation({ 
  isShowing, 
  onComplete,
  message = "正在为您调制专属鸡尾酒...",
  progress = 0,
  variant = 'cocktail'
}: LiquidMixingAnimationProps) {
  const [particles, setParticles] = useState<LiquidParticle[]>([])
  const [isClient, setIsClient] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'mixing' | 'settling' | 'complete'>('initial')


  const glassConfig = useMemo(() => {
    switch (variant) {
      case 'martini':
        return {
          width: 80,
          height: 100,
          shape: 'triangle',
          stemHeight: 40,
          liquidStart: 85
        }
      case 'wine':
        return {
          width: 70,
          height: 120,
          shape: 'ellipse',
          stemHeight: 35,
          liquidStart: 90
        }
      case 'shot':
        return {
          width: 50,
          height: 60,
          shape: 'rectangle',
          stemHeight: 0,
          liquidStart: 55
        }
      default: // cocktail
        return {
          width: 75,
          height: 110,
          shape: 'cocktail',
          stemHeight: 45,
          liquidStart: 80
        }
    }
  }, [variant])


  const generateLiquidParticles = useMemo(() => {
    const particleCount = 24
    const baseParticles: LiquidParticle[] = []
    
    for (let i = 0; i < particleCount; i++) {

      const isAmber = i < particleCount / 2
      baseParticles.push({
        id: i,
        x: 20 + Math.random() * 60,
        y: isAmber ? 60 + Math.random() * 20 : 40 + Math.random() * 20,
        size: 2 + Math.random() * 4,
        color: isAmber ? 'from-amber-400 to-amber-600' : 'from-pink-400 to-pink-600',
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: Math.random() * 0.3
        },
        opacity: 0.7 + Math.random() * 0.3
      })
    }
    
    return baseParticles
  }, [])


  const liquidMixingKeyframes = useMemo(() => {
    const actualProgress = Math.min(progress / 100, 1)
    const mixingIntensity = Math.sin(Date.now() * 0.003) * 0.3 + 0.7
    
    return {

      amberLiquid: {
        height: `${20 + actualProgress * 35}%`,
        background: `linear-gradient(180deg, 
          rgba(245, 158, 11, ${0.8 + actualProgress * 0.2}) 0%, 
          rgba(217, 119, 6, ${0.9 + actualProgress * 0.1}) 100%)`,
        borderRadius: actualProgress > 0.7 ? '0 0 50% 50%' : '0 0 20% 20%'
      },
      // 顶层液体 (pink) - 较轻，在顶部
      pinkLiquid: {
        height: `${15 + actualProgress * 30}%`,
        background: `linear-gradient(180deg, 
          rgba(236, 72, 153, ${0.7 + actualProgress * 0.3}) 0%, 
          rgba(190, 24, 93, ${0.8 + actualProgress * 0.2}) 100%)`,
        transform: `translateY(-${actualProgress * 20}px) scale(${0.9 + actualProgress * 0.1})`
      },
      // 混合区域的过渡效果
      mixingZone: {
        background: `linear-gradient(45deg, 
          rgba(245, 158, 11, ${mixingIntensity * 0.4}) 0%, 
          rgba(236, 72, 153, ${mixingIntensity * 0.4}) 50%,
          rgba(217, 119, 6, ${mixingIntensity * 0.3}) 100%)`,
        height: `${5 + actualProgress * 15}%`,
        opacity: mixingIntensity
      }
    }
  }, [progress])

  // 玻璃杯反射效果
  const glassReflection = useMemo(() => ({
    background: `linear-gradient(135deg, 
      rgba(255, 255, 255, 0.1) 0%, 
      transparent 30%, 
      transparent 70%, 
      rgba(255, 255, 255, 0.05) 100%)`,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }), [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isShowing && isClient) {
      setParticles(generateLiquidParticles)
      
      // 动画阶段控制
      const phaseTimeline = [
        { phase: 'initial', duration: 500 },
        { phase: 'mixing', duration: 2000 },
        { phase: 'settling', duration: 800 },
        { phase: 'complete', duration: 500 }
      ]
      
      let currentTime = 0
      phaseTimeline.forEach(({ phase, duration }) => {
        setTimeout(() => {
          setAnimationPhase(phase as any)
          if (phase === 'complete') {
            onComplete?.()
          }
        }, currentTime)
        currentTime += duration
      })
    }
  }, [isShowing, isClient, generateLiquidParticles, onComplete])

  if (!isShowing || !isClient) return null

  return (
    <AnimatePresence>
      {isShowing && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* 背景环境光效 */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1.1, 0.9, 1.1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>

          {/* 粒子系统背景 */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className={`absolute rounded-full bg-gradient-to-br ${particle.color}`}
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, particle.velocity.x * 10, 0],
                  scale: [0.8, 1.2, 0.8],
                  opacity: [particle.opacity * 0.5, particle.opacity, particle.opacity * 0.5]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: particle.id * 0.1
                }}
              />
            ))}
          </div>

          {/* 主要玻璃杯和液体动画 */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 1.2, 
              delay: 0.3,
              ease: [0.23, 1, 0.32, 1]
            }}
          >
            {/* 精致的鸡尾酒杯 */}
            <motion.div
              className="relative mx-auto mb-12"
              style={{ width: `${glassConfig.width}px`, height: `${glassConfig.height + glassConfig.stemHeight}px` }}
              animate={{
                rotateY: animationPhase === 'mixing' ? [0, 5, -5, 0] : [0],
                rotateZ: animationPhase === 'mixing' ? [0, 1, -1, 0] : [0]
              }}
              transition={{
                duration: animationPhase === 'mixing' ? 2 : 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut"
              }}
            >
              {/* 玻璃杯主体 */}
              <div 
                className="relative overflow-hidden"
                style={{
                  width: '100%',
                  height: `${glassConfig.height}px`,
                  ...glassReflection,
                  borderRadius: variant === 'shot' ? '8px' : '0 0 50% 50%',
                  clipPath: variant === 'martini' 
                    ? 'polygon(20% 100%, 80% 100%, 50% 0%)' 
                    : variant === 'wine'
                    ? 'ellipse(35% 50% at 50% 50%)'
                    : 'none'
                }}
              >
                {/* 底层液体 (Amber) */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={liquidMixingKeyframes.amberLiquid}
                  animate={{
                    background: liquidMixingKeyframes.amberLiquid.background
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                />

                {/* 混合过渡区域 */}
                <motion.div
                  className="absolute left-0 right-0"
                  style={{
                    bottom: `${20 + progress * 0.35}%`,
                    ...liquidMixingKeyframes.mixingZone
                  }}
                  animate={{
                    opacity: liquidMixingKeyframes.mixingZone.opacity,
                    filter: `blur(${animationPhase === 'mixing' ? '2px' : '0px'})`
                  }}
                />

                {/* 顶层液体 (Pink) */}
                <motion.div
                  className="absolute left-0 right-0"
                  style={{
                    bottom: `${35 + progress * 0.3}%`,
                    ...liquidMixingKeyframes.pinkLiquid
                  }}
                  animate={{
                    transform: liquidMixingKeyframes.pinkLiquid.transform
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                />

                {/* 表面张力效果 */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut"
                  }}
                />

                {/* 玻璃高光 */}
                <div
                  className="absolute inset-y-0 left-2 w-1 bg-gradient-to-b from-white/30 via-white/10 to-transparent"
                  style={{ borderRadius: '50px' }}
                />
              </div>

              {/* 杯柄 (如果有) */}
              {glassConfig.stemHeight > 0 && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/20"
                  style={{
                    width: '2px',
                    height: `${glassConfig.stemHeight}px`,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)'
                  }}
                />
              )}

              {/* 杯底 */}
              {glassConfig.stemHeight > 0 && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/15 rounded-full"
                  style={{
                    width: '24px',
                    height: '4px',
                    filter: 'blur(0.5px)'
                  }}
                />
              )}
            </motion.div>

            {/* 优雅的文字动画 */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <motion.h2 
                className="text-2xl font-light text-gray-200 tracking-wide"
                animate={{ 
                  opacity: [0.7, 1, 0.7],
                  scale: [0.98, 1, 0.98]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut"
                }}
              >
                {message}
              </motion.h2>

              {/* 进度指示器 */}
              <div className="space-y-4">
                <motion.div className="w-80 h-1 bg-slate-800/50 rounded-full overflow-hidden mx-auto backdrop-blur-sm border border-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-pink-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </motion.div>
                
                {/* 阶段指示 */}
                <motion.p 
                  className="text-sm text-gray-400 tracking-wider"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {animationPhase === 'initial' && '准备材料中...'}
                  {animationPhase === 'mixing' && '精心调制中...'}
                  {animationPhase === 'settling' && '静置融合中...'}
                  {animationPhase === 'complete' && '完美调制完成!'}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
