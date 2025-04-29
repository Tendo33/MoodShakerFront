"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Step } from "@/api/cocktail";
import { Lightbulb } from "lucide-react";

interface CocktailStepProps {
  step: Step;
  isLast: boolean;
  textColorClass?: string;
  additionalTip?: string;
}

export default function CocktailStep({
  step,
  isLast,
  textColorClass = "text-white",
  additionalTip,
}: CocktailStepProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine if we have any tips to show
  const hasTips = step.tips || additionalTip;

  return (
    <motion.li
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: step.step_number * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4">
        {/* Step number circle with animation */}
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full 
            bg-gradient-to-r from-amber-500 to-pink-500 text-white 
            shadow-lg flex-shrink-0 relative"
          animate={{
            scale: isHovered ? 1.1 : 1,
            boxShadow: isHovered
              ? "0 0 15px rgba(236, 72, 153, 0.5)"
              : "0 0 0 rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Pulsing ring effect on hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 to-pink-500/30 pointer-events-none"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />
          )}
          <span className="relative z-10 font-bold">{step.step_number}</span>
        </motion.div>

        {/* Step content */}
        <div className="flex-1">
          <p className={`${textColorClass} text-lg leading-relaxed`}>
            {step.description}
          </p>

          {/* Always show tips content */}
          {hasTips && (
            <motion.div
              className="mt-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-amber-400/80 text-sm">
                  {step.tips && (
                    <p className={additionalTip ? "mb-2" : ""}>{step.tips}</p>
                  )}
                  {additionalTip && <p>{additionalTip}</p>}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Step progress line */}
      {!isLast && (
        <motion.div
          className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-pink-500/50 to-amber-500/20"
          initial={{ height: 0 }}
          animate={{ height: "calc(100% - 3.5rem)" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      )}
    </motion.li>
  );
}
