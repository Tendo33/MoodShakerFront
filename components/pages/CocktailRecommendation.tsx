"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Loader2, RefreshCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktailResult } from "@/context/CocktailResultContext";
import type { Cocktail, RecommendationResponse, Tool } from "@/lib/cocktail-types";
import { CocktailImage } from "@/components/CocktailImage";
import { cocktailLogger, imageLogger } from "@/utils/logger";
import SmartLoadingSystem from "@/components/animations/SmartLoadingSystem";
import { useLocalizedCocktail } from "@/hooks/useLocalizedCocktail";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";
import { CocktailHero } from "@/components/pages/shared/CocktailHero";
import { CocktailActions } from "@/components/pages/shared/CocktailActions";

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: RecommendationResponse;
  };
  return payload.data || null;
};

const CocktailRecommendation = React.memo(function CocktailRecommendation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const privateRecommendationId = searchParams?.get("id") || null;
  const { t, getPathWithLanguage, language } = useLanguage();
  const {
    recommendation: contextCocktail,
    recommendationMeta,
    imageData,
    isLoading: isContextLoading,
    isImageLoading,
    imageError,
    loadSavedData,
    refreshImage,
    submitRequest,
  } = useCocktailResult();

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  const activeRecommendationId =
    privateRecommendationId || recommendationMeta?.recommendationId || null;
  const activeEditToken =
    activeRecommendationId &&
    recommendationMeta?.recommendationId === activeRecommendationId
      ? recommendationMeta.editToken
      : null;

  const shouldFetchPrivateRecommendation =
    Boolean(activeRecommendationId) &&
    Boolean(activeEditToken) &&
    (!contextCocktail ||
      String(contextCocktail.id || "") !== activeRecommendationId);

  const { data: fetchedRecommendation, isLoading: isSWRLoading } =
    useSWR<RecommendationResponse | null>(
      shouldFetchPrivateRecommendation
        ? `/api/recommendation/${encodeURIComponent(
            activeRecommendationId || "",
          )}?editToken=${encodeURIComponent(activeEditToken || "")}`
        : null,
      fetcher,
      { revalidateOnFocus: false },
    );

  const cocktail = useMemo<Cocktail | null>(() => {
    if (
      activeRecommendationId &&
      contextCocktail &&
      String(contextCocktail.id || "") === activeRecommendationId
    ) {
      return contextCocktail;
    }

    if (!activeRecommendationId && contextCocktail) {
      return contextCocktail;
    }

    return fetchedRecommendation?.cocktail || null;
  }, [activeRecommendationId, contextCocktail, fetchedRecommendation?.cocktail]);

  const canEditCurrentRecommendation =
    Boolean(recommendationMeta) &&
    Boolean(activeRecommendationId) &&
    recommendationMeta?.recommendationId === activeRecommendationId;

  const scopedImageData =
    canEditCurrentRecommendation && cocktail
      ? imageData
      : null;

  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const isBlockingLoading = !cocktail && (isContextLoading || isSWRLoading);

  const textColorClass = "text-foreground font-mono";
  const cardClasses =
    "glass-panel text-foreground rounded-none border-2 transition-all duration-300 shadow-[0_0_16px_rgba(255,0,255,0.15)] hover:shadow-[0_0_22px_rgba(0,255,255,0.3)]";
  const gradientText =
    "font-black font-heading tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]";

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
    if (cocktail) {
      timer = setTimeout(() => setIsPageLoaded(true), 100);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [cocktail]);

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

  const handleRefreshImage = async () => {
    if (!canEditCurrentRecommendation || !cocktail) {
      return;
    }

    setIsRefreshingImage(true);
    try {
      await refreshImage();
    } catch (error) {
      imageLogger.error("Error refreshing image", error);
    } finally {
      setIsRefreshingImage(false);
    }
  };

  const handleRegenerateRecommendation = async () => {
    if (!submitRequest || !canEditCurrentRecommendation) {
      return;
    }

    try {
      setIsRegenerating(true);
      await submitRequest(true);
      router.push(getPathWithLanguage("/cocktail/recommendation"));
    } catch (error) {
      cocktailLogger.error("Error regenerating recommendation", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getRecommendationToolAlternative = (tool: Tool): string | undefined => {
    if (language === "en" && tool.english_alternative) {
      return tool.english_alternative;
    }
    return tool.alternative;
  };

  if (isBlockingLoading) {
    return (
      <SmartLoadingSystem
        isShowing={true}
        actualProgress={0}
        type="recommendation"
        message={t("recommendation.loading")}
        estimatedDuration={3000}
      />
    );
  }

  if (!cocktail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="text-center py-16 px-8 glass-panel rounded-none border-2 border-primary shadow-[0_0_22px_rgba(255,0,255,0.2)] max-w-md w-full relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-size-[100%_4px] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] pointer-events-none mix-blend-overlay" />
          <h2 className="text-2xl font-black font-heading uppercase tracking-widest text-primary drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] mb-3 relative z-10">
            {t("recommendation.notFound")}
          </h2>
          <p className="text-foreground font-mono leading-relaxed mb-8 relative z-10 bg-black/40 p-4 border-l-2 border-primary">
            {t("recommendation.notFoundDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <motion.button
              onClick={() => router.push(getPathWithLanguage("/questions?new=true"))}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] focus-ring"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span aria-hidden="true">↺</span>
              <span>{language === "en" ? "Start Again" : "重新开始"}</span>
            </motion.button>
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-secondary text-secondary transition-all duration-300 hover:bg-secondary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] focus-ring"
            >
              {t("recommendation.back")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden pt-20">
      <div className="container mx-auto pb-12 md:pb-20 px-4 relative z-10">
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
              className="flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-black font-mono uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,0,255,0.4)] focus-ring"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("recommendation.back")}</span>
            </button>
          </div>

          <CocktailSharePortal
            cocktail={cocktail}
            imageUrl={
              scopedImageData ||
              cocktail.image ||
              `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`
            }
          >
            {({ isGeneratingCard, generateCard }) => (
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={generateCard}
                  disabled={isGeneratingCard}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-secondary text-secondary hover:bg-secondary hover:text-black transition-all duration-300 shadow-[0_0_16px_rgba(0,255,255,0.3)] hover:shadow-[0_0_28px_rgba(0,255,255,0.6)] font-mono font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t("recommendation.saveImage")}
                >
                  {isGeneratingCard ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                  <span className="font-medium">{t("recommendation.saveImage")}</span>
                </motion.button>
              </div>
            )}
          </CocktailSharePortal>
        </motion.div>

        <CocktailHero
          cocktail={cocktail}
          language={language}
          isPageLoaded={isPageLoaded}
          t={t}
          gradientTextClass={gradientText}
          getLocalizedContent={getLocalizedContent}
          imageContent={
            <div className="rounded-none overflow-hidden w-full h-full relative border-[3px] border-primary/30">
              <CocktailImage
                cocktailId={canEditCurrentRecommendation ? undefined : String(cocktail.id || "")}
                imageData={scopedImageData || cocktail.image || null}
                cocktailName={cocktail.name}
                priority
              />

              {canEditCurrentRecommendation && (
                <motion.div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleRefreshImage}
                    disabled={isRefreshingImage || isImageLoading}
                    className="p-3 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/70 transition-colors border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label={language === "en" ? "Refresh image" : "刷新图片"}
                  >
                    <RefreshCcw
                      className={`h-5 w-5 text-white ${
                        isRefreshingImage || isImageLoading ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </motion.div>
              )}

              {(isRefreshingImage || isImageLoading) && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-none">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-white font-medium">
                      {t("recommendation.imageLoading")}
                    </p>
                  </div>
                </div>
              )}

              {imageError && canEditCurrentRecommendation && !isImageLoading && (
                <div className="absolute bottom-4 left-4 right-4 bg-destructive/90 backdrop-blur-md text-white px-4 py-3 rounded-xl border border-destructive/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{imageError}</p>
                    </div>
                    <button
                      onClick={handleRefreshImage}
                      disabled={isRefreshingImage}
                      className="shrink-0 px-3 py-1 border border-white text-white hover:bg-white hover:text-black font-mono uppercase text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {language === "en" ? "Retry" : "重试"}
                    </button>
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
          onRegenerate={canEditCurrentRecommendation ? handleRegenerateRecommendation : undefined}
          regenerateLabel={language === "en" ? "Try Another" : "换一个推荐"}
          isRegenerating={isRegenerating}
        />
      </div>
    </div>
  );
});

export default CocktailRecommendation;
