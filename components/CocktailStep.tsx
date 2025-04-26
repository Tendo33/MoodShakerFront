"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { Step } from "@/api/cocktail"

interface CocktailStepProps {
  step: Step
  isLast: boolean
  theme: "dark" | "light"
  textColorClass: string
}

export default function CocktailStep({ step, isLast, theme, textColorClass }: CocktailStepProps) {
  const [isHovered, setIsHovered] = useState(false)

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
        <motion.div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg flex-shrink-0"
          animate={{
            scale: isHovered ? 1.1 : 1,
            boxShadow: isHovered ? "0 0 15px rgba(236, 72, 153, 0.5)" : "0 0 0 rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.3 }}
        >
          {step.step_number}
        </motion.div>
        <div className="flex-1">
          <p className={`${textColorClass} text-lg leading-relaxed`}>{step.description}</p>
          {step.tips && (
            <motion.div
              className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-amber-400/70 text-sm flex items-center gap-2">
                <span className="font-medium">💡 Tip:</span> {step.tips}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Step progress line */}
      {!isLast && (
        <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-pink-500/50 to-amber-500/20 h-[calc(100%-3.5rem)]"></div>
      )}
    </motion.li>
  )
}
