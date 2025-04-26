"use client"

import { motion } from "framer-motion"
import { CoffeeIcon as Cocktail, Martini, Wine, Utensils, Thermometer, Hourglass } from "lucide-react"

interface StepIllustrationProps {
  stepNumber: number
  stepDescription: string
}

export default function StepIllustration({ stepNumber, stepDescription }: StepIllustrationProps) {
  // 根据步骤描述选择合适的图标
  const getIcon = () => {
    const desc = stepDescription.toLowerCase()

    if (desc.includes("搅拌") || desc.includes("stir")) {
      return <Utensils className="w-full h-full text-amber-400" />
    } else if (desc.includes("倒入") || desc.includes("pour")) {
      return <Wine className="w-full h-full text-pink-400" />
    } else if (desc.includes("摇晃") || desc.includes("shake")) {
      return <Cocktail className="w-full h-full text-blue-400" />
    } else if (desc.includes("冷却") || desc.includes("冰") || desc.includes("ice") || desc.includes("cool")) {
      return <Thermometer className="w-full h-full text-cyan-400" />
    } else if (desc.includes("等待") || desc.includes("wait") || desc.includes("时间") || desc.includes("time")) {
      return <Hourglass className="w-full h-full text-purple-400" />
    } else {
      return <Martini className="w-full h-full text-emerald-400" />
    }
  }

  return (
    <motion.div
      className="hidden md:flex items-center justify-center w-16 h-16 bg-gray-800/30 rounded-full backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 * stepNumber }}
      whileHover={{ scale: 1.1, rotate: 5 }}
    >
      {getIcon()}
    </motion.div>
  )
}
