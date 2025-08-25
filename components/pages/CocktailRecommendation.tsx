"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  Droplet,
  GlassWater,
  Printer,
  Share2,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RefreshCcw,
} from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { useCocktail } from "@/context/CocktailContext"
import { getCocktailById } from "@/api/cocktail"
import type { Cocktail, Ingredient, Tool, Step } from "@/api/cocktail"
import { CocktailImage } from "@/components/CocktailImage"
import { cocktailLogger, imageLogger } from "@/utils/logger"
import { commonStyles } from "@/utils/style-constants"

export default function CocktailRecommendation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cocktailId = searchParams?.get("id")
  const { t, getPathWithLanguage, language } = useLanguage()
  const {
    recommendation: contextCocktail,
    userFeedback,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    loadSavedData,
    refreshImage,
  } = useCocktail()

  const [cocktail, setCocktail] = useState<Cocktail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>("steps")
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isRefreshingImage, setIsRefreshingImage] = useState(false)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  const textColorClass = "text-white"
  const cardClasses = "bg-gray-800 text-white"
  const borderClasses = "border-gray-700"
  const gradientText = "bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent"

  const getLocalizedContent = (field: string, englishField: string): string | undefined => {
    if (language === "en" && cocktail?.[englishField as keyof Cocktail]) {
      return cocktail[englishField as keyof Cocktail] as string
    }
    return cocktail?.[field as keyof Cocktail] as string
  }

  const getLocalizedIngredientName = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_name) {
      return ingredient.english_name
    }
    return ingredient.name
  }

  const getLocalizedIngredientAmount = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_amount) {
      return ingredient.english_amount
    }
    return ingredient.amount
  }

  const getLocalizedIngredientUnit = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_unit) {
      return ingredient.english_unit
    }
    return ingredient.unit || ""
  }

  const getLocalizedToolName = (tool: Tool): string => {
    if (language === "en" && tool.english_name) {
      return tool.english_name
    }
    return tool.name
  }

  const getLocalizedStepContent = (step: Step): { description: string; tips?: string } => {
    if (language === "en") {
      return {
        description: step.english_description || step.description,
        tips: step.english_tips || step.tips,
      }
    }
    return {
      description: step.description,
      tips: step.tips,
    }
  }

  // Set page title based on language
  useEffect(() => {
    if (cocktail) {
      const title =
        language === "en" && cocktail.english_name
          ? `${cocktail.english_name} - MoodShaker`
          : `${cocktail.name} - MoodShaker`
      document.title = title
    }
  }, [cocktail, language])

  useEffect(() => {
    const fetchCocktail = async () => {
      setIsLoading(true)
      try {
        if (cocktailId) {
          const data = await getCocktailById(cocktailId)
          setCocktail(data)
        } else if (contextCocktail) {
          setCocktail(contextCocktail)
        } else {
          loadSavedData()
          if (contextCocktail) {
            setCocktail(contextCocktail)
          }
        }

        // Add a small delay before showing animations
        setTimeout(() => setIsPageLoaded(true), 100)
      } catch (error) {
        cocktailLogger.error("Error fetching cocktail", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCocktail()
  }, [cocktailId, contextCocktail, loadSavedData])

  const handleBack = () => {
    router.push(getPathWithLanguage("/"))
  }

  const handleShare = () => {
    try {
      if (navigator.share && window.isSecureContext) {
        navigator
          .share({
            title: `${cocktail?.name} Recipe - MoodShaker`,
            text: `Check out this ${cocktail?.name} recipe from MoodShaker!`,
            url: window.location.href,
          })
          .catch(() => copyToClipboard())
      } else {
        copyToClipboard()
      }
    } catch (err) {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href)
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    } catch (err) {
      alert(`Copy this URL: ${window.location.href}`)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleRefreshImage = async () => {
    if (refreshImage && cocktail) {
      setIsRefreshingImage(true)
      try {
        await refreshImage()
      } catch (error) {
        imageLogger.error("Error refreshing image", error)
      } finally {
        setIsRefreshingImage(false)
      }
    }
  }

  const loadingMessages = [
    t("recommendation.loadingMessage1"),
    t("recommendation.loadingMessage2"),
    t("recommendation.loadingMessage3"),
  ]

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length)
    }, 3000) // Change message every 3 seconds

    return () => clearInterval(intervalId) // Clean up interval on unmount
  }, [loadingMessages.length])

  if (isLoading || isContextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Sophisticated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Elegant geometric pattern */}
          <div className="absolute inset-0 opacity-8">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
                `,
                backgroundSize: "80px 80px",
              }}
            />
          </div>

          {/* Subtle floating orbs */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              className="absolute rounded-full bg-gradient-to-br from-amber-500/10 to-pink-500/10 backdrop-blur-sm"
              style={{
                width: `${60 + i * 25}px`,
                height: `${60 + i * 25}px`,
                left: `${10 + (i * 15) % 70}%`,
                top: `${15 + (i * 12) % 65}%`,
              }}
              animate={{
                y: [0, -25, 0],
                x: [0, Math.sin(i) * 18, 0],
                scale: [1, 1.08, 1],
                opacity: [0.08, 0.25, 0.08],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.6,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Refined light rays */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                className="absolute origin-center"
                style={{
                  width: "350px",
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${
                    i % 2 === 0 ? "rgba(245, 158, 11, 0.25)" : "rgba(236, 72, 153, 0.25)"
                  }, transparent)`,
                  transform: `rotate(${i * 45}deg)`,
                  filter: "blur(0.5px)",
                }}
                animate={{
                  opacity: [0.08, 0.5, 0.08],
                  scaleX: [0.4, 1.1, 0.4],
                }}
                transition={{
                  duration: 7,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Elegant cocktail glass silhouette */}
          <motion.div
            className="relative mx-auto mb-10 w-20 h-28"
            initial={{ rotateY: -20, scale: 0.9 }}
            animate={{ rotateY: 0, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Glass body */}
            <motion.div
              className="absolute inset-x-3 top-3 bottom-10 rounded-b-full backdrop-blur-lg border border-white/15 shadow-xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
                clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
              }}
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              {/* Sophisticated liquid gradient */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-2/3 rounded-b-full overflow-hidden opacity-70"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #06b6d4)",
                  backgroundSize: "250% 250%",
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                  height: ["40%", "75%", "55%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                {/* Elegant liquid surface */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-3 bg-white/25 rounded-full"
                  animate={{
                    scaleX: [1, 1.15, 0.9, 1],
                    y: [0, -4, 4, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />

                {/* Subtle swirling effect */}
                <motion.div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)",
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Glass stem */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/15 rounded-full backdrop-blur-sm" />
            
            {/* Glass base */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/15 rounded-full backdrop-blur-sm" />
          </motion.div>

          <motion.div className="space-y-5">
            <motion.h2
              className="text-2xl font-light text-gray-300 tracking-wide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
            >
              {t("recommendation.loading")}
            </motion.h2>

            {/* Elegant pulsing indicator */}
            <div className="flex justify-center space-x-4">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`pulse-${i}`}
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-t from-amber-400 to-pink-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Sophisticated progress bar */}
            <motion.div
              className="w-64 h-1 bg-slate-800/50 rounded-full overflow-hidden mx-auto backdrop-blur-sm border border-white/8"
              initial={{ opacity: 0, scaleX: 0.9 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.9, duration: 0.7 }}
            >
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: "linear-gradient(90deg, #f59e0b, #ec4899, #8b5cf6)",
                  backgroundSize: "200% 100%",
                }}
                initial={{ width: "0%" }}
                animate={{
                  width: "100%",
                  backgroundPosition: ["0% 0%", "100% 0%"],
                }}
                transition={{
                  width: { duration: 4, ease: [0.23, 1, 0.32, 1] },
                  backgroundPosition: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                }}
              >
                {/* Refined shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 2.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Minimal loading messages */}
            <motion.div className="h-5">
              <motion.p
                className="text-gray-400 text-sm font-light tracking-wide"
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {loadingMessages[loadingMessageIndex]}
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Ambient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-500/3 via-transparent to-pink-500/3 pointer-events-none"
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>
    )
  }

  // If no cocktail found
  if (!cocktail) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl"
          >
            <h2 className={`text-2xl font-medium mb-4 ${textColorClass}`}>{t("recommendation.notFound")}</h2>
            <p className="text-gray-300 mb-6">{t("recommendation.notFoundDesc")}</p>
            <button
              onClick={handleBack}
              className={commonStyles.primaryButtonFull}
            >
              {t("recommendation.back")}
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <motion.div
        className="fixed inset-0 overflow-hidden opacity-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/4 right-1/4 w-72 h-72 bg-amber-500 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-pink-500 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
        />
      </motion.div>

      <div className="container mx-auto py-8 px-4 relative">
        {/* Navigation bar with animation */}
        <motion.div
          className="flex flex-wrap justify-between items-center mb-8"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { duration: 0.5 } },
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("recommendation.back")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handlePrint}
              className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Print recipe"
            >
              <Printer className="h-5 w-5" />
            </motion.button>

            <motion.button
              className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Save recipe"
            >
              <BookmarkPlus className="h-5 w-5" />
            </motion.button>

            <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Share recipe"
              >
                <Share2 className="h-5 w-5" />
              </button>
              {showShareTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={commonStyles.tooltipFull}
                >
                  {t("recommendation.copied")}
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Hero section with cocktail image and basic info */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Cocktail image with animation */}
            <motion.div
              className="w-full lg:w-2/5"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                className={`rounded-2xl overflow-hidden shadow-xl border ${borderClasses} relative aspect-square`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <CocktailImage
                  cocktailId={cocktailId ?? undefined}
                  imageData={imageData}
                  cocktailName={cocktail?.name}
                />

                {!cocktailId && (
                  <motion.div className="absolute bottom-4 right-4">
                    <button
                      onClick={handleRefreshImage}
                      disabled={isRefreshingImage || isImageLoading}
                      className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      <RefreshCcw className={`h-5 w-5 ${isRefreshingImage || isImageLoading ? "animate-spin" : ""}`} />
                    </button>
                  </motion.div>
                )}

                {(isRefreshingImage || isImageLoading) && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-white">{t("recommendation.imageLoading")}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Cocktail info with animation */}
            <motion.div
              className="w-full lg:w-3/5 flex flex-col"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                className="text-center lg:text-left"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5 } },
                }}
              >
                <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${gradientText} inline-block`}>
                  {getLocalizedContent("name", "english_name")}
                </h1>
                {cocktail?.english_name && language === "cn" && (
                  <p className="text-gray-400 text-xl mb-4">{cocktail.english_name}</p>
                )}
              </motion.div>

              <motion.div
                className="mt-4 mb-6"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5 } },
                }}
              >
                <p className="text-gray-400 leading-relaxed text-lg">
                  {getLocalizedContent("description", "english_description")}
                </p>
              </motion.div>

              {/* Specs grid with animation */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-1">
                    <div className="mr-2 h-5 w-5 text-pink-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10 2v7.31"></path>
                        <path d="M14 9.3V1.99"></path>
                        <path d="M8.5 2h7"></path>
                        <path d="M14 9.3a6 6 0 1 1-4 0"></path>
                        <path d="M5.52 16h12.96"></path>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">Base Spirit</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {getLocalizedContent("base_spirit", "english_base_spirit")}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-1">
                    <Droplet className="mr-2 h-5 w-5 text-blue-500" />
                    <p className="text-sm text-gray-400">Alcohol Level</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {getLocalizedContent("alcohol_level", "english_alcohol_level")}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-1">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    <p className="text-sm text-gray-400">Prep Time</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {getLocalizedContent("time_required", "english_time_required") || "5 minutes"}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-1">
                    <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-gray-400">Serving Glass</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {getLocalizedContent("serving_glass", "english_serving_glass")}
                  </p>
                </motion.div>
              </motion.div>

              {/* Flavor tags with animation */}
              {cocktail?.flavor_profiles?.length > 0 && (
                <motion.div
                  className="mt-6"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.5 } },
                  }}
                >
                  <p className="text-sm text-gray-400 mb-2">Flavor Profile</p>
                  <div className="flex flex-wrap gap-2">
                    {(language === "en" && cocktail.english_flavor_profiles
                      ? cocktail.english_flavor_profiles
                      : cocktail.flavor_profiles
                    ).map((flavor, index) => (
                      <motion.span
                        key={index}
                        className="px-3 py-1 backdrop-blur-sm rounded-full text-xs border border-gray-700/50"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {flavor}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Recipe section with animation */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.h2
            className={`text-2xl font-bold mb-6 ${gradientText} inline-block`}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            Recipe
          </motion.h2>

          {/* Mobile accordion sections */}
          <div className="lg:hidden space-y-4">
            {/* Ingredients Section */}
            <motion.div
              className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <button
                className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-amber-500/20 to-pink-500/20"
                onClick={() => toggleSection("ingredients")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.ingredients")}</h3>
                {expandedSection === "ingredients" ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {expandedSection === "ingredients" && (
                <div className="p-5">
                  <ul className="divide-y divide-gray-700/30">
                    {cocktail?.ingredients?.map((ingredient, index) => (
                      <motion.li
                        key={index}
                        className="py-3 flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedIngredientName(ingredient)}
                        </span>
                        <span className="text-amber-400 font-medium">
                          {getLocalizedIngredientAmount(ingredient)}
                          {getLocalizedIngredientUnit(ingredient) ? ` ${getLocalizedIngredientUnit(ingredient)}` : ""}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Tools Section */}
            <motion.div
              className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <button
                className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-pink-500/20 to-amber-500/20"
                onClick={() => toggleSection("tools")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.tools")}</h3>
                {expandedSection === "tools" ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSection === "tools" && (
                <div className="p-5">
                  <ul className="space-y-3">
                    {cocktail?.tools?.map((tool, index) => (
                      <motion.li
                        key={index}
                        className="flex flex-col"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>{getLocalizedToolName(tool)}</span>
                        {tool.alternative && (
                          <span className="text-sm text-gray-400 mt-1">
                            {t("recommendation.alternative")}:{" "}
                            {language === "en" && tool.english_alternative
                              ? tool.english_alternative
                              : tool.alternative}
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Steps Section - Always expanded on mobile */}
            <motion.div
              className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <div className="p-5 bg-gradient-to-r from-pink-500/20 to-purple-500/20">
                <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.steps")}</h3>
              </div>
              <div className="p-5">
                <ol className="space-y-8">
                  {cocktail?.steps?.map((step) => {
                    const localizedStep = getLocalizedStepContent(step)
                    return (
                      <motion.li
                        key={step.step_number}
                        className="flex gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: step.step_number * 0.1 }}
                        onMouseEnter={() => setActiveStep(step.step_number)}
                        onMouseLeave={() => setActiveStep(null)}
                      >
                        <motion.div
                          className={commonStyles.circleIcon}
                          animate={{
                            scale: activeStep === step.step_number ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {step.step_number}
                        </motion.div>
                        <div className="flex-1">
                          <p className={`${textColorClass} text-base leading-relaxed`}>{localizedStep.description}</p>
                          {localizedStep.tips && (
                            <motion.div
                              className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <p className="text-amber-400/70 text-xs flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                <span>{localizedStep.tips}</span>
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.li>
                    )
                  })}
                </ol>
              </div>
            </motion.div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8">
            {/* Left column: Ingredients and Tools */}
            <div className="lg:col-span-4 space-y-8">
              {/* Ingredients with animation */}
              <motion.div
                className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-5 bg-gradient-to-r from-amber-500/20 to-pink-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.ingredients")}</h3>
                </div>
                <div className="p-5">
                  <ul className="divide-y divide-gray-700/30">
                    {cocktail?.ingredients?.map((ingredient, index) => (
                      <motion.li
                        key={index}
                        className="py-3 flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedIngredientName(ingredient)}
                        </span>
                        <span className="text-amber-400 font-medium">
                          {getLocalizedIngredientAmount(ingredient)}
                          {getLocalizedIngredientUnit(ingredient) ? ` ${getLocalizedIngredientUnit(ingredient)}` : ""}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Tools with animation */}
              <motion.div
                className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-5 bg-gradient-to-r from-pink-500/20 to-amber-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.tools")}</h3>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {cocktail?.tools?.map((tool, index) => (
                      <motion.li
                        key={index}
                        className="flex flex-col"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>{getLocalizedToolName(tool)}</span>
                        {tool.alternative && (
                          <span className="text-sm text-gray-400 mt-1">
                            {t("recommendation.alternative")}:{" "}
                            {language === "en" && tool.english_alternative
                              ? tool.english_alternative
                              : tool.alternative}
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>

            {/* Right column: Steps (wider) */}
            <div className="lg:col-span-8">
              <motion.div
                className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-5 bg-gradient-to-r from-pink-500/20 to-purple-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>{t("recommendation.steps")}</h3>
                </div>
                <div className="p-5">
                  <ol className="space-y-8">
                    {cocktail?.steps?.map((step) => {
                      const localizedStep = getLocalizedStepContent(step)
                      return (
                        <motion.li
                          key={step.step_number}
                          className="relative"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: step.step_number * 0.1 }}
                          onMouseEnter={() => setActiveStep(step.step_number)}
                          onMouseLeave={() => setActiveStep(null)}
                        >
                          <div className="flex gap-4">
                            <motion.div
                              className={commonStyles.circleIcon}
                              animate={{
                                scale: activeStep === step.step_number ? 1.1 : 1,
                                boxShadow:
                                  activeStep === step.step_number
                                    ? "0 0 15px rgba(236, 72, 153, 0.5)"
                                    : "0 0 0 rgba(0, 0, 0, 0)",
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {step.step_number}
                            </motion.div>
                            <div className="flex-1">
                              <p className={`${textColorClass} text-lg leading-relaxed`}>{localizedStep.description}</p>
                              {localizedStep.tips && (
                                <motion.div
                                  className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                                  initial={{ opacity: 1 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <p className="text-amber-400/70 text-sm flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0" />
                                    <span>{localizedStep.tips}</span>
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Step progress line */}
                          {step.step_number < (cocktail?.steps?.length || 0) && (
                            <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-pink-500/50 to-amber-500/20 h-[calc(100%-3.5rem)]"></div>
                          )}
                        </motion.li>
                      )
                    })}
                  </ol>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons with animation */}
        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-700/50 rounded-full transition-all duration-300 hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t("recommendation.back")}</span>
          </button>
        </motion.div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .container,
          .container * {
            visibility: visible;
          }
          .container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button,
          .print-hide {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
