"use client";

import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { GradientText } from "@/components/ui/core";

interface WaitingAnimationProps {
  isShowing?: boolean;
  onComplete?: () => void;
  message?: string;
  messageKey?: string;
  subtitleKey?: string;
  progress?: number;
}

const WaitingAnimation = memo(function WaitingAnimation({
  isShowing = true,
  onComplete,
  message,
  messageKey = "loading.default",
  subtitleKey = "loading.subtitle",
  progress: externalProgress,
}: WaitingAnimationProps) {
  const { t } = useLanguage();
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Get display text
  const displayMessage = message || t(messageKey) || t("loading.default");
  const displaySubtitle = t(subtitleKey) || t("loading.subtitle");

  // Simulated progress logic (fallback if externalProgress is not provided)
  useEffect(() => {
    if (externalProgress !== undefined) {
      setSimulatedProgress(externalProgress);
      return;
    }

    const startTime = Date.now();
    const duration = 4000;
    let animationFrame: number;

    const update = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = (elapsed / duration) * 100;
      // Slow down as it approaches 90%
      const easeProgress = rawProgress < 50 
        ? rawProgress 
        : 50 + (rawProgress - 50) * 0.5;
      
      setSimulatedProgress(Math.min(easeProgress, 90));
      
      if (elapsed < duration * 2) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [externalProgress]);

  // Completion handler
  useEffect(() => {
    if (externalProgress && externalProgress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [externalProgress, onComplete]);

  if (!isShowing) return null;

  // Generate random glitch text effect characters
  const glitchChars = "!<>-_\\/[]{}—=+*^?#________";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-3xl overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-secondary/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" style={{ animationDelay: "2s" }} />
      
      {/* Cyberpunk Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                           linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center max-w-2xl w-full p-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Central Holographic Animation */}
        <div className="relative w-80 h-80 mb-16 flex items-center justify-center">
          
          {/* Outer Rotating Data Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),1)]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary/50 rounded-full" />
          </motion.div>

          {/* Counter-rotating Inner Ring */}
          <motion.div
            className="absolute inset-8 rounded-full border border-secondary/20 border-dashed"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Hexagon Frame */}
          <div className="absolute inset-16 border border-white/10 rotate-45 backdrop-blur-sm bg-white/5" />
          <div className="absolute inset-16 border border-white/10 rotate-[15deg] backdrop-blur-sm bg-white/5" />

          {/* Central Visual - Animated Cocktail Shaker / Glass */}
          <div className="relative z-20 flex flex-col items-center justify-center">
            {/* Glowing Core */}
            <motion.div 
              className="absolute w-32 h-32 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            <div className="relative text-7xl md:text-8xl drop-shadow-[0_0_25px_rgba(var(--primary),0.6)] filter brightness-110">
              <motion.span
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block"
              >
                🍸
              </motion.span>
            </div>
            
            {/* Scanning Effect Line */}
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),1)]"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Status Text Block */}
        <div className="space-y-8 text-center w-full max-w-md relative">
          {/* Glitch Effect Decoration */}
          <div className="absolute -left-8 top-0 text-xs font-mono text-primary/20 flex flex-col gap-1 select-none">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i}>{glitchChars.substring(i, i+5)}</div>
             ))}
          </div>
          <div className="absolute -right-8 bottom-0 text-xs font-mono text-secondary/20 flex flex-col gap-1 select-none text-right">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i}>{glitchChars.substring(i, i+5)}</div>
             ))}
          </div>

          <motion.div
            key={displayMessage} // Re-animate when message changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-playfair tracking-tight">
              <GradientText className="drop-shadow-lg">
                {displayMessage}
              </GradientText>
            </h2>
            
            <motion.div 
              className="flex items-center justify-center gap-2 font-mono text-sm text-primary/70"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span>{">"}</span>
              <span className="uppercase tracking-widest">{displaySubtitle}</span>
              <span className="animate-pulse">_</span>
            </motion.div>
          </motion.div>

          {/* High-tech Progress Bar */}
          <div className="relative pt-4">
             <div className="flex justify-between text-xs font-mono text-muted-foreground mb-2 opacity-50">
               <span>00</span>
               <span>PROCESSING</span>
               <span>100</span>
             </div>
             
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
               <motion.div
                 className="h-full bg-gradient-to-r from-primary via-purple-500 to-secondary relative"
                 initial={{ width: "0%" }}
                 animate={{ width: `${simulatedProgress}%` }}
                 transition={{ type: "spring", stiffness: 50, damping: 20 }}
               >
                 <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_white]" />
                 <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
               </motion.div>
             </div>
             
             {/* Reflection under bar */}
             <div className="h-px w-full mt-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>
        </div>
      </motion.div>
    </div>
  );
});

WaitingAnimation.displayName = "WaitingAnimation";

export default WaitingAnimation;
