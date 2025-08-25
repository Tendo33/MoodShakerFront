"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCocktail } from "@/context/CocktailContext"
import { useLanguage } from "@/context/LanguageContext"
import { Container, Card, Button, GradientText, Badge } from "@/components/ui/core"
import { motion, AnimatePresence } from "framer-motion"

export default function Questions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale, getPathWithLanguage } = useLanguage()
  const {
    answers,
    userFeedback,
    baseSpirits,
    isLoading,
    progressPercentage,
    loadSavedData,
    saveAnswer,
    saveFeedback,
    toggleBaseSpirit,
    submitRequest,
    isQuestionAnswered,
    resetAll,
  } = useCocktail()

  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [showBaseSpirits, setShowBaseSpirits] = useState(false)
  const [feedback, setFeedback] = useState("")

  const totalSteps = 5 // 3 questions + base spirits + feedback
  const getCurrentStep = () => {
    if (showFeedbackForm) return 5
    if (showBaseSpirits) return 4
    return currentQuestion
  }
  const currentStep = getCurrentStep()
  const calculatedProgress = (currentStep / totalSteps) * 100

  const questions = [
    {
      id: 1,
      key: "cocktail_type",
      title: t("questions.cocktail_type.title"),
      options: [
        {
          value: "classic",
          label: t("questions.cocktail_type.classic"),
          image: "/classic.png",
          description:
            locale === "cn" ? "经典马提尼、威士忌酸等传统鸡尾酒" : "Traditional cocktails like Martini, Whiskey Sour",
        },
        {
          value: "creative",
          label: t("questions.cocktail_type.creative"),
          image: "/custom.png",
          description:
            locale === "cn"
              ? "创新口味和独特配方的现代鸡尾酒"
              : "Modern cocktails with innovative flavors and unique recipes",
        },
      ],
    },
    {
      id: 2,
      key: "alcohol_strength",
      title: t("questions.alcohol_strength.title"),
      options: [
        {
          value: "light",
          label: t("questions.alcohol_strength.light"),
          image: "/alcohol_low.png",
          description: locale === "cn" ? "酒精度较低，口感清爽" : "Lower alcohol content, refreshing taste",
        },
        {
          value: "medium",
          label: t("questions.alcohol_strength.medium"),
          image: "/alcohol_medium.png",
          description: locale === "cn" ? "适中的酒精浓度，平衡口感" : "Moderate alcohol content, balanced flavor",
        },
        {
          value: "strong",
          label: t("questions.alcohol_strength.strong"),
          image: "/alcohol_high.png",
          description: locale === "cn" ? "高酒精度，浓烈口感" : "High alcohol content, bold flavor",
        },
        {
          value: "surprise",
          label: t("questions.alcohol_strength.surprise"),
          image: "/any.png",
          description: locale === "cn" ? "让我们为您选择合适的浓度" : "Let us choose the perfect strength for you",
        },
      ],
    },
    {
      id: 3,
      key: "skill_level",
      title: t("questions.skill_level.title"),
      options: [
        {
          value: "beginner",
          label: t("questions.skill_level.beginner"),
          image: "/skill_easy.png",
          description: locale === "cn" ? "简单易做，无需复杂工具" : "Easy to make, no complex tools required",
        },
        {
          value: "intermediate",
          label: t("questions.skill_level.intermediate"),
          image: "/skill_medium.png",
          description:
            locale === "cn" ? "需要一些调酒技巧和基本工具" : "Requires some bartending skills and basic tools",
        },
        {
          value: "advanced",
          label: t("questions.skill_level.advanced"),
          image: "/skill_hard.png",
          description:
            locale === "cn" ? "复杂制作工艺，专业调酒技术" : "Complex preparation, professional bartending techniques",
        },
      ],
    },
  ]

  const baseSpiritsOptions = [
    { value: "gin", label: t("spirits.gin"), image: "/gin.png" },
    { value: "rum", label: t("spirits.rum"), image: "/rum.png" },
    { value: "vodka", label: t("spirits.vodka"), image: "/vodka.png" },
    { value: "whiskey", label: t("spirits.whiskey"), image: "/whiskey.png" },
    { value: "tequila", label: t("spirits.tequila"), image: "/tequila.png" },
    { value: "brandy", label: t("spirits.brandy"), image: "/brandy.png" },
  ]

  useEffect(() => {
    loadSavedData()
  }, [])

  const handleAnswer = (questionId: number, option: string) => {
    saveAnswer(questionId.toString(), option)
    if (questionId < questions.length) {
      setCurrentQuestion(questionId + 1)
    } else {
      setShowBaseSpirits(true)
    }
  }

  const handleBaseSpiritsDone = () => {
    setShowBaseSpirits(false)
    setShowFeedbackForm(true)
  }

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      saveFeedback(feedback)
    }
    submitRequest()
    router.push(getPathWithLanguage("/cocktail/recommendation"))
  }

  const handleReset = () => {
    resetAll()
    setCurrentQuestion(1)
    setShowFeedbackForm(false)
    setShowBaseSpirits(false)
    setFeedback("")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-pink-500/10 rounded-full blur-lg animate-pulse" />
        <div className="absolute top-20 right-10 w-12 h-12 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-md animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-blue-500/5 to-teal-500/5 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      <Container className="relative z-10 py-6 md:py-8 lg:py-10">
        <div className="mb-8 md:mb-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-300 tracking-wide">{t("questions.progress")}</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              {Math.round(calculatedProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-800/60 rounded-full h-1.5 backdrop-blur-sm border border-gray-700/30">
            <motion.div
              className="bg-gradient-to-r from-amber-500 to-pink-500 h-1.5 rounded-full shadow-lg shadow-amber-500/30 relative overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${calculatedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showBaseSpirits && !showFeedbackForm && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-8 md:space-y-10"
            >
                              <div className="text-center space-y-6 md:space-y-8">
                <div className="flex items-center justify-center gap-4">
                  <Badge
                    variant="secondary"
                    className="border-amber-500/30 text-amber-300 bg-amber-500/8 backdrop-blur-sm px-3 py-1 text-xs font-medium tracking-wide"
                  >
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </Badge>
                  <GradientText className="text-xl md:text-2xl font-bold leading-tight tracking-tight">
                    {questions[currentQuestion - 1]?.title}
                  </GradientText>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-5xl mx-auto">
                {questions[currentQuestion - 1]?.options.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className="cursor-pointer h-full transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/15 group bg-gray-800/40 backdrop-blur-md border-gray-700/40 hover:border-amber-500/40 hover:bg-amber-500/5 relative overflow-hidden"
                      onClick={() => handleAnswer(currentQuestion, option.value)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-transparent to-pink-500/0 group-hover:from-amber-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

                      <div className="aspect-[3/2] relative overflow-hidden rounded-xl mb-3">
                        <img
                          src={option.image || "/placeholder.svg?height=200&width=300&query=cocktail"}
                          alt={option.label}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors duration-300">
                            {option.label}
                          </h3>
                          {option.description && (
                            <p className="text-xs text-gray-300/90 leading-relaxed">{option.description}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {showBaseSpirits && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 md:space-y-10"
            >
                              <div className="text-center space-y-6 md:space-y-8">
                <div className="flex items-center justify-center gap-4">
                  <Badge
                    variant="secondary"
                    className="border-amber-500/30 text-amber-400 bg-amber-500/8 px-3 py-1 text-xs font-medium"
                  >
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </Badge>
                  <GradientText className="text-xl md:text-2xl font-bold tracking-tight">
                    {t("questions.base_spirits.title")}
                  </GradientText>
                </div>
                <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  {t("questions.base_spirits.description")}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
                {baseSpiritsOptions.map((spirit, index) => (
                  <motion.div
                    key={spirit.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        baseSpirits.includes(spirit.value)
                          ? "ring-2 ring-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/20"
                          : "hover:shadow-lg hover:shadow-amber-500/10 bg-gray-800/40 backdrop-blur-sm border-gray-700/40 hover:border-amber-500/30"
                      }`}
                      onClick={() => toggleBaseSpirit(spirit.value, baseSpiritsOptions.map(s => ({ id: s.value, name: s.label })))}
                    >
                      {baseSpirits.includes(spirit.value) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-2">
                        <img
                          src={spirit.image || "/placeholder.svg"}
                          alt={spirit.label}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                      <h3 className="text-center text-sm font-medium text-gray-200">{spirit.label}</h3>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBaseSpiritsDone} className="px-8 py-2 font-semibold tracking-wide">
                  {t("questions.continue")}
                </Button>
              </div>
            </motion.div>
          )}

          {showFeedbackForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 md:space-y-8 max-w-2xl mx-auto"
            >
                              <div className="text-center space-y-6 md:space-y-8">
                <div className="flex items-center justify-center gap-4">
                  <Badge
                    variant="secondary"
                    className="border-amber-500/30 text-amber-400 bg-amber-500/8 px-3 py-1 text-xs font-medium"
                  >
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </Badge>
                  <GradientText className="text-xl md:text-2xl font-bold tracking-tight">
                    {t("questions.feedback.title")}
                  </GradientText>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{t("questions.feedback.description")}</p>
              </div>

              <Card className="p-4 bg-gray-800/40 backdrop-blur-md border-gray-700/40">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t("questions.feedback.placeholder")}
                  className="w-full h-24 bg-gray-900/50 border border-gray-600/50 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none transition-all duration-300 backdrop-blur-sm"
                />
              </Card>

              <div className="flex gap-4 justify-between">
                <Button variant="outline" onClick={() => setShowFeedbackForm(false)} className="px-6 py-2 font-medium">
                  {t("questions.skip")}
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={isLoading}
                  className="px-8 py-2 font-semibold tracking-wide"
                >
                  {isLoading ? t("questions.generating") : t("questions.get_recommendation")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-4 left-4 z-20">
          <Button
            variant="outline"
            onClick={handleReset}
            className="rounded-full bg-gray-800/70 backdrop-blur-md border-gray-600/40 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all duration-300 px-4 py-2 text-sm font-medium shadow-lg"
          >
            {t("questions.reset")}
          </Button>
        </div>
      </Container>
    </div>
  )
}
