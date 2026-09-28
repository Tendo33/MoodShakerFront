"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TerminalLoader } from "@/components/ui/terminal-loader";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useSmartLoading } from "@/components/animations/SmartLoadingSystem";
import { useCocktailForm } from "@/context/CocktailFormContext";
import { useCocktailResult } from "@/context/CocktailResultContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { enterDuration, enterEase } from "@/utils/animation-utils";
import { appLogger, safeLogger } from "@/utils/logger";
import { withTimeout } from "@/utils/withTimeout";

const SmartLoadingSystem = dynamic(
  () => import("@/components/animations/SmartLoadingSystem"),
  { ssr: false },
);

const QUESTIONS = ["1", "2", "3"] as const;
const MANY_OPTIONS = 4;

type QuestionnaireChoice = {
  value: string;
  label: string;
  image?: string;
  description?: string;
};

const Questions = memo(function Questions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, getPathWithLanguage } = useLanguage();
  const reduceMotion = useReducedMotion() === true;
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
      <div className="flex min-h-[calc(100vh-5rem)] w-full min-w-0 flex-col px-4 py-8 md:px-8">
        <QuestionBreadcrumb />
        <div
          className="flex flex-1 items-center justify-center"
          role="status"
          aria-live="polite"
        >
          {/* common.loading 而非 loading.default —— 后者是「正在调制中」，
              这里只是在读已保存的答案，读屏用户会以为在生成配方。 */}
          <span className="sr-only">{t("common.loading")}</span>
          <TerminalLoader rows={4} cols={18} />
        </div>
      </div>
    );
  }

  const panel = isFinalStep
    ? {
        id: "final",
        title: t("questions.finalStep"),
        hint: t("questions.base_spirits.description"),
        options: baseSpiritsOptions,
      }
    : currentQuestion
      ? {
          id: currentQuestion.id,
          title: currentQuestion.title,
          hint: undefined,
          options: currentQuestion.options,
        }
      : null;

  if (!panel) {
    return null;
  }

  const choiceLocked = !isFinalStep && selectedOption !== null;
  const actionButtonClass = "max-w-full whitespace-normal sm:whitespace-normal";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={panel.id}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: reduceMotion ? 0 : enterDuration,
          ease: enterEase,
        }}
        className="grid min-h-[calc(100vh-5rem)] w-full min-w-0 grid-cols-1 items-start md:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] md:items-stretch"
      >
        <div className="flex min-w-0 flex-col justify-center gap-6 px-4 py-10 md:px-8 lg:px-12">
          <QuestionBreadcrumb />
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-foreground/55">
            {t("questions.step")} {currentStep} / {totalSteps}
          </p>
          <div className="flex flex-col gap-4">
            <h1 className="text-safe-wrap font-heading text-[clamp(1.75rem,4vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-[0.08em] text-foreground">
              {panel.title}
            </h1>
            {panel.hint ? (
              <p className="text-safe-wrap max-w-md font-mono text-sm leading-relaxed text-foreground/80">
                {panel.hint}
              </p>
            ) : null}
          </div>

          {!isFinalStep && answerError?.questionId === panel.id ? (
            <Alert variant="destructive" className="p-4">
              <AlertDescription className="font-mono text-foreground">
                {answerError.message}
              </AlertDescription>
            </Alert>
          ) : null}

          {isFinalStep ? (
            <div className="flex min-w-0 flex-col gap-3">
              <h2 className="text-safe-wrap font-heading text-lg font-bold uppercase tracking-[0.12em] text-foreground">
                {t("questions.feedback.title")}
              </h2>
              <p
                id={feedbackDescriptionId}
                className="text-safe-wrap font-mono text-sm leading-relaxed text-foreground/80"
              >
                {t("questions.feedback.description")}
              </p>
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
                className="min-h-28"
              />
              {submitError ? (
                <Alert variant="destructive" id={feedbackErrorId} className="p-4">
                  <AlertDescription className="font-mono text-foreground">
                    {submitError}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-[0.16em]">
              <span className="text-foreground/55">{t("questions.progress")}</span>
              <span className="text-primary">{Math.round(calculatedProgress)}%</span>
            </div>
            <Progress
              value={calculatedProgress}
              aria-label={t("questions.progress")}
            />
          </div>

          <div className="flex flex-col items-start gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => void handleGoBack()}
              icon={<ChevronLeft className="h-4 w-4" />}
              className={actionButtonClass}
            >
              {t("questions.back")}
            </Button>
            {isFinalStep ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => void handleReset()}
                  className={actionButtonClass}
                >
                  {t("questions.reset")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => void handleFeedbackSubmit()}
                  className={actionButtonClass}
                >
                  {t("questions.submit")}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 bg-black">
          <ChoiceGrid
            options={panel.options}
            scroll={panel.options.length >= MANY_OPTIONS}
            locked={choiceLocked}
            isSelected={(value) =>
              isFinalStep
                ? baseSpirits.includes(value)
                : selectedOption === value
            }
            onSelect={(value) => {
              if (isFinalStep) {
                void toggleBaseSpirit(value);
                return;
              }
              void handleAnswer(panel.id, value);
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

function QuestionBreadcrumb() {
  const { t, getPathWithLanguage } = useLanguage();

  return (
    <Breadcrumb>
      <BreadcrumbList className="font-mono text-xs uppercase tracking-[0.16em]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={getPathWithLanguage("/")} className="focus-ring">
              {t("nav.home")}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-safe-wrap">
            {t("nav.questions")}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function ChoiceGrid({
  options,
  scroll,
  locked,
  isSelected,
  onSelect,
}: {
  options: QuestionnaireChoice[];
  scroll: boolean;
  locked: boolean;
  isSelected: (value: string) => boolean;
  onSelect: (value: string) => void;
}) {
  const grid = (
    <div className="grid w-full min-w-0 grid-cols-2 gap-2">
      {options.map((option) => (
        <ChoiceTile
          key={option.value}
          option={option}
          selected={isSelected(option.value)}
          disabled={locked}
          onSelect={() => onSelect(option.value)}
        />
      ))}
    </div>
  );

  if (scroll) {
    return (
      <ScrollArea className="h-[70vh] w-full md:h-[calc(100vh-5rem)]">
        <div className="p-2 md:p-3">{grid}</div>
      </ScrollArea>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 items-center">
      <div className="w-full min-w-0 p-2 md:p-3">{grid}</div>
    </div>
  );
}

function ChoiceTile({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: QuestionnaireChoice;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const [ready, setReady] = useState(false);
  const dimmed = disabled && !selected;

  return (
    <button
      type="button"
      className={cn(
        "focus-ring group relative block w-full min-w-0 overflow-hidden border-2 text-left transition-colors",
        selected
          ? "border-primary bg-primary/40"
          : "border-white/15 bg-[#080212] hover:border-secondary",
        dimmed && "opacity-50 grayscale",
      )}
      onClick={onSelect}
      aria-pressed={selected}
      disabled={disabled}
    >
      <AspectRatio ratio={1} className="overflow-hidden bg-[#080212]">
        {option.image ? (
          <>
            {ready ? null : <Skeleton className="absolute inset-0 z-[1] size-full" />}
            <Image
              src={option.image}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 30vw"
              className={cn("object-cover", ready ? "opacity-100" : "opacity-0")}
              onLoad={() => setReady(true)}
              onError={() => setReady(true)}
            />
          </>
        ) : (
          <span className="absolute inset-0 bg-[#120322]" />
        )}
        <span
          aria-hidden
          className={cn(
            "absolute inset-0",
            selected ? "bg-primary/40" : "bg-transparent",
          )}
        />
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080212] via-[#080212]/85 to-transparent px-3 pt-10 pb-3">
          <span className="text-safe-wrap block font-heading text-sm font-bold uppercase tracking-[0.12em] text-foreground md:text-base">
            {option.label}
          </span>
          {option.description ? (
            <span className="text-safe-wrap mt-1 line-clamp-2 font-mono text-[0.7rem] leading-snug text-foreground/80 md:text-xs">
              {option.description}
            </span>
          ) : null}
          <span className="mt-2 block h-px bg-primary" />
        </span>
      </AspectRatio>
    </button>
  );
}

Questions.displayName = "Questions";

export default Questions;
