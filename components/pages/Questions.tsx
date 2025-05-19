"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useCocktail } from "@/context/CocktailContext";
import { useLanguage } from "@/context/LanguageContext";
import React from "react";

// 优化：合并图片对象
const images = {
  // 问题选项图片
  classic: "/classic.png",
  custom: "/custom.png",
  low: "/low.png",
  medium: "/medium.png",
  high: "/high.png",
  any: "/any.png",
  easy: "/easy.png",
  hard: "/hard.png",

  // 基酒图片
  gin: "/gin.png",
  rum: "/rum.png",
  vodka: "/vodka.png",
  whiskey: "/whiskey.png",
  tequila: "/tequila.png",
  brandy: "/brandy.png",
};

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
  const themeClasses = "bg-gray-900 text-white";
  const textColorClass = "text-white";
  const cardClasses = "bg-gray-800/80 text-white";
  const borderClasses = "border-gray-700";

  // 优化：简化问题数据结构
  const questions = useMemo(
    () => [
      {
        id: 1,
        title:
          locale === "en"
            ? "Ready to shake things up? 🍸"
            : "准备好摇一摇了吗？🍸",
        description:
          locale === "en"
            ? "Let's find your perfect cocktail match! Are you feeling classic or adventurous today?"
            : "让我们找到你的完美鸡尾酒！今天是想来点经典款还是想尝试新花样？",
        options: [
          {
            id: "classic",
            text: locale === "en" ? "Choose from classics" : "经典特调",
            image: images.classic,
          },
          {
            id: "custom",
            text: locale === "en" ? "Surprise Me!" : "来点惊喜",
            image: images.custom,
          },
        ],
      },
      {
        id: 2,
        title:
          locale === "en" ? "How strong do you want it? 💪" : "想要多上头？💪",
        description:
          locale === "en"
            ? "Choose your power level - from a gentle buzz to a full-on party starter!"
            : "选择你的酒精等级 - 从微醺到派对启动器！",
        options: [
          {
            id: "low",
            text: locale === "en" ? "Just a Sip" : "低酒精度",
            image: images.low,
          },
          {
            id: "medium",
            text: locale === "en" ? "Balanced Buzz" : "中酒精度",
            image: images.medium,
          },
          {
            id: "high",
            text: locale === "en" ? "Party Mode" : "高酒精度",
            image: images.high,
          },
          {
            id: "any",
            text: locale === "en" ? "Surprise Me!" : "我无所谓",
            image: images.any,
          },
        ],
      },
      {
        id: 3,
        title: locale === "en" ? "Mixology Level? 🎯" : "调酒技能点？🎯",
        description:
          locale === "en"
            ? "How fancy do you want to get with your cocktail making? We've got options for every skill level!"
            : "想要多花哨的调酒方式？我们为每个技能等级都准备了选项！",
        options: [
          {
            id: "easy",
            text: locale === "en" ? "Mix & Pour" : "简单混合",
            image: images.easy,
          },
          {
            id: "medium",
            text: locale === "en" ? "Shake & Stir" : "中等难度",
            image: images.medium,
          },
          {
            id: "hard",
            text: locale === "en" ? "Master Mixologist" : "调酒大师",
            image: images.hard,
          },
          {
            id: "any",
            text: locale === "en" ? "Surprise Me!" : "我无所谓",
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
        name: locale === "en" ? "All" : "全部🎉",
        description: locale === "en" ? "Use all base spirits" : "使用所有基酒",
      },
      {
        id: "gin",
        name: locale === "en" ? "Gin" : "金酒🌿",
        description: "Gin",
        image: images.gin,
      },
      {
        id: "rum",
        name: locale === "en" ? "Rum" : "朗姆酒🏝️",
        description: "Rum",
        image: images.rum,
      },
      {
        id: "vodka",
        name: locale === "en" ? "Vodka" : "伏特加❄️",
        description: "Vodka",
        image: images.vodka,
      },
      {
        id: "whiskey",
        name: locale === "en" ? "Whiskey" : "威士忌🥃",
        description: "Whiskey",
        image: images.whiskey,
      },
      {
        id: "tequila",
        name: locale === "en" ? "Tequila" : "龙舌兰🌵",
        description: "Tequila",
        image: images.tequila,
      },
      {
        id: "brandy",
        name: locale === "en" ? "Brandy" : "白兰地🍇",
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

  // Update the handleSubmitFeedback function to navigate immediately after getting the cocktail
  const handleSubmitFeedback = useCallback(async () => {
    try {
      // Use local loading state
      setLocalLoading(true);

      // First save the feedback
      saveFeedback(localUserFeedback);

      // Then submit the request and wait for the cocktail data only
      const result = await submitRequest();

      // Log the result for debugging
      console.log(
        "Request submitted successfully, navigating to recommendation page",
        {
          resultName: result.name,
        },
      );

      // Navigate immediately after getting the cocktail data
      // Don't wait for image generation
      router.push(getPathWithLanguage("/cocktail/recommendation"));
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
      <div className="h-full w-full">
        <div
          className={`cursor-pointer transition-all duration-300 hover:scale-105 border ${borderClasses} rounded-xl overflow-hidden ${cardClasses} ${
            isSelected ? "ring-2 ring-pink-500 shadow-lg" : ""
          } h-full flex flex-col`}
          onClick={onSelect}
        >
          <div className="p-4 flex flex-col items-center justify-center flex-1">
            <div className="flex flex-col items-center text-center w-full">
              <div className="mb-3 rounded-full overflow-hidden bg-gradient-to-r from-amber-500/20 to-pink-500/20 p-2 w-24 h-24 flex items-center justify-center">
                <img
                  src={option.image || "/placeholder.svg"}
                  alt={option.text}
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
              <h3
                className={`text-base font-medium ${textColorClass} text-center w-full`}
              >
                {option.text}
              </h3>
            </div>
          </div>
        </div>
      </div>
    ),
  );
  QuestionOption.displayName = "QuestionOption";

  return (
    <div className={`w-full px-4 py-8 ${themeClasses}`}>
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
          {/* 所有主要部分的容器 */}
          <div className="space-y-12 w-full max-w-5xl mx-auto">
            {/* 问题列表 */}
            {questions.map((question) => (
              <div
                key={question.id}
                ref={(el) => {
                  questionRefs.current[question.id] = el;
                }}
                className={`transition-all duration-500 scroll-mt-24 w-full ${
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

                {/* Updated grid layout with fixed column widths and consistent spacing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {question.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="transition-all duration-300 h-full"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: visibleQuestions.includes(question.id)
                          ? "fadeIn 0.5s ease-in-out forwards"
                          : "none",
                        opacity: visibleQuestions.includes(question.id) ? 1 : 0,
                      }}
                    >
                      <QuestionOption
                        option={option}
                        isSelected={answers[question.id] === option.id}
                        onSelect={() =>
                          handleOptionSelect(question.id, option.id)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 基酒选择 - Updated for consistent width */}
            <div
              ref={baseSpiritsRef}
              className={
                showBaseSpirits
                  ? "w-full scroll-mt-24"
                  : "hidden"
              }
              id="base-spirits-section"
            >
              <div
                className={`border ${borderClasses} rounded-xl overflow-hidden ${cardClasses} w-full`}
              >
                <div className="p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
                  <h3 className={`text-2xl font-bold mb-2 ${textColorClass}`}>
                    {t("questions.availableSpirits")}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {t("questions.selectSpirits")}
                  </p>
                </div>
                <div className="p-6">
                  {/* Updated grid layout for base spirits with consistent sizing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {baseSpiritsOptions.map((spirit) => (
                      <div
                        key={spirit.id}
                        className={`cursor-pointer p-4 rounded-xl transition-all duration-300 border h-full flex flex-col justify-between ${
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
                              <span className={`text-base font-medium ${textColorClass}`}>
                                {spirit.name}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-base font-medium ${textColorClass}`}>
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
                        <p className="text-base text-gray-400">
                          {spirit.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 反馈表单 - Updated for consistent width */}
            <div
              ref={feedbackFormRef}
              className={
                showFeedbackForm
                  ? "w-full scroll-mt-24"
                  : "hidden"
              }
            >
              <div
                className={`border ${borderClasses} rounded-xl overflow-hidden ${cardClasses} w-full`}
              >
                <div className="p-6 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
                  <h3 className={`text-2xl font-bold mb-2 ${textColorClass}`}>
                    {locale === "en" ? "Last Step: Share Your Mood! 🥳" : "最后一步：分享你的心情！🥳"}
                  </h3>
                  <p className="text-gray-400">
                    {locale === "en" 
                      ? "Tell us what you're in the mood for - we'll craft the perfect cocktail just for you!"
                      : "告诉我们你现在的心情 - 我们会为你调制一杯完美的鸡尾酒！"}
                  </p>
                </div>
                <div className="p-6">
                  <textarea
                    value={localUserFeedback}
                    onChange={(e) => setLocalUserFeedback(e.target.value)}
                    placeholder={locale === "en" 
                      ? "Feeling adventurous? Celebrating something special? Just want to relax? Let us know! ✨"
                      : "想要冒险？在庆祝什么？还是只想放松一下？今天的心情？告诉我们吧！✨"}
                    className={`w-full min-h-[150px] border ${borderClasses} rounded-xl p-4 bg-transparent focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none ${textColorClass}`}
                  ></textarea>
                </div>
                <div className="px-6 py-4 flex justify-end border-t border-gray-700">
                  <button
                    onClick={handleSubmitFeedback}
                    className={`bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-8 py-3 rounded-full flex items-center ${
                      isLoading || localLoading
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={isLoading || localLoading}
                  >
                    {isLoading || localLoading ? (
                      <>
                        <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                        <span className="font-medium">
                          {locale === "en" ? "Mixing your perfect drink..." : "正在调制你的完美饮品..."}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium inline-flex items-center">
                        {locale === "en" ? "Shake It Up! 🍸" : "开始摇一摇！🍸"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
