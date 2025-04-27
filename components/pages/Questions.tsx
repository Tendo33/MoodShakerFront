"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCocktail } from "@/context/CocktailContext";
import { useLanguage } from "@/context/LanguageContext";
import React from "react";

// 优化：合并图片对象
const images = {
  // 问题选项图片
  classic: "/polished-cocktail-shaker.png",
  custom: "/tropical-fusion.png",
  low: "/tropical-splash.png",
  medium: "/vibrant-citrus-harmony.png",
  high: "/dark-stormy-cocktail.png",
  any: "/vibrant-cocktail-collection.png",
  easy: "/refreshing-cocktail.png",
  hard: "/intricate-mixology.png",

  // 基酒图片
  gin: "/classic-gin-still-life.png",
  rum: "/weathered-rum-bottle.png",
  vodka: "/frosted-vodka.png",
  whiskey: "/amber-glass-still-life.png",
  tequila: "/aged-agave-spirit.png",
  brandy: "/amber-glass-still-life.png",
};

export default function Questions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { t, locale, getPathWithLanguage } = useLanguage(); // Move the hook call to the top level
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

  // Add local loading state instead of using setIsLoading from context
  const [localLoading, setLocalLoading] = useState(false);
  const [visibleQuestions, setVisibleQuestions] = useState<number[]>([1]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showBaseSpirits, setShowBaseSpirits] = useState(false);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const baseSpiritsRef = useRef<HTMLDivElement | null>(null);
  const feedbackFormRef = useRef<HTMLDivElement | null>(null);
  const [localUserFeedback, setLocalUserFeedback] = useState("");
  const [animateProgress, setAnimateProgress] = useState(false);
  const initialSetupDone = useRef(false);

  // Add state to track the currently active question for better scrolling
  const [activeQuestionId, setActiveQuestionId] = useState(1);
  // Add ref for the container to calculate scroll position
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用useMemo优化计算属性
  const themeClasses = useMemo(
    () =>
      theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900",
    [theme],
  );
  const textColorClass = useMemo(
    () => (theme === "dark" ? "text-white" : "text-gray-900"),
    [theme],
  );
  const cardClasses = useMemo(
    () =>
      theme === "dark"
        ? "bg-gray-800/80 text-white"
        : "bg-white/90 text-gray-900",
    [theme],
  );
  const borderClasses = useMemo(
    () => (theme === "dark" ? "border-gray-700" : "border-gray-200"),
    [theme],
  );

  // 优化：简化问题数据结构
  const questions = useMemo(
    () => [
      {
        id: 1,
        title:
          locale === "en"
            ? "How would you like to drink today?"
            : "今天想怎么喝？",
        description:
          locale === "en"
            ? "Choose your preferred drinking style"
            : "选择您喜欢的饮用方式",
        options: [
          {
            id: "classic",
            text: locale === "en" ? "Choose from classics" : "从经典中选择",
            image: images.classic,
          },
          {
            id: "custom",
            text: locale === "en" ? "Custom mix" : "自己调配",
            image: images.custom,
          },
        ],
      },
      {
        id: 2,
        title:
          locale === "en" ? "Preferred alcohol level?" : "喜欢什么酒精浓度？",
        description:
          locale === "en"
            ? "Select your preferred alcohol strength"
            : "选择您偏好的酒精浓度",
        options: [
          {
            id: "low",
            text: locale === "en" ? "Low" : "低酒精度",
            image: images.low,
          },
          {
            id: "medium",
            text: locale === "en" ? "Medium" : "中等酒精度",
            image: images.medium,
          },
          {
            id: "high",
            text: locale === "en" ? "High" : "高酒精度",
            image: images.high,
          },
          {
            id: "any",
            text: locale === "en" ? "Any" : "无所谓",
            image: images.any,
          },
        ],
      },
      {
        id: 3,
        title: locale === "en" ? "Preparation difficulty" : "制作难度偏好",
        description:
          locale === "en"
            ? "Select your acceptable preparation difficulty"
            : "选择您能接受的制作难度",
        options: [
          {
            id: "easy",
            text: locale === "en" ? "Easy" : "简单",
            image: images.easy,
          },
          {
            id: "medium",
            text: locale === "en" ? "Medium" : "中等",
            image: images.medium,
          },
          {
            id: "hard",
            text: locale === "en" ? "Complex" : "复杂",
            image: images.hard,
          },
          {
            id: "any",
            text: locale === "en" ? "Any" : "无所谓",
            image: images.any,
          },
        ],
      },
    ],
    [locale],
  );

  // 优化：简化基酒选项
  const baseSpiritsOptions = useMemo(
    () => [
      {
        id: "all",
        name: locale === "en" ? "All" : "全部",
        description: locale === "en" ? "Use all base spirits" : "使用所有基酒",
      },
      {
        id: "gin",
        name: locale === "en" ? "Gin" : "金酒",
        description: "Gin",
        image: images.gin,
      },
      {
        id: "rum",
        name: locale === "en" ? "Rum" : "朗姆酒",
        description: "Rum",
        image: images.rum,
      },
      {
        id: "vodka",
        name: locale === "en" ? "Vodka" : "伏特加",
        description: "Vodka",
        image: images.vodka,
      },
      {
        id: "whiskey",
        name: locale === "en" ? "Whiskey" : "威士忌",
        description: "Whiskey",
        image: images.whiskey,
      },
      {
        id: "tequila",
        name: locale === "en" ? "Tequila" : "龙舌兰",
        description: "Tequila",
        image: images.tequila,
      },
      {
        id: "brandy",
        name: locale === "en" ? "Brandy" : "白兰地",
        description: "Brandy",
        image: images.brandy,
      },
    ],
    [locale],
  );

  // Improved scroll function with offset calculation and better timing
  const scrollToElement = useCallback(
    (element: HTMLElement | null, offset = 20) => {
      if (!element) return;

      // Calculate the element's position relative to the viewport
      const rect = element.getBoundingClientRect();

      // Calculate the scroll position that would place the element at the top with offset
      const scrollPosition = window.pageYOffset + rect.top - offset;

      // Animate the scroll with a smoother easing
      window.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    },
    [],
  );

  const handleOptionSelect = useCallback(
    (questionId: number, optionId: string) => {
      // 如果已经选择了相同的选项，不做任何操作
      if (answers[questionId] === optionId) return;

      saveAnswer(questionId.toString(), optionId);
      setAnimateProgress(true);
      setTimeout(() => setAnimateProgress(false), 1000);

      // 显示下一个问题或基酒选择部分
      const nextQuestionId = questionId + 1;
      if (nextQuestionId <= questions.length) {
        setActiveQuestionId(nextQuestionId);

        if (!visibleQuestions.includes(nextQuestionId)) {
          setVisibleQuestions((prev) => [...prev, nextQuestionId]);

          // Use a longer timeout to ensure DOM updates are complete
          setTimeout(() => {
            const nextElement = questionRefs.current[nextQuestionId];
            scrollToElement(nextElement, 80); // Use a larger offset for better visibility
          }, 300);
        } else {
          // If question is already visible, just scroll to it
          setTimeout(() => {
            const nextElement = questionRefs.current[nextQuestionId];
            scrollToElement(nextElement, 80);
          }, 100);
        }
      } else if (questionId === questions.length && !showBaseSpirits) {
        setShowBaseSpirits(true);
        setTimeout(() => {
          scrollToElement(baseSpiritsRef.current, 80);
        }, 300);
      }
    },
    [
      answers,
      saveAnswer,
      visibleQuestions,
      questions.length,
      showBaseSpirits,
      scrollToElement,
    ],
  );

  // Fixed: Now using getPathWithLanguage from the top-level hook call
  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

  const handleBaseSpiritsToggle = useCallback(
    (spiritId: string) => {
      toggleBaseSpirit(spiritId, baseSpiritsOptions);

      // 选择基酒后自动显示反馈表单
      setShowFeedbackForm(true);

      // Scroll to feedback form after a short delay
      setTimeout(() => {
        scrollToElement(feedbackFormRef.current, 80);
      }, 300);
    },
    [toggleBaseSpirit, baseSpiritsOptions, scrollToElement],
  );

  // Update the handleSubmitFeedback function to use localLoading instead of setIsLoading
  const handleSubmitFeedback = useCallback(async () => {
    try {
      // Use local loading state
      setLocalLoading(true);

      // First save the feedback
      saveFeedback(localUserFeedback);

      // Then submit the request and wait for it to complete
      const result = await submitRequest();

      // Log the result for debugging
      console.log(
        "Request submitted successfully, navigating to recommendation page",
        {
          resultName: result.name,
        },
      );

      // Add a small delay to ensure all state updates are processed
      setTimeout(() => {
        router.push(getPathWithLanguage("/cocktail/recommendation"));
      }, 100);
    } catch (error) {
      console.error("Error submitting request:", error);
      // Reset loading state on error
      setLocalLoading(false);
    }
  }, [
    saveFeedback,
    submitRequest,
    router,
    localUserFeedback,
    getPathWithLanguage,
  ]);

  // 初始化函数 - 只在组件挂载时执行一次
  useEffect(() => {
    if (typeof window !== "undefined" && !initialSetupDone.current) {
      initialSetupDone.current = true;

      // 检查是否有 URL 参数指示新会话
      const isNewSession = searchParams?.get("new") === "true";

      // 如果是新会话，清除之前的数据
      if (isNewSession) {
        resetAll();
        setVisibleQuestions([1]);
        setShowBaseSpirits(false);
        setShowFeedbackForm(false);
        setActiveQuestionId(1);
        return;
      }

      // 加载保存的数据
      loadSavedData();

      // 设置本地反馈
      if (userFeedback) {
        setLocalUserFeedback(userFeedback);
      }

      // 根据已保存的答案设置可见问题
      const answeredQuestionIds = Object.keys(answers).map(Number);
      if (answeredQuestionIds.length > 0) {
        const maxAnsweredId = Math.max(...answeredQuestionIds);
        const nextVisible = [
          ...new Set([...answeredQuestionIds, maxAnsweredId + 1]),
        ].filter((id) => id <= questions.length);

        setVisibleQuestions(nextVisible);
        setActiveQuestionId(
          maxAnsweredId + 1 <= questions.length
            ? maxAnsweredId + 1
            : maxAnsweredId,
        );

        // 如果已回答最后一个问题，显示基酒选择部分
        if (maxAnsweredId >= questions.length) {
          setShowBaseSpirits(true);

          // 如果已选择基酒，显示反馈表单
          if (baseSpirits.length > 0) {
            setShowFeedbackForm(true);
          }
        }
      }
    }
  }, [
    searchParams,
    resetAll,
    loadSavedData,
    userFeedback,
    answers,
    baseSpirits,
    questions.length,
  ]);

  // 当 userFeedback 变化时更新本地状态
  useEffect(() => {
    if (userFeedback && localUserFeedback === "") {
      setLocalUserFeedback(userFeedback);
    }
  }, [userFeedback, localUserFeedback]);

  // Add effect to handle initial scroll position based on active question
  useEffect(() => {
    if (initialSetupDone.current && activeQuestionId > 0) {
      const activeElement = questionRefs.current[activeQuestionId];
      if (activeElement) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToElement(activeElement, 80);
        }, 300);
      }
    }
  }, [activeQuestionId, scrollToElement]);

  // 问题选项组件
  const QuestionOption = React.memo(
    ({
      option,
      isSelected,
      onSelect,
    }: {
      option: { id: string; text: string; image: string };
      isSelected: boolean;
      onSelect: () => void;
    }) => (
      <div className="transition-all duration-300">
        <div
          className={`cursor-pointer transition-all duration-300 hover:scale-105 border ${borderClasses} rounded-xl overflow-hidden ${cardClasses} ${
            isSelected ? "ring-2 ring-pink-500 shadow-lg" : ""
          }`}
          onClick={onSelect}
        >
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 rounded-full overflow-hidden bg-gradient-to-r from-amber-500/20 to-pink-500/20 p-2">
                <img
                  src={option.image || "/placeholder.svg"}
                  alt={option.text}
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
              <h3 className={`font-medium ${textColorClass}`}>{option.text}</h3>
            </div>
          </div>
        </div>
      </div>
    ),
  );
  QuestionOption.displayName = "QuestionOption";

  return (
    <div className={`container mx-auto px-4 py-8 ${themeClasses}`}>
      <div className="flex">
        {/* 垂直进度条 */}
        <div className="mr-6 sticky top-8 self-start">
          <button
            className="flex items-center px-4 py-2 rounded-full hover:bg-white/10 transition-colors mb-6"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("questions.back")}
          </button>

          <div className="h-64 w-2 bg-gray-700/30 rounded-full overflow-hidden relative">
            <div
              className={`w-full bg-gradient-to-b from-amber-500 to-pink-500 rounded-full transition-all duration-500 absolute top-0 ${
                animateProgress ? "animate-pulse" : ""
              }`}
              style={{ height: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="flex-1" ref={containerRef}>
          {/* 问题列表 */}
          <div className="space-y-24 max-w-3xl">
            {" "}
            {/* Increased spacing between questions */}
            {questions.map((question) => (
              <div
                key={question.id}
                ref={(el) => {
                  questionRefs.current[question.id] = el;
                }}
                className={`transition-all duration-500 scroll-mt-24 ${
                  visibleQuestions.includes(question.id)
                    ? "opacity-100 transform translate-y-0"
                    : "opacity-0 transform translate-y-8 h-0 overflow-hidden"
                }`}
                id={`question-${question.id}`}
              >
                <div
                  className={`mb-6 border ${borderClasses} rounded-xl overflow-hidden ${cardClasses}`}
                >
                  <div className="p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10 relative">
                    <div
                      className={
                        isQuestionAnswered(question.id.toString())
                          ? "absolute right-6 top-6"
                          : "hidden"
                      }
                    >
                      <div className="bg-gradient-to-r from-amber-500 to-pink-500 text-white rounded-full p-1.5 animate-pulse">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${textColorClass}`}>
                      {question.title}
                    </h3>
                    <p className="text-gray-400">{question.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="transition-all duration-300"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: visibleQuestions.includes(question.id)
                          ? "fadeIn 0.5s ease-in-out forwards"
                          : "none",
                        opacity: visibleQuestions.includes(question.id) ? 1 : 0,
                      }}
                    >
                      <div
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 border ${borderClasses} rounded-xl overflow-hidden ${cardClasses} ${
                          answers[question.id] === option.id
                            ? "ring-2 ring-pink-500 shadow-lg"
                            : ""
                        }`}
                        onClick={() =>
                          handleOptionSelect(question.id, option.id)
                        }
                      >
                        <div className="p-4">
                          <div className="flex flex-col items-center text-center">
                            <div className="mb-3 rounded-full overflow-hidden bg-gradient-to-r from-amber-500/20 to-pink-500/20 p-2">
                              <img
                                src={option.image || "/placeholder.svg"}
                                alt={option.text}
                                className="w-20 h-20 object-cover rounded-full"
                              />
                            </div>
                            <h3 className={`font-medium ${textColorClass}`}>
                              {option.text}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 基酒选择 */}
          <div
            ref={baseSpiritsRef}
            className={
              showBaseSpirits ? "mt-24 max-w-3xl scroll-mt-24" : "hidden"
            }
            id="base-spirits-section"
          >
            <div
              className={`border ${borderClasses} rounded-xl overflow-hidden ${cardClasses}`}
            >
              <div className="p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
                <h3 className={`text-xl font-bold mb-2 ${textColorClass}`}>
                  {t("questions.availableSpirits")}
                </h3>
                <p className="text-gray-400 mb-4">
                  {t("questions.selectSpirits")}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {baseSpiritsOptions.map((spirit) => (
                    <div
                      key={spirit.id}
                      className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border ${
                        baseSpirits.includes(spirit.id)
                          ? "border-pink-500 bg-gradient-to-br from-amber-500/10 to-pink-500/10"
                          : `${borderClasses} hover:border-white/30`
                      }`}
                      onClick={() => handleBaseSpiritsToggle(spirit.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {spirit.image ? (
                          <div className="flex items-center">
                            <img
                              src={spirit.image || "/placeholder.svg"}
                              alt={spirit.name}
                              className="w-8 h-8 object-cover rounded-full mr-2"
                            />
                            <span className={`font-medium ${textColorClass}`}>
                              {spirit.name}
                            </span>
                          </div>
                        ) : (
                          <span className={`font-medium ${textColorClass}`}>
                            {spirit.name}
                          </span>
                        )}
                        <div
                          className={
                            baseSpirits.includes(spirit.id)
                              ? "h-5 w-5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 flex items-center justify-center"
                              : "h-5 w-5 rounded-full bg-white/10 flex items-center justify-center"
                          }
                        >
                          {baseSpirits.includes(spirit.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {spirit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 反馈表单 */}
          <div
            id="feedback-form"
            ref={feedbackFormRef}
            className={
              showFeedbackForm ? "mt-24 max-w-3xl scroll-mt-24" : "hidden"
            }
          >
            <div
              className={`border ${borderClasses} rounded-xl overflow-hidden ${cardClasses}`}
            >
              <div className="p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
                <h3 className={`text-xl font-bold mb-2 ${textColorClass}`}>
                  {t("questions.feedback.title")}
                </h3>
                <p className="text-gray-400">
                  {t("questions.feedback.description")}
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={localUserFeedback}
                  onChange={(e) => setLocalUserFeedback(e.target.value)}
                  placeholder={t("questions.feedback.placeholder")}
                  className={`w-full min-h-[150px] border ${borderClasses} rounded-xl p-4 bg-transparent focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none ${textColorClass}`}
                ></textarea>
              </div>
              <div className="px-6 py-4 flex justify-end border-t border-gray-700">
                <button
                  onClick={handleSubmitFeedback}
                  className={`bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-8 py-3 rounded-full flex items-center ${
                    isLoading || localLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                  disabled={isLoading || localLoading}
                >
                  {isLoading || localLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                      <span className="font-medium">
                        {t("questions.loading")}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium inline-flex items-center">
                      {t("questions.submit")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
