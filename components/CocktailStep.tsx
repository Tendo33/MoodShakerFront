"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Step } from "@/api/cocktail";
import { Lightbulb, ChevronRight } from "lucide-react";

interface CocktailStepProps {
  step: Step;
  isLast: boolean;
  theme: "dark" | "light";
  textColorClass: string;
  additionalTip?: string; // New prop for additional tips from the general tips section
}

export default function CocktailStep({
  step,
  isLast,
  theme,
  textColorClass,
  additionalTip,
}: CocktailStepProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation variants
  const tipVariants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0 },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: 12,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // Determine if we have any tips to show (either from step or additional)
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
        {/* Step number circle with improved animation */}
        <motion.div
          className={`
            flex h-10 w-10 items-center justify-center rounded-full 
            bg-gradient-to-r from-amber-500 to-pink-500 text-white 
            shadow-lg flex-shrink-0 relative
          `}
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
              className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 to-pink-500/30"
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

        {/* Step content with improved layout */}
        <div className="flex-1">
          <div className="flex items-start">
            <p className={`${textColorClass} text-lg leading-relaxed flex-1`}>
              {step.description}
            </p>

            {/* Tip toggle button (only if there's a tip) */}
            {hasTips && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                  ml-2 p-1 rounded-full flex-shrink-0 transition-colors
                  ${isExpanded ? "bg-amber-500/20 text-amber-500" : "bg-gray-700/30 text-gray-400"}
                  hover:bg-amber-500/20 hover:text-amber-500
                `}
                aria-label={isExpanded ? "Hide tip" : "Show tip"}
                aria-expanded={isExpanded}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            )}
          </div>

          {/* Combined tips content with animation */}
          {hasTips && (
            <motion.div
              className="overflow-hidden"
              initial="collapsed"
              animate={isExpanded ? "expanded" : "collapsed"}
              variants={tipVariants}
            >
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-amber-400/80 text-sm">
                    {step.tips && <p className="mb-2">{step.tips}</p>}
                    {additionalTip && <p>{additionalTip}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Step progress line with improved animation */}
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
