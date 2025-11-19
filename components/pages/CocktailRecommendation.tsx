"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
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
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktail } from "@/context/CocktailContext";
import { getCocktailById } from "@/api/cocktail";
import type { Cocktail, Ingredient, Tool, Step } from "@/api/cocktail";
import { CocktailImage } from "@/components/CocktailImage";
import { cocktailLogger, imageLogger } from "@/utils/logger";
import { commonStyles } from "@/utils/style-constants";
import SmartLoadingSystem from "@/components/animations/SmartLoadingSystem";
import { PolaroidCard } from "@/components/share/PolaroidCard";
import { ShareModal } from "@/components/share/ShareModal";

const CocktailRecommendation = React.memo(function CocktailRecommendation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cocktailId = searchParams?.get("id");
  const { t, getPathWithLanguage, language } = useLanguage();
  const {
    recommendation: contextCocktail,
    userFeedback,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    loadSavedData,
    refreshImage,
  } = useCocktail();

  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  // 移动端手机section展开状态 - 默认全部展开
  const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(true);
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const [isStepsExpanded, setIsStepsExpanded] = useState(true);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);
  
  // Share Card State
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Updated design system classes
  const textColorClass = "text-foreground";
  const cardClasses = "glass-effect text-foreground transition-all duration-300 hover:shadow-primary/10";
  const borderClasses = "border-white/10";
  const gradientText = "gradient-text-bright";

  const getLocalizedContent = (
    field: string,
    englishField: string,
  ): string | undefined => {
    if (language === "en" && cocktail?.[englishField as keyof Cocktail]) {
      return cocktail[englishField as keyof Cocktail] as string;
    }
    return cocktail?.[field as keyof Cocktail] as string;
  };

  const getLocalizedIngredientName = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_name) {
      return ingredient.english_name;
    }
    return ingredient.name;
  };

  const getLocalizedIngredientAmount = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_amount) {
      return ingredient.english_amount;
    }
    return ingredient.amount;
  };

  const getLocalizedIngredientUnit = (ingredient: Ingredient): string => {
    if (language === "en" && ingredient.english_unit) {
      return ingredient.english_unit;
    }
    return ingredient.unit || "";
  };

  const getLocalizedToolName = (tool: Tool): string => {
    if (language === "en" && tool.english_name) {
      return tool.english_name;
    }
    return tool.name;
  };

  const getLocalizedStepContent = (
    step: Step,
  ): { description: string; tips?: string } => {
    if (language === "en") {
      return {
        description: step.english_description || step.description,
        tips: step.english_tips || step.tips,
      };
    }
    return {
      description: step.description,
      tips: step.tips,
    };
  };

  // Set page title based on language
  useEffect(() => {
    if (cocktail) {
      const title =
        language === "en" && cocktail.english_name
          ? `${cocktail.english_name} - MoodShaker`
          : `${cocktail.name} - MoodShaker`;
      document.title = title;
    }
  }, [cocktail, language]);

  useEffect(() => {
    const fetchCocktail = async () => {
      setIsLoading(true);
      try {
        if (cocktailId) {
          const data = await getCocktailById(cocktailId);
          setCocktail(data);
        } else if (contextCocktail) {
          setCocktail(contextCocktail);
        } else {
          loadSavedData();
          if (contextCocktail) {
            setCocktail(contextCocktail);
          }
        }

        // Add a small delay before showing animations
        setTimeout(() => setIsPageLoaded(true), 100);
      } catch (error) {
        cocktailLogger.error("Error fetching cocktail", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCocktail();
  }, [cocktailId, contextCocktail, loadSavedData]);

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

  const handleShare = () => {
    try {
      if (navigator.share && window.isSecureContext) {
        navigator
          .share({
            title: `${cocktail?.name} Recipe - MoodShaker`,
            text: `Check out this ${cocktail?.name} recipe from MoodShaker!`,
            url: window.location.href,
          })
          .catch(() => copyToClipboard());
      } else {
        copyToClipboard();
      }
    } catch (err) {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    } catch (err) {
      alert(`Copy this URL: ${window.location.href}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleSection = useCallback((section: string) => {
    switch (section) {
      case "ingredients":
        setIsIngredientsExpanded(!isIngredientsExpanded);
        break;
      case "tools":
        setIsToolsExpanded(!isToolsExpanded);
        break;
      case "steps":
        setIsStepsExpanded(!isStepsExpanded);
        break;
    }
  }, [isIngredientsExpanded, isToolsExpanded, isStepsExpanded]);

  const handleRefreshImage = async () => {
    if (refreshImage && cocktail) {
      setIsRefreshingImage(true);
      try {
        await refreshImage();
      } catch (error) {
        imageLogger.error("Error refreshing image", error);
      } finally {
        setIsRefreshingImage(false);
      }
    }
  };

  const handleGenerateCard = useCallback(async () => {
    if (!cardRef.current) return;
    
    setIsGeneratingCard(true);
    try {
      // Add a small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        // Removed forced white background to respect component's dark theme
        skipAutoScale: true,
      });
      
      setGeneratedCardUrl(dataUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error('Failed to generate card', error);
      // Fallback or alert
    } finally {
      setIsGeneratingCard(false);
    }
  }, []);

  if (isLoading || isContextLoading) {
    return (
      <SmartLoadingSystem
        isShowing={true}
        type="recommendation"
        message={t("recommendation.loading")}
        estimatedDuration={4000}
        onComplete={() => setIsLoading(false)}
      />
    );
  }

  // If no cocktail found
  if (!cocktail) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 glass-effect rounded-2xl"
          >
            <h2 className={`text-2xl font-medium mb-4 ${textColorClass}`}>
              {t("recommendation.notFound")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("recommendation.notFoundDesc")}
            </p>
            <button
              onClick={handleBack}
              className={commonStyles.primaryButtonFull}
            >
              {t("recommendation.back")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <motion.div
        className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
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
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"
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

      <div className="container mx-auto py-12 md:py-20 px-4 relative">
        {/* Navigation bar with animation */}
        <motion.div
          className="flex flex-wrap justify-between items-center mb-8 md:mb-12"
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
              className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors glass-effect border-none"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("recommendation.back")}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={handlePrint}
              className="p-3 rounded-full hover:bg-white/10 transition-colors glass-effect border-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Print recipe"
            >
              <Printer className="h-5 w-5" />
            </motion.button>

            <motion.button
              onClick={handleGenerateCard}
              disabled={isGeneratingCard}
              className="p-3 rounded-full hover:bg-white/10 transition-colors glass-effect border-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Generate Share Card"
            >
              {isGeneratingCard ? (
                 <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                 <ImageIcon className="h-5 w-5" />
              )}
            </motion.button>

            <motion.button
              className="p-3 rounded-full hover:bg-white/10 transition-colors glass-effect border-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Save recipe"
            >
              <BookmarkPlus className="h-5 w-5" />
            </motion.button>

            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={handleShare}
                className="p-3 rounded-full hover:bg-white/10 transition-colors glass-effect border-none"
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
          className="mb-16 md:mb-24"
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
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            {/* Cocktail image with animation */}
            <motion.div
              className="w-full lg:w-2/5"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                className="rounded-3xl overflow-hidden shadow-2xl glass-effect relative aspect-square p-2"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              >
                <div className="rounded-2xl overflow-hidden w-full h-full relative">
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
                        className="p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10"
                      >
                        <RefreshCcw
                          className={`h-5 w-5 text-white ${isRefreshingImage || isImageLoading ? "animate-spin" : ""}`}
                        />
                      </button>
                    </motion.div>
                  )}
                </div>

                {(isRefreshingImage || isImageLoading) && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-white font-medium">
                        {t("recommendation.imageLoading")}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Cocktail info with animation */}
            <motion.div
              className="w-full lg:w-3/5 flex flex-col"
              style={{ 
                overflow: 'visible',
                minHeight: 'auto'
              }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                className="text-center lg:text-left space-y-4"
                style={{ 
                  paddingBottom: '0.5rem',
                  lineHeight: '1.2'
                }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5 } },
                }}
              >
                <h1
                  className={`text-5xl md:text-6xl font-bold font-playfair ${gradientText} inline-block`}
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
                    lineHeight: '1.1',
                    paddingBottom: '0.25rem',
                    minHeight: 'auto',
                    overflow: 'visible'
                  }}
                >
                  {getLocalizedContent("name", "english_name")}
                </h1>
                {cocktail?.english_name && language === "cn" && (
                  <p className="text-muted-foreground text-2xl font-playfair italic">
                    {cocktail.english_name}
                  </p>
                )}
              </motion.div>

              <motion.div
                className="mt-8 mb-10"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5 } },
                }}
              >
                <p className="text-foreground/80 leading-relaxed text-xl font-source-sans max-w-2xl">
                  {getLocalizedContent("description", "english_description")}
                </p>
              </motion.div>

              {/* Specs grid with animation */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto"
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
                  className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-2">
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Base Spirit</p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent("base_spirit", "english_base_spirit")}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-2">
                    <Droplet className="mr-2 h-5 w-5 text-blue-500" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Alcohol</p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent(
                      "alcohol_level",
                      "english_alcohol_level",
                    )}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-2">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Prep Time</p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent(
                      "time_required",
                      "english_time_required",
                    ) || "5 mins"}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start p-4 rounded-xl glass-effect border-none bg-white/5"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5 },
                    },
                  }}
                >
                  <div className="flex items-center mb-2">
                    <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Glass</p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent(
                      "serving_glass",
                      "english_serving_glass",
                    )}
                  </p>
                </motion.div>
              </motion.div>

              {/* Flavor tags with animation */}
              {cocktail?.flavor_profiles?.length > 0 && (
                <motion.div
                  className="mt-8"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.5 } },
                  }}
                >
                  <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">Flavor Profile</p>
                  <div className="flex flex-wrap gap-3">
                    {(language === "en" && cocktail.english_flavor_profiles
                      ? cocktail.english_flavor_profiles
                      : cocktail.flavor_profiles
                    ).map((flavor, index) => (
                      <motion.span
                        key={index}
                        className="px-4 py-1.5 glass-effect rounded-full text-sm font-medium text-foreground/90"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
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
          className="mb-20"
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
            className={`text-3xl md:text-4xl font-bold font-playfair mb-10 ${gradientText} inline-block`}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            Recipe
          </motion.h2>

          {/* Mobile accordion sections */}
          <div className="lg:hidden space-y-6">
            {/* Ingredients Section */}
            <motion.div
              className={`rounded-xl overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <button
                className="w-full p-6 flex justify-between items-center bg-white/5"
                onClick={() => toggleSection("ingredients")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.ingredients")}
                </h3>
                {isIngredientsExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {isIngredientsExpanded && (
                <div className="p-6 bg-black/20">
                  <ul className="divide-y divide-white/10">
                    {cocktail?.ingredients?.map((ingredient, index) => (
                      <motion.li
                        key={index}
                        className="py-4 flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedIngredientName(ingredient)}
                        </span>
                        <span className="text-primary font-medium">
                          {getLocalizedIngredientAmount(ingredient)}
                          {getLocalizedIngredientUnit(ingredient)
                            ? ` ${getLocalizedIngredientUnit(ingredient)}`
                            : ""}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Tools Section */}
            <motion.div
              className={`rounded-xl overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <button
                className="w-full p-6 flex justify-between items-center bg-white/5"
                onClick={() => toggleSection("tools")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.tools")}
                </h3>
                {isToolsExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {isToolsExpanded && (
                <div className="p-6 bg-black/20">
                  <ul className="space-y-4">
                    {cocktail?.tools?.map((tool, index) => (
                      <motion.li
                        key={index}
                        className="flex flex-col"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedToolName(tool)}
                        </span>
                        {tool.alternative && (
                          <span className="text-sm text-muted-foreground mt-1 italic">
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

            {/* Steps Section */}
            <motion.div
              className={`rounded-xl overflow-hidden ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <button
                className="w-full p-6 flex justify-between items-center bg-white/5"
                onClick={() => toggleSection("steps")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.steps")}
                </h3>
                {isStepsExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {isStepsExpanded && (
                <div className="p-6 bg-black/20">
                  <ol className="space-y-10">
                    {cocktail?.steps?.map((step) => {
                      const localizedStep = getLocalizedStepContent(step);
                      return (
                        <motion.li
                          key={step.step_number}
                          className="flex gap-5"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: step.step_number * 0.1 }}
                          onMouseEnter={() => setActiveStep(step.step_number)}
                          onMouseLeave={() => setActiveStep(null)}
                        >
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 font-bold text-foreground shrink-0 z-10 text-sm"
                          >
                            {step.step_number}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={`${textColorClass} text-lg leading-relaxed`}
                            >
                              {localizedStep.description}
                            </p>
                            {localizedStep.tips && (
                              <motion.div
                                className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <p className="text-amber-400/70 text-xs flex items-center gap-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                  <span>{localizedStep.tips}</span>
                                </p>
                              </motion.div>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </motion.div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-10">
            {/* Left column: Ingredients and Tools */}
            <div className="lg:col-span-4 space-y-8 sticky top-24 self-start">
              {/* Ingredients with animation */}
              <motion.div
                className={`rounded-2xl overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-6 bg-white/5 border-b border-white/5">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>
                    {t("recommendation.ingredients")}
                  </h3>
                </div>
                <div className="p-6 bg-black/10">
                  <ul className="divide-y divide-white/10">
                    {cocktail?.ingredients?.map((ingredient, index) => (
                      <motion.li
                        key={index}
                        className="py-4 flex justify-between items-center"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedIngredientName(ingredient)}
                        </span>
                        <span className="text-primary font-bold">
                          {getLocalizedIngredientAmount(ingredient)}
                          {getLocalizedIngredientUnit(ingredient)
                            ? ` ${getLocalizedIngredientUnit(ingredient)}`
                            : ""}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Tools with animation */}
              <motion.div
                className={`rounded-2xl overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-6 bg-white/5 border-b border-white/5">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>
                    {t("recommendation.tools")}
                  </h3>
                </div>
                <div className="p-6 bg-black/10">
                  <ul className="space-y-4">
                    {cocktail?.tools?.map((tool, index) => (
                      <motion.li
                        key={index}
                        className="flex flex-col"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <span className={`${textColorClass} font-medium`}>
                          {getLocalizedToolName(tool)}
                        </span>
                        {tool.alternative && (
                          <span className="text-sm text-muted-foreground mt-1 italic">
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
                className={`rounded-2xl overflow-hidden ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <div className="p-6 bg-white/5 border-b border-white/5">
                  <h3 className={`text-2xl font-bold ${textColorClass}`}>
                    {t("recommendation.steps")}
                  </h3>
                </div>
                <div className="p-6 bg-black/10">
                  <ol className="space-y-12">
                    {cocktail?.steps?.map((step) => {
                      const localizedStep = getLocalizedStepContent(step);
                      return (
                        <motion.li
                          key={step.step_number}
                          className="relative pl-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: step.step_number * 0.1 }}
                          onMouseEnter={() => setActiveStep(step.step_number)}
                          onMouseLeave={() => setActiveStep(null)}
                        >
                          <div className="flex gap-5">
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 border border-white/20 font-bold text-foreground shrink-0 z-10 text-sm"
                            >
                              {step.step_number}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p
                                className={`${textColorClass} text-lg leading-relaxed`}
                              >
                                {localizedStep.description}
                              </p>
                              {localizedStep.tips && (
                                <motion.div
                                  className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <p className="text-amber-400/70 text-xs flex items-start gap-1.5">
                                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <span>{localizedStep.tips}</span>
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Step progress line */}
                          {step.step_number <
                            (cocktail?.steps?.length || 0) && (
                            <div className="absolute left-[1.2rem] top-10 bottom-[-1.5rem] w-px bg-gradient-to-b from-white/20 to-white/5"></div>
                          )}
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons with animation */}
        <motion.div
          className="mt-16 flex flex-col sm:flex-row gap-6 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button
            onClick={handleBack}
            className="flex items-center justify-center gap-2 px-8 py-4 border border-white/10 rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-105 glass-effect"
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

      {/* Hidden Polaroid Card for Generation */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        {cocktail && (
            <PolaroidCard 
                ref={cardRef} 
                cocktail={cocktail} 
                imageUrl={imageData || cocktail.image || `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`} 
            />
        )}
      </div>

      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        imageUrl={generatedCardUrl} 
      />
    </div>
  );
});

CocktailRecommendation.displayName = "CocktailRecommendation";

export default CocktailRecommendation;
