"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCocktail } from "@/context/CocktailContext";
import { useLanguage } from "@/context/LanguageContext";
import { getCocktailById } from "@/services/cocktailService";
import type { Cocktail } from "@/api/cocktail";
import LoadingSpinner from "@/components/LoadingSpinner";
import CocktailImage from "@/components/CocktailImage";

// Static cocktail images - optimized list with only the most common cocktails
const staticCocktailImages = {
  mojito: "/cocktail-mojito.png",
  margarita: "/cocktail-margarita.png",
  cosmopolitan: "/cocktail-cosmopolitan.png",
  "whiskey-sour": "/classic-whiskey-sour.png",
  manhattan: "/classic-manhattan.png",
  "old-fashioned": "/classic-old-fashioned.png",
  negroni: "/classic-negroni.png",
  daiquiri: "/classic-daiquiri.png",
};

// Animation variants for framer-motion
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function CocktailRecommendation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cocktailId = searchParams?.get("id");
  const { theme } = useTheme();
  const { t, getPathWithLanguage } = useLanguage();
  const {
    recommendation: contextCocktail,
    userFeedback,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    loadSavedData,
    refreshImage,
    setIsImageLoading,
  } = useCocktail();

  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "steps",
  ); // Default expanded section
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);

  // Optimize computed properties with useMemo
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
      theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900",
    [theme],
  );
  const borderClasses = useMemo(
    () => (theme === "dark" ? "border-gray-700" : "border-gray-200"),
    [theme],
  );
  const gradientText =
    "bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent";

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

  const handleTryAgain = () => {
    // Clear local storage and restart the question flow
    if (typeof window !== "undefined") {
      localStorage.removeItem("moodshaker-answers");
      localStorage.removeItem("moodshaker-feedback");
      localStorage.removeItem("moodshaker-recommendation");
      localStorage.removeItem("moodshaker-base-spirits");
    }
    router.push(getPathWithLanguage("/questions"));
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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handle image refresh
  const handleRefreshImage = async () => {
    if (isRefreshingImage) return;

    setIsRefreshingImage(true);
    try {
      await refreshImage();
    } catch (error) {
      console.error("Failed to refresh image:", error);
    } finally {
      setIsRefreshingImage(false);
    }
  };

  // Load cocktail data
  useEffect(() => {
    if (cocktailId) {
      setIsLoading(true);
      getCocktailById(cocktailId)
        .then((data) => {
          if (data) setCocktail(data);
          setIsLoading(false);
          // Add a small delay before showing animations
          setTimeout(() => setIsPageLoaded(true), 100);
        })
        .catch(() => setIsLoading(false));
    } else if (!cocktail) {
      // Always load fresh data from storage
      loadSavedData();

      // Log the loaded data for debugging
      console.log("DEBUG", "Loaded data in recommendation page", {
        hasContextCocktail: !!contextCocktail,
        hasImageData: !!imageData,
        cocktailName: contextCocktail?.name,
      });

      // Set the cocktail from context
      setCocktail(contextCocktail);

      // Add a small delay before showing animations
      setTimeout(() => setIsPageLoaded(true), 100);
    }
  }, [
    cocktailId,
    contextCocktail,
    loadSavedData,
    cocktail,
    getPathWithLanguage,
    imageData,
  ]);

  // Add a useEffect to refresh the component when it mounts
  useEffect(() => {
    // This will ensure we're always showing the latest data
    const checkForUpdates = () => {
      if (!cocktailId && contextCocktail && contextCocktail !== cocktail) {
        console.log("DEBUG", "Updating cocktail from context", {
          oldName: cocktail?.name,
          newName: contextCocktail.name,
        });
        setCocktail(contextCocktail);
      }
    };

    checkForUpdates();

    // Set up an interval to check for updates (useful if the user navigates back and forth)
    const intervalId = setInterval(checkForUpdates, 1000);

    return () => clearInterval(intervalId);
  }, [contextCocktail, cocktail, cocktailId]);

  // Show loading state
  if ((cocktailId && isLoading) || (!cocktailId && isContextLoading)) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${themeClasses}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner text={t("recommendation.loading")} />
        </motion.div>
      </div>
    );
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
            <h2 className={`text-2xl font-medium mb-4 ${textColorClass}`}>
              {t("recommendation.notFound")}
            </h2>
            <p className="text-gray-300 mb-6">
              {t("recommendation.notFoundDesc")}
            </p>
            <button
              onClick={handleBack}
              className="bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
            >
              {t("recommendation.back")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses}`}>
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
          variants={fadeIn}
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("recommendation.back")}</span>
          </button>

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

            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
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
                  className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded whitespace-nowrap"
                >
                  {t("recommendation.copied")}
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* User feedback section with animation */}
        {!cocktailId && userFeedback && (
          <motion.div
            initial="hidden"
            animate={isPageLoaded ? "visible" : "hidden"}
            variants={slideUp}
            className={`mb-8 border ${borderClasses} rounded-xl shadow-lg ${cardClasses}`}
          >
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
              <h3 className={`text-lg font-bold mb-1 ${textColorClass}`}>
                {t("recommendation.yourRequirements")}
              </h3>
              <p className="text-gray-400">{userFeedback}</p>
            </div>
          </motion.div>
        )}

        {/* Hero section with cocktail image and basic info */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Cocktail image with animation */}
            <motion.div className="w-full lg:w-2/5" variants={slideUp}>
              <motion.div
                className={`rounded-2xl overflow-hidden shadow-xl border ${borderClasses} relative aspect-square`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <CocktailImage
                  cocktailId={cocktailId}
                  imageData={imageData}
                  cocktailName={cocktail?.name}
                  staticCocktailImages={staticCocktailImages}
                />

                {/* Add refresh image button */}
                <motion.button
                  className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                  onClick={handleRefreshImage}
                  disabled={isRefreshingImage || isImageLoading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <RefreshCcw
                    className={`h-5 w-5 ${isRefreshingImage || isImageLoading ? "animate-spin" : ""}`}
                  />
                </motion.button>

                {/* Loading overlay for image */}
                {(isRefreshingImage || isImageLoading) && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                      <p>{t("recommendation.imageLoading")}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Cocktail info with animation */}
            <motion.div
              className="w-full lg:w-3/5 flex flex-col"
              variants={slideUp}
            >
              <motion.div
                className="text-center lg:text-left"
                variants={fadeIn}
              >
                <h1
                  className={`text-4xl md:text-5xl font-bold mb-2 ${gradientText} inline-block`}
                >
                  {cocktail?.name}
                </h1>
                {cocktail?.english_name && (
                  <p className="text-gray-400 text-xl mb-4">
                    {cocktail.english_name}
                  </p>
                )}
              </motion.div>

              <motion.div className="mt-4 mb-6" variants={fadeIn}>
                <p className="text-gray-400 leading-relaxed text-lg">
                  {cocktail?.description}
                </p>
              </motion.div>

              {/* Specs grid with animation */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto"
                variants={staggerContainer}
              >
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={slideUp}
                >
                  <div className="flex items-center mb-1">
                    <Beaker className="mr-2 h-5 w-5 text-pink-500" />
                    <p className="text-sm text-gray-400">Base Spirit</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {cocktail?.base_spirit}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={slideUp}
                >
                  <div className="flex items-center mb-1">
                    <Droplet className="mr-2 h-5 w-5 text-blue-500" />
                    <p className="text-sm text-gray-400">Alcohol Level</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {cocktail?.alcohol_level}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={slideUp}
                >
                  <div className="flex items-center mb-1">
                    <Clock className="mr-2 h-5 w-5 text-amber-500" />
                    <p className="text-sm text-gray-400">Prep Time</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {cocktail?.time_required || "5 minutes"}
                  </p>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center md:items-start"
                  variants={slideUp}
                >
                  <div className="flex items-center mb-1">
                    <GlassWater className="mr-2 h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-gray-400">Serving Glass</p>
                  </div>
                  <p className={`font-medium ${textColorClass}`}>
                    {cocktail?.serving_glass}
                  </p>
                </motion.div>
              </motion.div>

              {/* Flavor tags with animation */}
              {cocktail?.flavor_profiles?.length > 0 && (
                <motion.div className="mt-6" variants={fadeIn}>
                  <p className="text-sm text-gray-400 mb-2">Flavor Profile</p>
                  <div className="flex flex-wrap gap-2">
                    {cocktail.flavor_profiles.map((flavor, index) => (
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

        {/* Recommendation reason with animation */}
        {!cocktailId && cocktail?.match_reason && (
          <motion.div
            initial="hidden"
            animate={isPageLoaded ? "visible" : "hidden"}
            variants={slideUp}
            className={`mb-12 border ${borderClasses} rounded-xl shadow-lg ${cardClasses}`}
          >
            <div className="p-5 bg-gradient-to-r from-amber-500/10 to-pink-500/10">
              <h3 className="text-xl font-bold mb-1 text-amber-400">
                {t("recommendation.recommendationReason")}
              </h3>
            </div>
            <div className="p-5">
              <p className="text-gray-400 leading-relaxed">
                {cocktail.match_reason}
              </p>
            </div>
          </motion.div>
        )}

        {/* Recipe section with animation */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.h2
            className={`text-2xl font-bold mb-6 ${gradientText} inline-block`}
            variants={fadeIn}
          >
            Recipe
          </motion.h2>

          {/* Mobile accordion sections */}
          <div className="lg:hidden space-y-4">
            {/* Ingredients Section */}
            <motion.div
              className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
              variants={slideUp}
            >
              <button
                className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-amber-500/20 to-pink-500/20"
                onClick={() => toggleSection("ingredients")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.ingredients")}
                </h3>
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
                          {ingredient.name}
                        </span>
                        <span className="text-amber-400 font-medium">
                          {ingredient.amount}
                          {ingredient.unit ? ` ${ingredient.unit}` : ""}
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
              variants={slideUp}
            >
              <button
                className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-pink-500/20 to-amber-500/20"
                onClick={() => toggleSection("tools")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.tools")}
                </h3>
                {expandedSection === "tools" ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
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
                        <span className={`${textColorClass} font-medium`}>
                          {tool.name}
                        </span>
                        {tool.alternative && (
                          <span className="text-sm text-gray-400 mt-1">
                            Alternative: {tool.alternative}
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
              className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
              variants={slideUp}
            >
              <button
                className="w-full p-5 flex justify-between items-center bg-gradient-to-r from-pink-500/20 to-purple-500/20"
                onClick={() => toggleSection("steps")}
              >
                <h3 className={`text-xl font-bold ${textColorClass}`}>
                  {t("recommendation.steps")}
                </h3>
                {expandedSection === "steps" ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>
              {expandedSection === "steps" && (
                <div className="p-5">
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
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg flex-shrink-0"
                          animate={{
                            scale: activeStep === step.step_number ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {step.step_number}
                        </motion.div>
                        <div className="flex-1">
                          <p
                            className={`${textColorClass} text-base leading-relaxed`}
                          >
                            {step.description}
                          </p>
                          {step.tips && (
                            <motion.div
                              className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              <p className="text-amber-400/70 text-xs flex items-center gap-2">
                                <span className="font-medium">💡 Tip:</span>{" "}
                                {step.tips}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8">
            {/* Left column: Ingredients and Tools */}
            <div className="lg:col-span-4 space-y-8">
              {/* Ingredients with animation */}
              <motion.div
                className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
                variants={slideUp}
              >
                <div className="p-5 bg-gradient-to-r from-amber-500/20 to-pink-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>
                    {t("recommendation.ingredients")}
                  </h3>
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
                          {ingredient.name}
                        </span>
                        <span className="text-amber-400 font-medium">
                          {ingredient.amount}
                          {ingredient.unit ? ` ${ingredient.unit}` : ""}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Tools with animation */}
              <motion.div
                className={`border ${borderClasses} rounded-xl shadow-lg overflow-hidden ${cardClasses}`}
                variants={slideUp}
              >
                <div className="p-5 bg-gradient-to-r from-pink-500/20 to-amber-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>
                    {t("recommendation.tools")}
                  </h3>
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
                        <span className={`${textColorClass} font-medium`}>
                          {tool.name}
                        </span>
                        {tool.alternative && (
                          <span className="text-sm text-gray-400 mt-1">
                            Alternative: {tool.alternative}
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
                variants={slideUp}
              >
                <div className="p-5 bg-gradient-to-r from-pink-500/20 to-purple-500/20">
                  <h3 className={`text-xl font-bold ${textColorClass}`}>
                    {t("recommendation.steps")}
                  </h3>
                </div>
                <div className="p-5">
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
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg flex-shrink-0"
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
                            <p
                              className={`${textColorClass} text-lg leading-relaxed`}
                            >
                              {step.description}
                            </p>
                            {step.tips && (
                              <motion.div
                                className="mt-3 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <p className="text-amber-400/70 text-sm flex items-center gap-2">
                                  <span className="font-medium">💡 Tip:</span>{" "}
                                  {step.tips}
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
                    ))}
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

          {!cocktailId && (
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white shadow-lg px-6 py-3 rounded-full transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-5 w-5" />
              <span>{t("recommendation.tryAgain")}</span>
            </button>
          )}
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
  );
}
