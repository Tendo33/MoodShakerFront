"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  Droplet,
  RefreshCw,
  Beaker,
  GlassWater,
  Share2,
  ChevronDown,
  ChevronUp,
  Printer,
  BookmarkPlus,
  RefreshCcw,
} from "lucide-react"
import { useCocktail } from "@/context/CocktailContext"
import { useLanguage } from "@/context/LanguageContext"
import { getCocktailById } from "@/services/cocktailService"
import type { Cocktail } from "@/api/cocktail"
import CocktailImage from "@/components/CocktailImage"
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Container,
  GradientText,
  Badge,
} from "@/components/ui/core"
import { animations, useDelayedAnimation, floatAnimation, useInViewAnimation } from "@/utils/animation-utils"

// Animation variants for framer-motion
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function CocktailRecommendation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cocktailId = searchParams?.get("id")
  const { t, getPathWithLanguage } = useLanguage()
  const {
    recommendation: contextCocktail,
    userFeedback,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    loadSavedData,
    refreshImage,
  } = useCocktail()

  const shouldAnimate = useDelayedAnimation(100)
  const [heroRef, heroInView] = useInViewAnimation()
  const [recipeRef, recipeInView] = useInViewAnimation()
  const [actionsRef, actionsInView] = useInViewAnimation()

  const [cocktail, setCocktail] = useState<Cocktail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [showShareTooltip, setShowShareTooltip] = useState(false)
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>("steps") // Default expanded section
  const [isRefreshingImage, setIsRefreshingImage] = useState(false)

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const loadingMessages = [
    t("recommendation.analyzing"),
    t("recommendation.mixing"),
    t("recommendation.crafting"),
    t("recommendation.finalizing"),
  ]

  // Constants
  const themeClasses = "bg-gray-900 text-white"
  const textColorClass = "text-white"
  const cardClasses = "bg-gray-800 text-white"
  const borderClasses = "border-gray-700"
  const gradientText = "bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent"

  const handleBack = () => {
    router.push(getPathWithLanguage("/"))
  }

  const handleTryAgain = () => {
    // Clear local storage and restart the question flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("moodshaker-answers")
      localStorage.removeItem("moodshaker-feedback")
      localStorage.removeItem("moodshaker-recommendation")
      localStorage.removeItem("moodshaker-base-spirits")
    }
    router.push(getPathWithLanguage("/questions"))
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

  // Handle image refresh
  const handleRefreshImage = async () => {
    if (isRefreshingImage) return

    setIsRefreshingImage(true)
    try {
      await refreshImage()
    } catch (error) {
      console.error("Failed to refresh image:", error)
    } finally {
      setIsRefreshingImage(false)
    }
  }

  // Load cocktail data - 修复无限循环问题
  useEffect(() => {
    if (cocktailId) {
      setIsLoading(true)
      getCocktailById(cocktailId)
        .then((data) => {
          if (data) setCocktail(data)
          setIsLoading(false)
          // Add a small delay before showing animations
          setTimeout(() => setIsPageLoaded(true), 100)
        })
        .catch(() => setIsLoading(false))
    } else if (!cocktail) {
      // Always load fresh data from storage
      loadSavedData()
      // 只在没有cocktail时设置，避免循环
      if (contextCocktail) {
        setCocktail(contextCocktail)
      }
      setTimeout(() => setIsPageLoaded(true), 100)
    }
  }, [cocktailId, loadSavedData]) // 移除cocktail和contextCocktail依赖以避免循环

  // Update cocktail when context changes - 使用 useRef 来跟踪更新
  const previousContextCocktailRef = useRef<Cocktail | null>(null)
  useEffect(() => {
    if (!cocktailId && contextCocktail && contextCocktail !== previousContextCocktailRef.current) {
      setCocktail(contextCocktail)
      previousContextCocktailRef.current = contextCocktail
    }
  }, [contextCocktail, cocktailId])

  useEffect(() => {
    if ((cocktailId && isLoading) || (!cocktailId && isContextLoading)) {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
      }, 1500)

      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 95) return prev
          return prev + Math.random() * 15
        })
      }, 200)

      return () => {
        clearInterval(messageInterval)
        clearInterval(progressInterval)
      }
    } else {
      setLoadingProgress(0)
      setLoadingMessageIndex(0)
    }
  }, [isLoading, isContextLoading, loadingMessages.length])

  // Show loading state
  if ((cocktailId && isLoading) || (!cocktailId && isContextLoading)) {
    return (
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
        </div>

        <Container size="md" className="relative">
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Card
                gradient={true}
                hoverEffect={false}
                bordered={true}
                glass={true}
                padding="xl"
                className="max-w-md mx-auto"
              >
                <CardContent className="space-y-8">
                  {/* Cocktail glass animation */}
                  <motion.div
                    className="relative mx-auto w-24 h-24"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-full opacity-20 blur-xl" />
                    <motion.div
                      className="relative w-full h-full"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      {/* Cocktail glass SVG */}
                      <svg viewBox="0 0 100 100" className="w-full h-full text-primary" fill="currentColor">
                        <path d="M20 20 L80 20 L50 50 L50 80 L45 80 L45 85 L55 85 L55 80 L50 80 L50 50 Z" />
                        <motion.path
                          d="M25 25 L75 25 L50 45 Z"
                          fill="url(#cocktailGradient)"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                        <defs>
                          <linearGradient id="cocktailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="rgb(var(--primary))" />
                            <stop offset="100%" stopColor="rgb(var(--secondary))" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </motion.div>
                  </motion.div>

                  {/* Loading message */}
                  <motion.div
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <GradientText className="text-2xl md:text-3xl font-playfair font-bold mb-2">
                      {loadingMessages[loadingMessageIndex]}
                    </GradientText>
                    <p className="text-muted-foreground font-source-sans">{t("recommendation.loadingDesc")}</p>
                  </motion.div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(loadingProgress, 95)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(Math.min(loadingProgress, 95))}% {t("recommendation.complete")}
                    </p>
                  </div>

                  {/* Floating ingredients animation */}
                  <div className="relative h-16 overflow-hidden">
                    {["🍋", "🍊", "🥃", "🧊", "🌿"].map((emoji, index) => (
                      <motion.div
                        key={index}
                        className="absolute text-2xl"
                        initial={{
                          x: Math.random() * 200 - 100,
                          y: 60,
                          opacity: 0,
                        }}
                        animate={{
                          y: [-20, -40, -20],
                          opacity: [0, 1, 0],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.5,
                          ease: "easeInOut",
                        }}
                        style={{
                          left: `${20 + index * 15}%`,
                        }}
                      >
                        {emoji}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </Container>
      </div>
    )
  }

  // If no cocktail found
  if (!cocktail) {
    return (
      <div className={`min-h-screen ${themeClasses}`}>
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
              className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              {t("recommendation.back")}
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={floatAnimation}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{
            ...floatAnimation,
            transition: { ...floatAnimation.transition, delay: 1 },
          }}
        />
        <motion.div
          className="absolute top-2/3 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
          animate={{
            ...floatAnimation,
            transition: { ...floatAnimation.transition, delay: 2 },
          }}
        />
      </div>

      <Container size="xl" className="relative">
        <div className="section-spacing">
          <motion.div
            className="flex flex-wrap justify-between items-center mb-8"
            initial="hidden"
            animate={shouldAnimate ? "visible" : "hidden"}
            variants={animations.fadeIn}
          >
            <Button variant="ghost" size="md" iconPosition="left" icon={<ArrowLeft />} onClick={handleBack}>
              {t("recommendation.back")}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                iconPosition="left"
                icon={<Printer />}
                onClick={handlePrint}
                className="rounded-full"
              />
              <Button variant="ghost" size="sm" iconPosition="left" icon={<BookmarkPlus />} className="rounded-full" />
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  iconPosition="left"
                  icon={<Share2 />}
                  onClick={handleShare}
                  className="rounded-full"
                />
                <AnimatePresence>
                  {showShareTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border"
                    >
                      {t("recommendation.copied")}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {!cocktailId && userFeedback && (
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={animations.slideUp}
              className="mb-8"
            >
              <Card gradient={true} hoverEffect={true} bordered={true} glass={true} padding="lg">
                <CardContent className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="text-lg lg:text-xl mb-2">
                    <GradientText>{t("recommendation.yourRequirements")}</GradientText>
                  </CardTitle>
                  <CardDescription className="text-base">{userFeedback}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            ref={heroRef}
            className="mb-12"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={animations.staggerContainer}
          >
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div className="relative" variants={animations.slideUp}>
                <Card
                  gradient={false}
                  hoverEffect={true}
                  bordered={true}
                  glass={true}
                  className="overflow-hidden aspect-square"
                  padding="none"
                >
                  <CocktailImage
                    cocktailId={cocktailId ?? undefined}
                    imageData={imageData}
                    cocktailName={cocktail?.name}
                  />

                  <motion.div className="absolute bottom-4 right-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconPosition="left"
                      icon={<RefreshCcw className={isRefreshingImage || isImageLoading ? "animate-spin" : ""} />}
                      onClick={handleRefreshImage}
                      disabled={isRefreshingImage || isImageLoading}
                      className="bg-background/50 backdrop-blur-sm rounded-full"
                    />
                  </motion.div>

                  {(isRefreshingImage || isImageLoading) && (
                    <div className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-2" />
                        <p className="text-sm">{t("recommendation.imageLoading")}</p>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>

              <motion.div className="content-spacing" variants={animations.slideUp}>
                <motion.div className="text-center lg:text-left mb-6" variants={animations.fadeIn}>
                  <h1 className="font-playfair font-bold text-shadow mb-2">
                    <GradientText className="text-4xl md:text-5xl lg:text-6xl leading-tight">
                      {cocktail?.name}
                    </GradientText>
                  </h1>
                  {cocktail?.english_name && (
                    <p className="text-muted-foreground text-xl font-source-sans">{cocktail.english_name}</p>
                  )}
                </motion.div>

                <motion.div className="mb-6" variants={animations.fadeIn}>
                  <p className="text-lg md:text-xl text-muted-foreground font-source-sans leading-relaxed">
                    {cocktail?.description}
                  </p>
                </motion.div>

                <motion.div
                  className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                  variants={animations.staggerContainer}
                >
                  <motion.div className="text-center lg:text-left" variants={animations.slideUp}>
                    <div className="flex items-center justify-center lg:justify-start mb-1">
                      <Beaker className="mr-2 h-5 w-5 text-secondary" />
                      <p className="text-sm text-muted-foreground font-source-sans">Base Spirit</p>
                    </div>
                    <p className="font-medium text-foreground">{cocktail?.base_spirit}</p>
                  </motion.div>
                  <motion.div className="text-center lg:text-left" variants={animations.slideUp}>
                    <div className="flex items-center justify-center lg:justify-start mb-1">
                      <Droplet className="mr-2 h-5 w-5 text-blue-500" />
                      <p className="text-sm text-muted-foreground font-source-sans">Alcohol Level</p>
                    </div>
                    <p className="font-medium text-foreground">{cocktail?.alcohol_level}</p>
                  </motion.div>
                  <motion.div className="text-center lg:text-left" variants={animations.slideUp}>
                    <div className="flex items-center justify-center lg:justify-start mb-1">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      <p className="text-sm text-muted-foreground font-source-sans">Prep Time</p>
                    </div>
                    <p className="font-medium text-foreground">{cocktail?.time_required || "5 minutes"}</p>
                  </motion.div>
                  <motion.div className="text-center lg:text-left" variants={animations.slideUp}>
                    <div className="flex items-center justify-center lg:justify-start mb-1">
                      <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
                      <p className="text-sm text-muted-foreground font-source-sans">Serving Glass</p>
                    </div>
                    <p className="font-medium text-foreground">{cocktail?.serving_glass}</p>
                  </motion.div>
                </motion.div>

                {cocktail?.flavor_profiles?.length > 0 && (
                  <motion.div className="mt-6" variants={animations.fadeIn}>
                    <p className="text-sm text-muted-foreground font-source-sans mb-2">Flavor Profile</p>
                    <div className="flex flex-wrap gap-2">
                      {cocktail.flavor_profiles.map((flavor, index) => (
                        <Badge
                          key={index}
                          variant={index % 3 === 0 ? "primary" : index % 3 === 1 ? "info" : "success"}
                          size="sm"
                        >
                          {flavor}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {!cocktailId && cocktail?.match_reason && (
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={animations.slideUp}
              className="mb-12"
            >
              <Card gradient={true} hoverEffect={true} bordered={true} glass={true} padding="lg">
                <CardContent className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="text-xl lg:text-2xl mb-2">
                    <GradientText>{t("recommendation.recommendationReason")}</GradientText>
                  </CardTitle>
                </CardContent>
                <CardContent>
                  <CardDescription className="text-base md:text-lg leading-relaxed">
                    {cocktail.match_reason}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            ref={recipeRef}
            className="mb-12"
            initial="hidden"
            animate={recipeInView ? "visible" : "hidden"}
            variants={animations.staggerContainer}
          >
            <motion.div className="text-center mb-8" variants={animations.fadeIn}>
              <GradientText as="h2" className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold">
                Recipe
              </GradientText>
            </motion.div>

            {/* Mobile accordion sections with homepage styling */}
            <div className="lg:hidden space-y-4">
              {/* Ingredients Section */}
              <motion.div variants={animations.slideUp}>
                <Card
                  gradient={true}
                  hoverEffect={true}
                  bordered={true}
                  glass={true}
                  className="overflow-hidden"
                  padding="none"
                >
                  <button
                    className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-primary/20 to-secondary/20"
                    onClick={() => toggleSection("ingredients")}
                  >
                    <CardTitle className="text-xl">
                      <GradientText>{t("recommendation.ingredients")}</GradientText>
                    </CardTitle>
                    {expandedSection === "ingredients" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "ingredients" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="card-spacing">
                          <ul className="divide-y divide-border/30">
                            {cocktail?.ingredients?.map((ingredient, index) => (
                              <motion.li
                                key={index}
                                className="py-3 flex justify-between items-center"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <span className="font-medium text-foreground">{ingredient.name}</span>
                                <span className="text-primary font-medium">
                                  {ingredient.amount}
                                  {ingredient.unit ? ` ${ingredient.unit}` : ""}
                                </span>
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>

              {/* Tools Section */}
              <motion.div variants={animations.slideUp}>
                <Card
                  gradient={true}
                  hoverEffect={true}
                  bordered={true}
                  glass={true}
                  className="overflow-hidden"
                  padding="none"
                >
                  <button
                    className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-secondary/20 to-primary/20"
                    onClick={() => toggleSection("tools")}
                  >
                    <CardTitle className="text-xl">
                      <GradientText>{t("recommendation.tools")}</GradientText>
                    </CardTitle>
                    {expandedSection === "tools" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "tools" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="card-spacing">
                          <ul className="space-y-3">
                            {cocktail?.tools?.map((tool, index) => (
                              <motion.li
                                key={index}
                                className="flex flex-col"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <span className="font-medium text-foreground">{tool.name}</span>
                                {tool.alternative && (
                                  <span className="text-sm text-muted-foreground mt-1">
                                    Alternative: {tool.alternative}
                                  </span>
                                )}
                              </motion.li>
                            ))}
                          </ul>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>

              {/* Steps Section */}
              <motion.div variants={animations.slideUp}>
                <Card
                  gradient={true}
                  hoverEffect={true}
                  bordered={true}
                  glass={true}
                  className="overflow-hidden"
                  padding="none"
                >
                  <button
                    className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-secondary/20 to-accent/20"
                    onClick={() => toggleSection("steps")}
                  >
                    <CardTitle className="text-xl">
                      <GradientText>{t("recommendation.steps")}</GradientText>
                    </CardTitle>
                    {expandedSection === "steps" ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedSection === "steps" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent className="card-spacing">
                          <ol className="space-y-8">
                            {cocktail?.steps?.map((step) => (
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
                                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg flex-shrink-0"
                                  animate={{
                                    scale: activeStep === step.step_number ? 1.1 : 1,
                                  }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {step.step_number}
                                </motion.div>
                                <div className="flex-1">
                                  <p className="text-foreground text-base leading-relaxed">{step.description}</p>
                                  {step.tips && (
                                    <motion.div
                                      className="mt-3 p-2 bg-primary/5 border border-primary/10 rounded-lg"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                    >
                                      <p className="text-primary/70 text-xs flex items-center gap-2">
                                        <span className="font-medium">💡 Tip:</span> {step.tips}
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.li>
                            ))}
                          </ol>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            </div>

            {/* Desktop layout with homepage styling */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-8">
              {/* Left column: Ingredients and Tools */}
              <div className="lg:col-span-4 space-y-8">
                {/* Ingredients */}
                <motion.div variants={animations.slideUp}>
                  <Card
                    gradient={true}
                    hoverEffect={true}
                    bordered={true}
                    glass={true}
                    className="overflow-hidden"
                    padding="lg"
                  >
                    <CardContent className="bg-gradient-to-r from-primary/20 to-secondary/20">
                      <CardTitle className="text-xl">
                        <GradientText>{t("recommendation.ingredients")}</GradientText>
                      </CardTitle>
                    </CardContent>
                    <CardContent className="card-spacing">
                      <ul className="divide-y divide-border/30">
                        {cocktail?.ingredients?.map((ingredient, index) => (
                          <motion.li
                            key={index}
                            className="py-3 flex justify-between items-center"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ x: 5 }}
                          >
                            <span className="font-medium text-foreground">{ingredient.name}</span>
                            <span className="text-primary font-medium">
                              {ingredient.amount}
                              {ingredient.unit ? ` ${ingredient.unit}` : ""}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tools */}
                <motion.div variants={animations.slideUp}>
                  <Card
                    gradient={true}
                    hoverEffect={true}
                    bordered={true}
                    glass={true}
                    className="overflow-hidden"
                    padding="lg"
                  >
                    <CardContent className="bg-gradient-to-r from-secondary/20 to-primary/20">
                      <CardTitle className="text-xl">
                        <GradientText>{t("recommendation.tools")}</GradientText>
                      </CardTitle>
                    </CardContent>
                    <CardContent className="card-spacing">
                      <ul className="space-y-3">
                        {cocktail?.tools?.map((tool, index) => (
                          <motion.li
                            key={index}
                            className="flex flex-col"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <span className="font-medium text-foreground">{tool.name}</span>
                            {tool.alternative && (
                              <span className="text-sm text-muted-foreground mt-1">
                                Alternative: {tool.alternative}
                              </span>
                            )}
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Right column: Steps */}
              <div className="lg:col-span-8">
                <motion.div variants={animations.slideUp}>
                  <Card
                    gradient={true}
                    hoverEffect={true}
                    bordered={true}
                    glass={true}
                    className="overflow-hidden"
                    padding="lg"
                  >
                    <CardContent className="bg-gradient-to-r from-secondary/20 to-accent/20">
                      <CardTitle className="text-xl">
                        <GradientText>{t("recommendation.steps")}</GradientText>
                      </CardTitle>
                    </CardContent>
                    <CardContent className="card-spacing">
                      <ol className="space-y-8">
                        {cocktail?.steps?.map((step) => (
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
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg flex-shrink-0"
                                animate={{
                                  scale: activeStep === step.step_number ? 1.1 : 1,
                                  boxShadow:
                                    activeStep === step.step_number
                                      ? "0 0 15px rgba(var(--primary), 0.5)"
                                      : "0 0 0 rgba(0, 0, 0, 0)",
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                {step.step_number}
                              </motion.div>
                              <div className="flex-1">
                                <p className="text-foreground text-lg leading-relaxed">{step.description}</p>
                                {step.tips && (
                                  <motion.div
                                    className="mt-3 p-2 bg-primary/5 border border-primary/10 rounded-lg"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <p className="text-primary/70 text-sm flex items-center gap-2">
                                      <span className="font-medium">💡 Tip:</span> {step.tips}
                                    </p>
                                  </motion.div>
                                )}
                              </div>
                            </div>

                            {/* Step progress line */}
                            {step.step_number < (cocktail?.steps?.length || 0) && (
                              <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-secondary/50 to-primary/20 h-[calc(100%-3.5rem)]" />
                            )}
                          </motion.li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div
            ref={actionsRef}
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden"
            animate={actionsInView ? "visible" : "hidden"}
            variants={animations.slideUp}
          >
            <Button variant="outline" size="lg" iconPosition="left" icon={<ArrowLeft />} onClick={handleBack}>
              {t("recommendation.back")}
            </Button>

            {!cocktailId && (
              <Button
                variant="primary"
                size="lg"
                iconPosition="left"
                icon={<RefreshCw />}
                onClick={handleTryAgain}
                className="shadow-2xl"
              >
                {t("recommendation.tryAgain")}
              </Button>
            )}
          </motion.div>
        </div>
      </Container>

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
