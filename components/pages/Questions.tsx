"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, cardVariants } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { TerminalLoader } from "@/components/ui/terminal-loader";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useSmartLoading } from "@/components/animations/SmartLoadingSystem";
import { useCocktailForm } from "@/context/CocktailFormContext";
import { useCocktailResult } from "@/context/CocktailResultContext";
import { useLanguage } from "@/context/LanguageContext";
import { appLogger, safeLogger } from "@/utils/logger";
import { withTimeout } from "@/utils/withTimeout";

const SmartLoadingSystem = dynamic(
  () => import("@/components/animations/SmartLoadingSystem"),
  { ssr: false },
);

const QUESTIONS = ["1", "2", "3"] as const;

const Questions = memo(function Questions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, getPathWithLanguage } = useLanguage();
  const {
    answers,
    userFeedback,
    baseSpirits,
    isHydrated,
    saveAnswer,
    removeAnswer,
    saveFeedback,
    toggleBaseSpirit,
    resetForm,
  } = useCocktailForm();
  const {
    submitRequest,
    resetResult,
    recommendationMeta,
  } = useCocktailResult();
  const { toast } = useToast();

  const [feedback, setFeedback] = useState(userFeedback);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [generatedRecommendationId, setGeneratedRecommendationId] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<{
    questionId: string;
    option: string;
    message: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const resetHandledRef = useRef(false);
  const shouldNavigateOnCompleteRef = useRef(false);
  const retrySubmitRef = useRef<(() => Promise<void>) | null>(null);
  const feedbackDescriptionId = "questions-feedback-description";
  const feedbackErrorId = "questions-feedback-error";

  const [loadingMessage, setLoadingMessage] = useState(() =>
    t("loading.rotating.1"),
  );

  const {
    isLoading: isGenerating,
    progress,
    startLoading: startGeneration,
    updateProgress,
    completeLoading: completeGeneration,
  } = useSmartLoading();

  useEffect(() => {
    setFeedback(userFeedback);
  }, [userFeedback]);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const messages = [
      t("loading.rotating.1"),
      t("loading.rotating.2"),
      t("loading.rotating.3"),
      t("loading.rotating.4"),
      t("loading.rotating.5"),
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessage(messages[index]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating, t]);

  useEffect(() => {
    if (searchParams?.get("new") !== "true" || resetHandledRef.current) {
      return;
    }

    resetHandledRef.current = true;
    void (async () => {
      await resetForm();
      await resetResult();
      setFeedback("");
      router.replace(getPathWithLanguage("/questions"));
    })();
  }, [getPathWithLanguage, resetForm, resetResult, router, searchParams]);

  const questions = useMemo(
    () => [
      {
        id: "1",
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
        id: "2",
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
        id: "3",
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
    ],
    [t],
  );

  const baseSpiritsOptions = useMemo(
    () => [
      { value: "gin", label: t("spirits.gin"), image: "/gin.png" },
      { value: "rum", label: t("spirits.rum"), image: "/rum.png" },
      { value: "vodka", label: t("spirits.vodka"), image: "/vodka.png" },
      { value: "whiskey", label: t("spirits.whiskey"), image: "/whiskey.png" },
      { value: "tequila", label: t("spirits.tequila"), image: "/tequila.png" },
      { value: "brandy", label: t("spirits.brandy"), image: "/brandy.png" },
    ],
    [t],
  );

  const nextQuestionIndex = QUESTIONS.findIndex((id) => !answers[id]);
  const isFinalStep = nextQuestionIndex === -1;
  const currentQuestion = isFinalStep ? null : questions[nextQuestionIndex];
  const totalSteps = questions.length + 1;
  const currentStep = isFinalStep ? totalSteps : nextQuestionIndex + 1;
  const calculatedProgress = (currentStep / totalSteps) * 100;

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, action: () => void) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    },
    [],
  );

  const handleAnswer = useCallback(
    async (questionId: string, option: string) => {
      if (selectedOption) {
        return;
      }

      safeLogger.userInteraction("select questionnaire option");
      setSelectedOption(option);
      setAnswerError(null);

      await new Promise((resolve) => setTimeout(resolve, 350));

      try {
        await saveAnswer(questionId, option);
        setSelectedOption(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("error.saveAnswers");
        appLogger.error("Answer progress save failed", message);
        setSelectedOption(null);
        setAnswerError({ questionId, option, message });
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: message,
          action: (
            <ToastAction
              altText={t("common.tryAgain")}
              onClick={() => {
                setAnswerError(null);
                setSelectedOption(null);
              }}
            >
              {t("common.tryAgain")}
            </ToastAction>
          ),
        });
      }
    },
    [saveAnswer, selectedOption, t, toast],
  );

  const handleGoBack = useCallback(async () => {
    if (isFinalStep) {
      await removeAnswer(QUESTIONS[QUESTIONS.length - 1]);
      return;
    }

    if (nextQuestionIndex <= 0) {
      router.push(getPathWithLanguage("/"));
      return;
    }

    await removeAnswer(QUESTIONS[nextQuestionIndex - 1]);
  }, [
    getPathWithLanguage,
    isFinalStep,
    nextQuestionIndex,
    removeAnswer,
    router,
  ]);

  const handleReset = useCallback(async () => {
    shouldNavigateOnCompleteRef.current = false;
    await resetForm();
    await resetResult();
    setFeedback("");
    setAnswerError(null);
    setSubmitError(null);
    setGeneratedRecommendationId(null);
    completeGeneration();
  }, [completeGeneration, resetForm, resetResult]);

  const navigateToRecommendation = useCallback(() => {
    if (!shouldNavigateOnCompleteRef.current) {
      return;
    }

    shouldNavigateOnCompleteRef.current = false;
    const recommendationId =
      generatedRecommendationId || recommendationMeta?.recommendationId || null;
    const path = recommendationId
      ? getPathWithLanguage(
          `/cocktail/recommendation?id=${encodeURIComponent(
            recommendationId,
          )}`,
        )
      : getPathWithLanguage("/cocktail/recommendation");
    router.push(path);
  }, [generatedRecommendationId, getPathWithLanguage, recommendationMeta?.recommendationId, router]);

  const handleFeedbackSubmit = useCallback(async () => {
    safeLogger.userInteraction("submit questionnaire");
    shouldNavigateOnCompleteRef.current = false;
    startGeneration();
    setSubmitError(null);

    try {
      await saveFeedback(feedback.trim());
      updateProgress(20);
      const cocktail = await withTimeout(submitRequest(), 120000, "Request timed out");
      if (cocktail?.id) {
        setGeneratedRecommendationId(String(cocktail.id));
      }
      shouldNavigateOnCompleteRef.current = true;
      updateProgress(70);
      setTimeout(() => {
        completeGeneration();
      }, 800);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("error.generationFailed");
      shouldNavigateOnCompleteRef.current = false;
      setSubmitError(message);
      appLogger.error("Questionnaire submission failed", message);
      completeGeneration();
      toast({
        variant: "destructive",
        title: t("error.submitFailed"),
        description: message,
        action: (
          <ToastAction
            altText={t("common.tryAgain")}
            onClick={() => {
              void retrySubmitRef.current?.();
            }}
          >
            {t("common.tryAgain")}
          </ToastAction>
        ),
      });
    }
  }, [
    completeGeneration,
    feedback,
    saveFeedback,
    startGeneration,
    submitRequest,
    t,
    toast,
    updateProgress,
  ]);

  useEffect(() => {
    retrySubmitRef.current = handleFeedbackSubmit;
  }, [handleFeedbackSubmit]);

  if (isGenerating) {
    return (
      <SmartLoadingSystem
        isShowing={isGenerating}
        actualProgress={progress}
        type="cocktail-mixing"
        message={loadingMessage}
        estimatedDuration={3000}
        onComplete={navigateToRecommendation}
      />
    );
  }

  // 等存储读完再决定显示哪一题。
  //
  // 题号是从 answers 算出来的，而 answers 在水合完成前是 {}，所以会先渲染第一题、
  // 落地后再跳到正确的一题。浏览器采样测到的间隔：631ms 显示第一题，1033ms 才纠正
  // 到第三题 —— 用户有 400ms 看到自己已经答过的题目被重新问一遍。
  //
  // 门禁不能用 isDataLoading：它初始是 false（加载 effect 还没跑），首帧就放行，
  // 挡不住这段空窗。isHydrated 看的是 phase 有没有结论。
  if (!isHydrated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <Container className="relative z-10 py-16 md:py-24">
          <div
            className="mx-auto flex max-w-3xl items-center justify-center py-24"
            role="status"
            aria-live="polite"
          >
            {/* common.loading 而非 loading.default —— 后者是「正在调制中」，
                这里只是在读已保存的答案，读屏用户会以为在生成配方。 */}
            <span className="sr-only">{t("common.loading")}</span>
            <TerminalLoader rows={4} cols={18} />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Container className="relative z-10 py-16 md:py-24">
        <Card variant="subtle" className="mx-auto mb-12 max-w-3xl px-4 py-5 md:mb-16 md:px-6">
          <div className="mb-4 flex items-center justify-between gap-4 px-1">
            <span className="text-sm font-bold font-mono uppercase tracking-[0.2em] text-secondary">
              {t("questions.progress")}
            </span>
            <span className="border border-primary/35 bg-black/35 px-3 py-1 text-sm font-bold font-mono tracking-[0.18em] text-primary shadow-[0_12px_24px_rgba(3,0,9,0.18)]">
              {Math.round(calculatedProgress)}%
            </span>
          </div>

          <Progress
            value={calculatedProgress}
            aria-label={t("questions.progress")}
          />
        </Card>

        <AnimatePresence mode="wait">
          {!isFinalStep && currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-10 md:space-y-12"
            >
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => void handleGoBack()}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  >
                    {t("questions.back")}
                  </Button>
                  <Badge variant="secondary" className="px-4 py-1.5 font-bold tracking-[0.18em]">
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </Badge>
                </div>

                <h2 className="text-center text-3xl font-black font-heading uppercase leading-tight tracking-[0.12em] md:text-5xl">
                  <GradientText>{currentQuestion.title}</GradientText>
                </h2>

                {answerError?.questionId === currentQuestion.id ? (
                  <Alert variant="destructive" className="mx-auto mt-2 max-w-2xl p-4 text-left">
                    <AlertDescription className="font-bold text-white">
                      {answerError.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <div
                className={`mx-auto grid min-h-[26rem] content-start gap-4 ${
                  currentQuestion.options.length === 2
                    ? "grid-cols-1 sm:grid-cols-2 max-w-xl"
                    : currentQuestion.options.length === 3
                      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-3xl"
                      : "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 max-w-4xl"
                }`}
              >
                {currentQuestion.options.map((option, index) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full"
                  >
                    <button
                      type="button"
                      className={cn(
                        cardVariants({ variant: "panel" }),
                        "h-full min-h-[192px] w-full p-1 text-left transition-all duration-500 hover:border-secondary hover:shadow-[0_24px_40px_rgba(3,0,9,0.26),0_0_18px_rgba(93,246,255,0.18)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/50 active:scale-[0.98]",
                        selectedOption === option.value
                          ? "scale-[1.02] border-secondary shadow-[0_26px_44px_rgba(3,0,9,0.3),0_0_20px_rgba(93,246,255,0.22)]"
                          : "border-primary/35",
                      )}
                      onClick={() => void handleAnswer(currentQuestion.id, option.value)}
                      onKeyDown={(event) =>
                        handleCardKeyDown(event, () => {
                          void handleAnswer(currentQuestion.id, option.value);
                        })
                      }
                      aria-pressed={selectedOption === option.value}
                      disabled={selectedOption !== null}
                    >
                      <div className="relative flex h-full flex-col overflow-hidden bg-black/50 p-4">
                        <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-size-[100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] pointer-events-none mix-blend-overlay z-0" />

                        <div className="relative z-10 mb-3 aspect-square overflow-hidden border border-primary/30 bg-black/75 transition-colors duration-500 group-hover:border-secondary">
                        <Image
                          src={option.image}
                          alt={option.label}
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover opacity-88 transition-transform duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                        />
                        </div>

                        <div className="relative z-10 mt-auto border-l-2 border-primary/60 bg-black/70 p-3 transition-colors group-hover:border-secondary">
                          <h3 className="mb-1 text-lg font-bold font-heading uppercase tracking-[0.16em] text-primary transition-colors duration-300 group-hover:text-secondary sm:text-xl">
                            {option.label}
                          </h3>
                          <p className="text-xs font-mono leading-relaxed text-foreground/88 sm:text-sm">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {isFinalStep && (
            <motion.div
              key="final-step"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
              className="space-y-10 max-w-5xl mx-auto"
            >
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => void handleGoBack()}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  >
                    {t("questions.back")}
                  </Button>
                  <Badge variant="secondary" className="px-4 py-1.5 font-bold tracking-[0.18em]">
                    {t("questions.step")} {currentStep} / {totalSteps}
                  </Badge>
                </div>

                <h2 className="text-center text-3xl font-black font-heading uppercase leading-tight tracking-[0.12em] md:text-5xl">
                  <GradientText>{t("questions.finalStep")}</GradientText>
                </h2>
                <p className="mx-auto max-w-2xl text-base font-mono leading-relaxed text-foreground/88 md:text-lg">
                  {t("questions.base_spirits.description")}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                {baseSpiritsOptions.map((spirit, index) => (
                  <motion.div
                    key={spirit.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="button"
                      className={`group relative h-full w-full overflow-hidden border p-2 text-center transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/50 active:scale-[0.96] ${
                        baseSpirits.includes(spirit.value)
                          ? "border-secondary bg-secondary/16 shadow-[0_20px_34px_rgba(3,0,9,0.24),0_0_16px_rgba(93,246,255,0.18)]"
                          : "border-primary/28 bg-black/35 hover:border-secondary hover:bg-black/60 hover:shadow-[0_18px_32px_rgba(3,0,9,0.2)]"
                      }`}
                      onClick={() => void toggleBaseSpirit(spirit.value)}
                      onKeyDown={(event) =>
                        handleCardKeyDown(event, () => {
                          void toggleBaseSpirit(spirit.value);
                        })
                      }
                      aria-pressed={baseSpirits.includes(spirit.value)}
                    >
                      <div className="relative mb-2 aspect-square overflow-hidden border border-white/10 bg-black/40 transition-shadow">
                        <Image
                          src={spirit.image}
                          alt={spirit.label}
                          fill
                          sizes="(max-width: 768px) 33vw, 16vw"
                          className="object-cover opacity-88 group-hover:opacity-100 group-hover:scale-[1.04] transition-transform duration-500"
                        />
                      </div>
                      <h3
                        className={`text-xs md:text-sm font-bold font-mono uppercase tracking-wider transition-colors duration-300 ${
                          baseSpirits.includes(spirit.value)
                            ? "text-secondary"
                            : "text-foreground group-hover:text-secondary"
                        }`}
                      >
                        {spirit.label}
                      </h3>
                    </button>
                  </motion.div>
                ))}
              </div>

              <Card className="flex flex-col gap-4 p-6 shadow-[0_22px_42px_rgba(3,0,9,0.24)]">
                <div className="space-y-2">
                  <h3 className="text-xl font-heading font-bold uppercase tracking-[0.16em] text-primary">
                    {t("questions.feedback.title")}
                  </h3>
                  <p
                    id={feedbackDescriptionId}
                    className="text-sm font-mono text-foreground/80"
                  >
                    {t("questions.feedback.description")}
                  </p>
                </div>
                <label htmlFor="questions-feedback" className="sr-only">
                  {t("questions.feedback.title")}
                </label>
                <Textarea
                  id="questions-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder={t("questions.feedback.placeholder")}
                  aria-describedby={
                    submitError
                      ? `${feedbackDescriptionId} ${feedbackErrorId}`
                      : feedbackDescriptionId
                  }
                  aria-invalid={submitError ? "true" : "false"}
                />
                {submitError ? (
                  <Alert variant="destructive" id={feedbackErrorId} className="border-2 bg-black/60 p-4">
                    <AlertDescription className="text-white">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                ) : null}
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <Button onClick={() => void handleReset()} variant="outline" size="lg">
                    {t("questions.reset")}
                  </Button>
                  <Button onClick={() => void handleFeedbackSubmit()} variant="primary" size="lg">
                    {t("questions.submit")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
});

Questions.displayName = "Questions";

export default Questions;
