"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCocktail } from "@/context/CocktailContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Container,
  Button,
  GradientText,
} from "@/components/ui/core";
import { motion, AnimatePresence } from "framer-motion";
import { useSmartLoading } from "@/components/animations/SmartLoadingSystem";

export default function Questions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale, getPathWithLanguage } = useLanguage();
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
  } = useCocktail();

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showBaseSpirits, setShowBaseSpirits] = useState(false);
  const [feedback, setFeedback] = useState("");

  const {
    isLoading: isGenerating,
    progress,
    startLoading: startGeneration,
    updateProgress,
    completeLoading: completeGeneration,
    LoadingComponent,
  } = useSmartLoading();

  const totalSteps = 5;
  const getCurrentStep = () => {
    if (showFeedbackForm) return 5;
    if (showBaseSpirits) return 4;
    return currentQuestion;
  };
  const currentStep = getCurrentStep();
  const calculatedProgress = (currentStep / totalSteps) * 100;

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
            locale === "cn"
              ? "经典马提尼、威士忌酸等传统鸡尾酒"
              : "Traditional cocktails like Martini, Whiskey Sour",
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
          description:
            locale === "cn"
              ? "酒精度较低，口感清爽"
              : "Lower alcohol content, refreshing taste",
        },
        {
          value: "medium",
          label: t("questions.alcohol_strength.medium"),
          image: "/alcohol_medium.png",
          description:
            locale === "cn"
              ? "适中的酒精浓度，平衡口感"
              : "Moderate alcohol content, balanced flavor",
        },
        {
          value: "strong",
          label: t("questions.alcohol_strength.strong"),
          image: "/alcohol_high.png",
          description:
            locale === "cn"
              ? "高酒精度，浓烈口感"
              : "High alcohol content, bold flavor",
        },
        {
          value: "surprise",
          label: t("questions.alcohol_strength.surprise"),
          image: "/any.png",
          description:
            locale === "cn"
              ? "让我们为您选择合适的浓度"
              : "Let us choose the perfect strength for you",
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
          description:
            locale === "cn"
              ? "简单易做，无需复杂工具"
              : "Easy to make, no complex tools required",
        },
        {
          value: "intermediate",
          label: t("questions.skill_level.intermediate"),
          image: "/skill_medium.png",
          description:
            locale === "cn"
              ? "需要一些调酒技巧和基本工具"
              : "Requires some bartending skills and basic tools",
        },
        {
          value: "advanced",
          label: t("questions.skill_level.advanced"),
          image: "/skill_hard.png",
          description:
            locale === "cn"
              ? "复杂制作工艺，专业调酒技术"
              : "Complex preparation, professional bartending techniques",
        },
      ],
    },
  ];

  const baseSpiritsOptions = [
    { value: "gin", label: t("spirits.gin"), image: "/gin.png" },
    { value: "rum", label: t("spirits.rum"), image: "/rum.png" },
    { value: "vodka", label: t("spirits.vodka"), image: "/vodka.png" },
    { value: "whiskey", label: t("spirits.whiskey"), image: "/whiskey.png" },
    { value: "tequila", label: t("spirits.tequila"), image: "/tequila.png" },
    { value: "brandy", label: t("spirits.brandy"), image: "/brandy.png" },
  ];

  useEffect(() => {
    loadSavedData();
  }, []);

  const handleAnswer = (questionId: number, option: string) => {
    saveAnswer(questionId.toString(), option);
    if (questionId < questions.length) {
      setCurrentQuestion(questionId + 1);
    } else {
      setShowBaseSpirits(true);
    }
  };

  const handleBaseSpiritsDone = () => {
    setShowBaseSpirits(false);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async () => {
    if (feedback.trim()) {
      saveFeedback(feedback);
    }

    startGeneration();

    try {
      updateProgress(20);
      await submitRequest();
      updateProgress(70);

      setTimeout(() => {
        updateProgress(100);
        setTimeout(() => {
          router.push(getPathWithLanguage("/cocktail/recommendation"));
        }, 500);
      }, 800);
    } catch (error) {
      console.error("提交失败:", error);
      completeGeneration();
    }
  };

  const handleReset = () => {
    resetAll();
    setCurrentQuestion(1);
    setShowFeedbackForm(false);
    setShowBaseSpirits(false);
    setFeedback("");
    completeGeneration();
  };

  // 如果正在生成，显示全屏等待动画
  if (isGenerating) {
    return (
      <LoadingComponent
        type="cocktail-mixing"
        message={t("questions.generating")}
        estimatedDuration={3000}
        onComplete={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Minimal sophisticated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-pink-500/3" />

        {/* Sophisticated line pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: "120px 120px",
            }}
          />
        </div>
      </div>

      <Container className="relative z-10 py-6 md:py-8 lg:py-10">
        <div className="mb-8 md:mb-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-300 tracking-wide">
              {t("questions.progress")}
            </span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
              {Math.round(calculatedProgress)}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-px overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${calculatedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showBaseSpirits && !showFeedbackForm && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-8 md:space-y-10"
            >
              <div className="text-center space-y-6 md:space-y-8">
                <div className="flex items-center justify-center gap-4">
                  <div className="border border-amber-500/30 text-amber-300 bg-amber-500/8 backdrop-blur-sm px-3 py-1 text-xs font-medium tracking-wide rounded-full">
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </div>
                  <GradientText className="text-xl md:text-2xl font-bold leading-tight tracking-tight">
                    {questions[currentQuestion - 1]?.title}
                  </GradientText>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 max-w-5xl mx-auto">
                {questions[currentQuestion - 1]?.options.map(
                  (option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      whileHover={{ y: -8 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <div
                        className="cursor-pointer h-full group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/8 hover:border-white/20"
                        onClick={() =>
                          handleAnswer(currentQuestion, option.value)
                        }
                      >
                        {/* Subtle hover accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                        <div className="aspect-square relative overflow-hidden rounded-lg mb-4 bg-black/20">
                          <img
                            src={
                              option.image ||
                              "/placeholder.svg?height=200&width=300&query=cocktail"
                            }
                            alt={option.label}
                            className="w-full h-full object-cover opacity-80"
                          />
                        </div>

                        <div className="relative z-10">
                          <h3 className="text-lg font-light text-white mb-2">
                            {option.label}
                          </h3>
                          {option.description && (
                            <p className="text-sm text-white/60 leading-relaxed">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ),
                )}
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
                  <div className="border border-amber-500/30 text-amber-400 bg-amber-500/8 px-3 py-1 text-xs font-medium rounded-full">
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </div>
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
                    <div
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden ${
                        baseSpirits.includes(spirit.value)
                          ? "bg-amber-500/20 border-amber-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                      } border rounded-xl p-4 text-center`}
                      onClick={() =>
                        toggleBaseSpirit(
                          spirit.value,
                          baseSpiritsOptions.map((s) => ({
                            id: s.value,
                            name: s.label,
                          })),
                        )
                      }
                    >
                      {baseSpirits.includes(spirit.value) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-black"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3 bg-black/20">
                        <img
                          src={spirit.image || "/placeholder.svg"}
                          alt={spirit.label}
                          className="w-full h-full object-cover opacity-70"
                        />
                      </div>
                      <h3 className="text-sm font-light text-white">
                        {spirit.label}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleBaseSpiritsDone}
                  className="px-8 py-2 font-semibold tracking-wide"
                >
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
                  <div className="border border-amber-500/30 text-amber-400 bg-amber-500/8 px-3 py-1 text-xs font-medium rounded-full">
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </div>
                  <GradientText className="text-xl md:text-2xl font-bold tracking-tight">
                    {t("questions.feedback.title")}
                  </GradientText>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {t("questions.feedback.description")}
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t("questions.feedback.placeholder")}
                  className="w-full h-24 bg-transparent border-none rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-4 justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackForm(false)}
                  className="px-6 py-2 font-medium"
                >
                  {t("questions.skip")}
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={isGenerating}
                  className="px-8 py-2 font-semibold tracking-wide"
                >
                  {isGenerating
                    ? t("questions.generating")
                    : t("questions.get_recommendation")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-6 left-6 z-20">
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-full text-white/90 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-500/50 hover:shadow-red-500/20 hover:shadow-xl"
          >
            {/* 背景光晕效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* 重置图标 */}
            <div className="relative flex items-center gap-2">
              <svg
                className="w-4 h-4 text-white/80 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="group-hover:text-white transition-colors duration-300">
                {t("questions.reset")}
              </span>
            </div>
          </motion.button>
        </div>
      </Container>
    </div>
  );
}
