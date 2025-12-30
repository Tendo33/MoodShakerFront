"use client";

import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useCocktail } from "@/context/CocktailContext";
import { useLanguage } from "@/context/LanguageContext";
import { Container, Button, GradientText } from "@/components/ui/core";
import { motion, AnimatePresence } from "framer-motion";
import SmartLoadingSystem, {
  useSmartLoading,
} from "@/components/animations/SmartLoadingSystem";
import { appLogger, safeLogger } from "@/utils/logger";

const Questions = memo(function Questions() {
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Loading message rotation
  const [loadingMessage, setLoadingMessage] = useState("");

  const {
    isLoading: isGenerating,
    progress,
    startLoading: startGeneration,
    updateProgress,
    completeLoading: completeGeneration,
  } = useSmartLoading();

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) return;

    const messages = [
      t("loading.rotating.1"),
      t("loading.rotating.2"),
      t("loading.rotating.3"),
      t("loading.rotating.4"),
      t("loading.rotating.5"),
    ];

    setLoadingMessage(messages[0]); // Start with first message

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating, t]);

  const totalSteps = 5;

  const currentStep = useMemo(() => {
    if (showFeedbackForm) return 5;
    if (showBaseSpirits) return 4;
    return currentQuestion;
  }, [showFeedbackForm, showBaseSpirits, currentQuestion]);

  const calculatedProgress = useMemo(
    () => (currentStep / totalSteps) * 100,
    [currentStep, totalSteps],
  );

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
          description: t("questions.cocktail_type.classic.description"),
        },
        {
          value: "creative",
          label: t("questions.cocktail_type.creative"),
          image: "/custom.png",
          description: t("questions.cocktail_type.creative.description"),
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
          description: t("questions.alcohol_strength.light.description"),
        },
        {
          value: "medium",
          label: t("questions.alcohol_strength.medium"),
          image: "/alcohol_medium.png",
          description: t("questions.alcohol_strength.medium.description"),
        },
        {
          value: "strong",
          label: t("questions.alcohol_strength.strong"),
          image: "/alcohol_high.png",
          description: t("questions.alcohol_strength.strong.description"),
        },
        {
          value: "surprise",
          label: t("questions.alcohol_strength.surprise"),
          image: "/any.png",
          description: t("questions.alcohol_strength.surprise.description"),
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
          description: t("questions.skill_level.beginner.description"),
        },
        {
          value: "intermediate",
          label: t("questions.skill_level.intermediate"),
          image: "/skill_medium.png",
          description: t("questions.skill_level.intermediate.description"),
        },
        {
          value: "advanced",
          label: t("questions.skill_level.advanced"),
          image: "/skill_hard.png",
          description: t("questions.skill_level.advanced.description"),
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
    const loadData = async () => {
      try {
        await loadSavedData();
      } catch (error) {
        appLogger.error("Data loading failed");
      }
    };

    loadData();
  }, [loadSavedData]);

  const handleAnswer = useCallback(
    async (questionId: number, option: string) => {
      safeLogger.userInteraction("select questionnaire option");
      setSelectedOption(option);

      // Add delay for micro-interaction
      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        await saveAnswer(questionId.toString(), option);
        if (questionId < questions.length) {
          setCurrentQuestion(questionId + 1);
        } else {
          setShowBaseSpirits(true);
        }
        setSelectedOption(null); // Reset selection
      } catch (error) {
        appLogger.error("Answer progress save failed");
        if (questionId < questions.length) {
          setCurrentQuestion(questionId + 1);
        } else {
          setShowBaseSpirits(true);
        }
        setSelectedOption(null);
      }
    },
    [saveAnswer, questions.length],
  );

  const handleBaseSpiritsDone = () => {
    setShowBaseSpirits(false);
    setShowFeedbackForm(true);
  };

  const handleFeedbackSubmit = async () => {
    safeLogger.userInteraction("submit questionnaire");
    startGeneration();

    try {
      if (feedback.trim()) {
        await saveFeedback(feedback);
      }

      updateProgress(20);

      // Add safety timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 60000),
      );

      await Promise.race([submitRequest(), timeoutPromise]);

      updateProgress(70);

      setTimeout(() => {
        updateProgress(100);
      }, 800);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("error.generationFailed");

      appLogger.error("Questionnaire submission failed", errorMessage);
      completeGeneration();

      // 显示用户友好的错误提示
      if (typeof window !== "undefined") {
        alert(`⚠️ ${errorMessage}`);
      }
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

  // 回退功能
  const handleGoBack = useCallback(() => {
    if (showFeedbackForm) {
      setShowFeedbackForm(false);
      setShowBaseSpirits(true);
    } else if (showBaseSpirits) {
      setShowBaseSpirits(false);
      setCurrentQuestion(questions.length);
    } else if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    } else {
      // 第1题时，返回首页
      router.push(getPathWithLanguage("/"));
    }
  }, [showFeedbackForm, showBaseSpirits, currentQuestion, questions.length, router, getPathWithLanguage]);

  // 判断是否可以回退（现在第1题也可以回退到首页）
  const canGoBack = true;

  const navigateToRecommendation = useCallback(() => {
    router.push(getPathWithLanguage("/cocktail/recommendation"));
  }, [router, getPathWithLanguage]);

  if (isGenerating) {
    return (
      <SmartLoadingSystem
        isShowing={isGenerating}
        actualProgress={progress}
        type="cocktail-mixing"
        message={loadingMessage} // Use rotating message
        estimatedDuration={3000}
        onComplete={navigateToRecommendation}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Container className="relative z-10 py-16 md:py-24">
        <div className="mb-12 md:mb-16 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
              {t("questions.progress")}
            </span>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {Math.round(calculatedProgress)}%
            </span>
          </div>

          <div className="relative w-full bg-white/5 rounded-full h-3 overflow-hidden shadow-inner backdrop-blur-sm border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)] relative overflow-hidden"
              initial={{ width: "0%" }}
              animate={{ width: `${calculatedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                style={{ backgroundSize: "200% 100%" }}
              />
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showBaseSpirits && !showFeedbackForm && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                {/* 回退按钮 + 步骤指示器 */}
                <div className="flex items-center justify-center gap-4">
                  {canGoBack && (
                    <motion.button
                      onClick={handleGoBack}
                      className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
                      whileHover={{ x: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="text-sm font-medium">{t("questions.back")}</span>
                    </motion.button>
                  )}
                  <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 rounded-full glass-effect border border-primary/20">
                    <span className="text-primary font-bold text-sm tracking-wider">
                      {t("questions.step")} {currentStep} / {totalSteps}
                    </span>
                  </div>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold font-playfair leading-tight tracking-tight">
                  <GradientText>
                    {questions[currentQuestion - 1]?.title}
                  </GradientText>
                </h2>
              </div>

              <div
                className={`grid gap-4 mx-auto ${
                  questions[currentQuestion - 1]?.options.length === 2
                    ? "grid-cols-1 sm:grid-cols-2 max-w-xl"
                    : questions[currentQuestion - 1]?.options.length === 3
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-4xl"
                }`}
              >
                {questions[currentQuestion - 1]?.options.map(
                  (option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -10, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`cursor-pointer h-full group relative overflow-hidden glass-effect rounded-3xl p-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 ${
                          selectedOption === option.value
                            ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.2)] scale-[1.01]"
                            : "border-transparent"
                        }`}
                        onClick={() =>
                          handleAnswer(currentQuestion, option.value)
                        }
                      >
                        {/* Micro-interaction Ripple */}
                        {selectedOption === option.value && (
                          <motion.div
                            className="absolute inset-0 bg-primary/10 z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}

                        <div className="relative h-full rounded-xl overflow-hidden bg-black/20 flex flex-col p-4">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          <div className="aspect-square relative overflow-hidden rounded-lg mb-3 bg-black/20 shadow-inner group-hover:shadow-lg transition-shadow duration-500">
                            <Image
                              src={
                                option.image ||
                                "/placeholder.svg?height=400&width=400&query=cocktail"
                              }
                              alt={option.label}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
                            />
                          </div>

                          <div className="relative z-10 mt-auto">
                            <h3 className="font-bold text-foreground mb-1 font-playfair group-hover:text-primary transition-colors duration-300 text-lg">
                              {option.label}
                            </h3>
                            {option.description && (
                              <p className="text-muted-foreground leading-relaxed font-source-sans text-sm">
                                {option.description}
                              </p>
                            )}
                          </div>
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
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                {/* 回退按钮 + 步骤指示器 */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
                    whileHover={{ x: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">{t("questions.back")}</span>
                  </motion.button>
                  <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 rounded-full glass-effect border border-primary/20">
                    <span className="text-primary font-bold text-sm tracking-wider">
                      {t("questions.step")} {currentStep} / {totalSteps}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold font-playfair leading-tight tracking-tight">
                    <GradientText>
                      {t("questions.base_spirits.title")}
                    </GradientText>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-source-sans">
                    {t("questions.base_spirits.description")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-6xl mx-auto">
                {baseSpiritsOptions.map((spirit, index) => (
                  <motion.div
                    key={spirit.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div
                      className={`cursor-pointer transition-all duration-300 relative overflow-hidden rounded-xl p-3 text-center h-full group border ${
                        baseSpirits.includes(spirit.value)
                          ? "glass-effect border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.2)] bg-primary/5"
                          : "glass-effect border-transparent hover:border-primary/20 hover:bg-white/5"
                      }`}
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
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md z-20">
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </motion.svg>
                        </div>
                      )}

                      <div
                        className={`absolute inset-0 bg-primary/10 transition-opacity duration-300 ${baseSpirits.includes(spirit.value) ? "opacity-100" : "opacity-0"}`}
                      />

                      <div className="aspect-square relative overflow-hidden rounded-lg mb-3 bg-black/20 group-hover:shadow-inner transition-shadow">
                        <Image
                          src={spirit.image || "/placeholder.svg"}
                          alt={spirit.label}
                          fill
                          sizes="(max-width: 768px) 33vw, 16vw"
                          className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        />
                      </div>
                      <h3
                        className={`text-sm font-medium transition-colors duration-300 ${baseSpirits.includes(spirit.value) ? "text-primary" : "text-foreground"}`}
                      >
                        {spirit.label}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <Button
                  onClick={handleBaseSpiritsDone}
                  size="lg"
                  variant="primary"
                >
                  {t("questions.continue")}
                </Button>
              </div>
            </motion.div>
          )}

          {showFeedbackForm && (
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              className="space-y-10 max-w-3xl mx-auto"
            >
              <div className="text-center space-y-6">
                {/* 回退按钮 + 步骤指示器 */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-white/10 hover:border-primary/30 hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
                    whileHover={{ x: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm font-medium">{t("questions.back")}</span>
                  </motion.button>
                  <div className="inline-flex items-center justify-center gap-3 px-4 py-1.5 rounded-full glass-effect border border-primary/20">
                    <span className="text-primary font-bold text-sm tracking-wider">
                      {t("questions.finalStep")}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold font-playfair leading-tight tracking-tight">
                    <GradientText>{t("questions.feedback.title")}</GradientText>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed font-source-sans">
                    {t("questions.feedback.description")}
                  </p>
                </div>
              </div>

              <div className="glass-effect rounded-3xl p-1">
                <div className="bg-black/20 rounded-2xl p-6">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={t("questions.feedback.placeholder")}
                    className="w-full h-40 bg-transparent border border-white/10 rounded-xl p-4 text-lg text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 resize-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                {/* 主 CTA: 获取推荐 - 更大更突出 */}
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={isGenerating}
                  variant="primary"
                  size="xl"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {isGenerating
                    ? t("questions.generating")
                    : t("questions.get_recommendation")}
                </Button>
                {/* 次要: 跳过反馈直接获取 */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFeedback("");
                    handleFeedbackSubmit();
                  }}
                  size="md"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isGenerating}
                >
                  {t("questions.skipFeedback")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Reset Button */}
        <div className="fixed bottom-8 left-8 z-50">
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-3 px-5 py-3 glass-effect rounded-full hover:border-destructive/50 transition-colors duration-300"
          >
            <div className="p-2 rounded-full bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
              <svg
                className="w-4 h-4 text-destructive"
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
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {t("questions.reset")}
            </span>
          </motion.button>
        </div>
      </Container>
    </div>
  );
});

Questions.displayName = "Questions";

export default Questions;
