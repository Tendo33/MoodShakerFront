"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCcw,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktail } from "@/context/CocktailContext";
import type { Cocktail, Tool } from "@/lib/cocktail-types";
import { CocktailImage } from "@/components/CocktailImage";
import { cocktailLogger, imageLogger } from "@/utils/logger";
import SmartLoadingSystem from "@/components/animations/SmartLoadingSystem";
import { useLocalizedCocktail } from "@/hooks/useLocalizedCocktail";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";
import { CocktailHero } from "@/components/pages/shared/CocktailHero";
import { CocktailActions } from "@/components/pages/shared/CocktailActions";

async function fetchCocktailById(id: string): Promise<Cocktail | null> {
  const response = await fetch(`/api/cocktail/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { data?: Cocktail | null };
  return payload.data || null;
}

const CocktailRecommendation = React.memo(function CocktailRecommendation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cocktailId = searchParams?.get("id");
  const { t, getPathWithLanguage, language } = useLanguage();
  const {
    recommendation: contextCocktail,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    imageError,
    loadSavedData,
    refreshImage,
    submitRequest,
  } = useCocktail();

  const [cocktail, setCocktail] = useState<Cocktail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);

  // Updated design system classes
  const textColorClass = "text-foreground";
  const cardClasses =
    "glass-effect text-foreground transition-all duration-300 hover:shadow-primary/10";
  const gradientText = "gradient-text-bright";
  const {
    getLocalizedContent,
    getLocalizedIngredientName,
    getLocalizedIngredientAmount,
    getLocalizedIngredientUnit,
    getLocalizedToolName,
    getLocalizedStepContent,
  } = useLocalizedCocktail(cocktail);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchCocktail = async () => {
      setIsLoading(true);
      try {
        if (cocktailId) {
          const data = await fetchCocktailById(cocktailId);
          setCocktail(data);
        } else if (contextCocktail) {
          setCocktail(contextCocktail);
        } else {
          loadSavedData();
        }

        // Add a small delay before showing animations
        timer = setTimeout(() => setIsPageLoaded(true), 100);
      } catch (error) {
        cocktailLogger.error("Error fetching cocktail", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCocktail();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [cocktailId, contextCocktail, loadSavedData]);

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

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

  const handleRegenerateRecommendation = async () => {
    if (!submitRequest || cocktailId) return; // Only valid for recommendation page, not db saved items

    try {
      setIsLoading(true);
      await submitRequest(true); // Pass regenerate = true
      // submitRequest updates recommendation context, page re-renders
      router.push(getPathWithLanguage("/cocktail/recommendation"));
    } catch (error) {
      cocktailLogger.error("Error regenerating recommendation", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationToolAlternative = (tool: Tool): string | undefined => {
    if (language === "en" && tool.english_alternative) {
      return tool.english_alternative;
    }
    return tool.alternative;
  };

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

  // If no cocktail found — emotional empty state
  if (!cocktail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center py-16 px-8 glass-panel rounded-3xl border border-white/10 max-w-md w-full"
        >
          {/* Illustrated empty state icon */}
          <motion.div
            className="flex items-center justify-center mb-8"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-60"
              >
                {/* Martini glass — inverted / empty */}
                <path
                  d="M20 20 L50 60 L80 20 Z"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.5"
                />
                <line
                  x1="50"
                  y1="60"
                  x2="50"
                  y2="82"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="35"
                  y1="82"
                  x2="65"
                  y2="82"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Drip drop */}
                <circle
                  cx="50"
                  cy="45"
                  r="4"
                  fill="hsl(var(--secondary))"
                  opacity="0.7"
                />
                {/* Question sparkles */}
                <circle cx="30" cy="35" r="2" fill="hsl(var(--primary))" opacity="0.4" />
                <circle cx="70" cy="28" r="1.5" fill="hsl(var(--secondary))" opacity="0.5" />
                <circle cx="75" cy="50" r="1" fill="hsl(var(--primary))" opacity="0.3" />
              </svg>
            </div>
          </motion.div>

          <h2 className="text-2xl font-bold font-playfair gradient-text mb-3">
            {t("recommendation.notFound")}
          </h2>
          <p className="text-muted-foreground font-source-sans leading-relaxed mb-8">
            {t("recommendation.notFoundDesc")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => router.push(getPathWithLanguage("/questions"))}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium shadow-[0_4px_14px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.6)] transition-all hover:scale-105"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>✨</span>
              <span>{language === "en" ? "Shake One Up" : "重新调制一杯"}</span>
            </motion.button>
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-full glass-effect border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              {t("recommendation.back")}
            </button>
          </div>
        </motion.div>
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

          <CocktailSharePortal
            cocktail={cocktail}
            imageUrl={
              imageData ||
              cocktail.image ||
              `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`
            }
          >
            {({ isGeneratingCard, generateCard }) => (
              <>
              <div className="hidden md:flex items-center gap-3">
                <motion.button
                  onClick={generateCard}
                  disabled={isGeneratingCard}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary/20 hover:bg-primary/30 text-primary transition-all glass-effect border border-primary/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t("recommendation.saveImage")}
                >
                  {isGeneratingCard ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {t("recommendation.saveImage")}
                  </span>
                </motion.button>
              </div>
              <motion.button
                onClick={generateCard}
                disabled={isGeneratingCard}
                className="md:hidden fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.5)] transition-all"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={isPageLoaded ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 25 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={t("recommendation.saveImage")}
              >
                {isGeneratingCard ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
                <span className="font-medium text-sm">
                  {t("recommendation.saveImage")}
                </span>
              </motion.button>
              </>
            )}
          </CocktailSharePortal>
        </motion.div>

        <CocktailHero
          cocktail={cocktail}
          language={language}
          isPageLoaded={isPageLoaded}
          t={t}
          textColorClass={textColorClass}
          gradientTextClass={gradientText}
          getLocalizedContent={getLocalizedContent}
          imageContent={
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

              {imageError && !isImageLoading && (
                <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-destructive/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{imageError}</p>
                    </div>
                    {!cocktailId && (
                      <button
                        onClick={handleRefreshImage}
                        disabled={isRefreshingImage}
                        className="flex-shrink-0 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                      >
                        {language === "en" ? "Retry" : "重试"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          }
        />

        <CocktailRecipeSections
          cocktail={cocktail}
          isPageLoaded={isPageLoaded}
          textColorClass={textColorClass}
          cardClasses={cardClasses}
          getLocalizedIngredientName={getLocalizedIngredientName}
          getLocalizedIngredientAmount={getLocalizedIngredientAmount}
          getLocalizedIngredientUnit={getLocalizedIngredientUnit}
          getLocalizedToolName={getLocalizedToolName}
          getLocalizedStepContent={getLocalizedStepContent}
          getToolAlternative={getRecommendationToolAlternative}
          toolAlternativeLabelKey="recommendation.alternative"
        />

        <CocktailActions
          t={t}
          onBack={handleBack}
          onBrowseMore={() => router.push(getPathWithLanguage("/gallery"))}
          browseMoreLabel={t("recommendation.browseMore")}
          onRegenerate={
            cocktailId
              ? undefined
              : handleRegenerateRecommendation
          }
          regenerateLabel={language === "en" ? "Try Another" : "换一个推荐"}
          isRegenerating={isLoading}
        />
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
});

export default CocktailRecommendation;
