"use client";

import { motion } from "framer-motion";
import QuickLoadingDots, {
  PulseRingLoader,
  InlineLoading,
} from "./animations/QuickLoadingDots";

interface LoadingSpinnerProps {
  text?: string;
  colorClass?: string;
  variant?: "classic" | "modern" | "dots" | "ring" | "inline";
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  text,
  colorClass = "border-amber-500",
  variant = "modern",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeConfig = {
    sm: { spinner: "w-8 h-8", text: "text-sm" },
    md: { spinner: "w-12 h-12", text: "text-lg" },
    lg: { spinner: "w-16 h-16", text: "text-xl" },
  };

  // 濡傛灉鏄唴鑱旀ā寮忥紝浣跨敤涓撻棬鐨勫唴鑱旂粍浠?
  if (variant === "inline") {
    return <InlineLoading text={text} />;
  }

  // 濡傛灉鏄偣鐘跺姞杞藉櫒
  if (variant === "dots") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <QuickLoadingDots size={size} />
        {text && (
          <motion.div
            className={`${sizeConfig[size].text} text-muted-foreground`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {text}
          </motion.div>
        )}
      </div>
    );
  }

  // 濡傛灉鏄幆褰㈠姞杞藉櫒
  if (variant === "ring") {
    const ringSize = size === "sm" ? 24 : size === "md" ? 32 : 40;
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <PulseRingLoader size={ringSize} color={colorClass} />
        {text && (
          <div className={`${sizeConfig[size].text} text-muted-foreground`}>{text}</div>
        )}
      </div>
    );
  }

  if (variant === "modern") {
    return (
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div
            className={`${sizeConfig[size].spinner} rounded-full border-4 border-white/5 shadow-inner`}
          ></div>

          <motion.div
            className={`${sizeConfig[size].spinner} rounded-full absolute top-0 border-4 border-transparent ${colorClass} border-t-current drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />

          <motion.div
            className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-br from-amber-400 to-pink-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_16px_rgba(245,158,11,0.8)]"
            animate={{
              scale: [0.8, 1.5, 0.8],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>

        {text && (
          <motion.div
            className={`${sizeConfig[size].text} font-medium text-foreground/80 text-center tracking-widest uppercase text-xs mt-4`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            {text}
          </motion.div>
        )}
      </div>
    );
  }

  // 缁忓吀鐗堟湰锛堝悜鍚庡吋瀹癸級
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div
          className={`${sizeConfig[size].spinner} rounded-full absolute border-4 border-solid border-border/20`}
        ></div>
        <div
          className={`${sizeConfig[size].spinner} rounded-full animate-spin absolute border-4 border-solid border-transparent ${colorClass} border-t-current`}
        ></div>
      </div>
      {text && <div className={`ml-4 ${sizeConfig[size].text}`}>{text}</div>}
    </div>
  );
}

