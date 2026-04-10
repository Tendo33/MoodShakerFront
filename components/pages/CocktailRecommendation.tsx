"use client";

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCocktailResult } from "@/context/CocktailResultContext";
import { Button } from "@/components/ui/core";
import type { Cocktail, Tool } from "@/lib/cocktail-types";
import type { RecommendationAccessPayload } from "@/lib/recommendation-access";
import { CocktailImage } from "@/components/CocktailImage";
import { cocktailLogger, imageLogger } from "@/utils/logger";
import SmartLoadingSystem from "@/components/animations/SmartLoadingSystem";
import { useLocalizedCocktail } from "@/hooks/useLocalizedCocktail";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";
import { CocktailHero } from "@/components/pages/shared/CocktailHero";
import { CocktailActions } from "@/components/pages/shared/CocktailActions";
import { RecommendationShareAction } from "@/components/pages/shared/RecommendationShareAction";
import { RecommendationUnavailableState } from "@/components/pages/shared/RecommendationUnavailableState";

interface RecommendationAccessResponse {
  data: RecommendationAccessPayload | null;
  errorCode: string | null;
}

const recommendationFetcher = async (
  [recommendationId, editToken]: [string, string],
): Promise<RecommendationAccessResponse> => {
  const response = await fetch(
    `/api/recommendation/${encodeURIComponent(recommendationId)}`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ editToken }),
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    data?: RecommendationAccessPayload;
    error?: { code?: string };
  } | null;

  if (!response.ok) {
    return {
      data: null,
      errorCode: payload?.error?.code || "REQUEST_FAILED",
    };
  }

  return {
    data: payload?.data || null,
    errorCode: null,
  };
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

  const missingPrivateAccess =
    Boolean(privateRecommendationId) &&
    !activeEditToken &&
    (!contextCocktail ||
      String(contextCocktail.id || "") !== privateRecommendationId);

  const { data: fetchedRecommendation, isLoading: isSWRLoading } =
    useSWR<RecommendationAccessResponse>(
      shouldFetchPrivateRecommendation && activeRecommendationId && activeEditToken
        ? [activeRecommendationId, activeEditToken]
        : null,
      recommendationFetcher,
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

    return fetchedRecommendation?.data?.cocktail || null;
  }, [activeRecommendationId, contextCocktail, fetchedRecommendation?.data?.cocktail]);

  const recommendationAccessError =
    missingPrivateAccess
      ? "ACCESS_TOKEN_UNAVAILABLE"
      : fetchedRecommendation?.errorCode || null;

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

  const isBlockingLoading =
    !cocktail &&
    !recommendationAccessError &&
    (isContextLoading || isSWRLoading);

  const textColorClass = "text-foreground font-mono";
  const cardClasses =
    "glass-panel text-foreground rounded-none border-2 transition-all duration-300 shadow-[0_0_16px_rgba(255,0,255,0.15)] hover:shadow-[0_0_22px_rgba(0,255,255,0.3)]";
  const gradientText =
    "font-black font-heading uppercase tracking-[0.14em] drop-shadow-[0_0_12px_rgba(255,79,216,0.24)]";

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
    const isAccessIssue =
      recommendationAccessError === "ACCESS_TOKEN_UNAVAILABLE" ||
      recommendationAccessError === "FORBIDDEN";
    const title = isAccessIssue
      ? t("recommendation.privateUnavailableTitle")
      : t("recommendation.notFound");
    const description = isAccessIssue
      ? t("recommendation.privateUnavailableDesc")
      : t("recommendation.notFoundDesc");

    return (
      <RecommendationUnavailableState
        title={title}
        description={description}
        backLabel={t("recommendation.back")}
        restartLabel={t("recommendation.startQuestions")}
        onBack={handleBack}
        onRestart={() => router.push(getPathWithLanguage("/questions?new=true"))}
      />
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
            <Button
              onClick={handleBack}
              variant="outline"
              size="md"
              effect="lift"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              {t("recommendation.back")}
            </Button>
          </div>

          <RecommendationShareAction
            cocktail={cocktail}
            imageUrl={
              scopedImageData ||
              cocktail.image ||
              `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`
            }
            saveLabel={t("recommendation.saveImage")}
            shareErrorLabel={t("share.error.generate")}
          />
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
                    className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center border border-white/10 bg-black/55 backdrop-blur-md transition-colors hover:border-secondary/45 hover:bg-black/75"
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
                <div className="absolute bottom-4 left-4 right-4 border border-destructive/50 bg-destructive/88 px-4 py-3 text-white shadow-lg backdrop-blur-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{imageError}</p>
                    </div>
                    <Button
                      onClick={handleRefreshImage}
                      disabled={isRefreshingImage}
                      variant="ghost"
                      size="xs"
                      className="shrink-0 border-white/60 text-white hover:border-white hover:bg-white hover:text-black"
                    >
                      {language === "en" ? "Retry" : "重试"}
                    </Button>
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
