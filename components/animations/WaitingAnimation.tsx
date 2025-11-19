"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface WaitingAnimationProps {
  isShowing?: boolean;
  onComplete?: () => void;
  message?: string;
  messageKey?: string;
  subtitleKey?: string;
  progress?: number;
}

// Elegant Coupe Glass Component
const ElegantGlass = ({ progress }: { progress: number }) => {
  // Calculate liquid height logic
  // Bowl is roughly from y=40 to y=75 (height ~35)
  // We map 0-100 progress to fill this area
  const liquidLevel = Math.min(Math.max(progress, 0), 100);
  // Liquid fills from bottom (y=75) up to top (y=40)
  const liquidY = 75 - (35 * liquidLevel) / 100;

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
      {/* Soft Glow Background */}
      <motion.div
        className="absolute inset-0 bg-primary/10 rounded-full blur-[60px]"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [0.9, 1.1, 0.9],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <svg
        viewBox="0 0 100 160"
        className="w-40 h-60 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)] overflow-visible"
      >
        <defs>
          <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" /> {/* Cyan */}
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.85" /> {/* Purple */}
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0.8" /> {/* Pink */}
          </linearGradient>
          
          <clipPath id="bowlClip">
             {/* Matches the bowl path below */}
             <path d="M 15 40 C 15 70, 85 70, 85 40 Z" />
          </clipPath>
        </defs>

        {/* Glass Outline - Elegant Coupe Shape */}
        <motion.g
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8 }}
        >
            {/* Bowl */}
            <path
              d="M 15 40 C 15 70, 85 70, 85 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-primary/60"
            />
             {/* Rim (Elliptical illusion) */}
             <path
              d="M 15 40 Q 50 30, 85 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-primary/60 opacity-30"
            />
            <path
              d="M 15 40 Q 50 50, 85 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-primary/60"
            />
            
            {/* Stem */}
            <path
              d="M 50 70 L 50 125"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary/60"
            />
            {/* Base */}
            <path
              d="M 30 125 Q 50 120, 70 125"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="text-primary/60"
            />
        </motion.g>

        {/* Liquid Fill */}
        <g clipPath="url(#bowlClip)">
             {/* Main Liquid Mass */}
             <motion.rect
                x="0"
                y={liquidY}
                width="100"
                height="100"
                fill="url(#liquidGradient)"
                initial={{ y: 75 }}
                animate={{ y: liquidY }}
                transition={{ type: "spring", stiffness: 20, damping: 15 }}
             />
             
             {/* Surface Line (Follows liquid top) */}
             <motion.path
                d={`M 15 ${liquidY} Q 50 ${liquidY + 5} 85 ${liquidY}`}
                fill="none"
                stroke="white"
                strokeWidth="1"
                strokeOpacity="0.5"
             />

             {/* Bubbles */}
             {[...Array(6)].map((_, i) => (
                 <motion.circle
                    key={i}
                    r={Math.random() * 1.2 + 0.5}
                    fill="white"
                    fillOpacity="0.7"
                    initial={{ cy: 70, cx: 50 }}
                    animate={{
                        cy: [70, 40],
                        cx: 50 + (Math.random() * 40 - 20),
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 1.5 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut"
                    }}
                 />
             ))}
        </g>

        {/* Pouring Stream (Centered) */}
        <AnimatePresence>
            {progress < 98 && progress > 2 && (
                <motion.path
                    d="M 50 0 L 50 60"
                    stroke="url(#liquidGradient)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeOpacity="0.8"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </AnimatePresence>

        {/* Garnish (Cherry) - Appears at end */}
        <AnimatePresence>
            {progress >= 95 && (
                <motion.g
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                    <circle cx="50" cy="45" r="4" fill="#ef4444" stroke="none" />
                    <path d="M 50 45 Q 55 35 60 25" stroke="#78350f" strokeWidth="1" fill="none" />
                </motion.g>
            )}
        </AnimatePresence>

        {/* Highlights/Reflections */}
        <path d="M 25 45 Q 30 55 30 65" stroke="white" strokeWidth="1" strokeOpacity="0.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

const WaitingAnimation = memo(function WaitingAnimation({
  isShowing = true,
  onComplete,
  message,
  messageKey = "loading.default",
  subtitleKey = "loading.subtitle",
  progress: externalProgress = 0,
}: WaitingAnimationProps) {
  const { t } = useLanguage();
  const [internalProgress, setInternalProgress] = useState(0);

  // Get display text
  const displayMessage = message || t(messageKey) || t("loading.default");
  const displaySubtitle = t(subtitleKey) || t("loading.subtitle");

  // Sync internal progress
  useEffect(() => {
     if (externalProgress > internalProgress) {
        setInternalProgress(externalProgress);
     }
  }, [externalProgress, internalProgress]);

  // Completion handler
  useEffect(() => {
    if (externalProgress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [externalProgress, onComplete]);

  if (!isShowing) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl flex items-center justify-center p-6 overflow-hidden">
        {/* Subtle Background Texture */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        <div className="noise-bg opacity-10" />
        
        {/* Ambient Lighting */}
        <motion.div 
            className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-primary/10 rounded-full blur-[150px]"
            animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.2, 0.1], 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
      <motion.div
        className="relative max-w-md w-full text-center space-y-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        
        {/* The Star of the Show */}
        <ElegantGlass progress={internalProgress} />

        <div className="space-y-6 relative z-10 px-8">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
                <motion.h2
                key={displayMessage} 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-2xl md:text-3xl font-medium text-foreground tracking-wide font-playfair"
                >
                {displayMessage}
                </motion.h2>
            </AnimatePresence>
            
            <p className="text-sm text-muted-foreground font-source-sans tracking-widest uppercase opacity-60">
              {displaySubtitle}
            </p>
          </motion.div>

          {/* Minimalist Progress Bar */}
          <div className="relative w-full max-w-[200px] mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: `${internalProgress}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 20 }}
            />
          </div>
          
        </div>
      </motion.div>
    </div>
  );
});

WaitingAnimation.displayName = "WaitingAnimation";

export default WaitingAnimation;
