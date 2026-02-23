"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Droplet,
  GlassWater,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Cocktail } from "@/api/cocktail";
import { getCocktailById } from "@/services/cocktailService";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CocktailImage } from "@/components/CocktailImage";
import { cocktailLogger } from "@/utils/logger";
import { Button } from "@/components/ui/core";
import { useLocalizedCocktail } from "@/hooks/useLocalizedCocktail";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";

interface CocktailDetailPageProps {
  id: string;
  initialData?: Cocktail | null;
}

const CocktailDetailPage = React.memo(function CocktailDetailPage({
  id,
  initialData,
}: CocktailDetailPageProps) {
  const router = useRouter();
  const { t, getPathWithLanguage, language } = useLanguage();
  const [cocktail, setCocktail] = useState<Cocktail | null>(
    initialData || null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);

  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Style constants matching Recommendation Page
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
    if (cocktail) {
      const title =
        language === "en" && cocktail.english_name
          ? `${cocktail.english_name} - MoodShaker`
          : `${cocktail.name} - MoodShaker`;
      document.title = title;
    }
  }, [cocktail, language]);

  useEffect(() => {
    if (initialData) {
      setCocktail(initialData);
      setIsLoading(false);
      setTimeout(() => setIsPageLoaded(true), 100);
      return;
    }

    const fetchCocktail = async () => {
      setIsLoading(true);
      try {
        const data = await getCocktailById(id);
        setCocktail(data);
        setTimeout(() => setIsPageLoaded(true), 100);
      } catch (error) {
        cocktailLogger.error("Error fetching cocktail", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCocktail();
  }, [id, initialData]);

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <LoadingSpinner variant="modern" text={t("recommendation.loading")} />
        </motion.div>
      </div>
    );
  }

  if (!cocktail) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-16 md:py-24">
          <div className="text-center py-12 glass-effect rounded-2xl">
            <h2 className={`text-2xl font-medium mb-4 ${textColorClass}`}>
              {t("recommendation.notFound")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("recommendation.notFoundDesc")}
            </p>
            <Button
              onClick={handleBack}
              variant="primary"
            >
              {t("recommendation.back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Shared Background with Recommendation Page */}
      <motion.div
        className="fixed inset-0 overflow-hidden opacity-20 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1] }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            delay: 1,
          }}
        />
      </motion.div>

      <div className="container mx-auto py-12 md:py-20 px-4 relative">
        {/* Navigation */}
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
              variant="ghost"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              {t("recommendation.back")}
            </Button>
          </div>

          <CocktailSharePortal
            cocktail={cocktail}
            imageUrl={
              cocktail.image ||
              `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`
            }
          >
            {({ isGeneratingCard, generateCard }) => (
              <div className="flex items-center gap-3">
                <Button
                  onClick={generateCard}
                  disabled={isGeneratingCard}
                  variant="outline"
                  size="lg"
                  icon={
                    isGeneratingCard ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )
                  }
                  className="text-primary border-primary/30 hover:bg-primary/10"
                >
                  {t("recommendation.saveImage")}
                </Button>
              </div>
            )}
          </CocktailSharePortal>
        </motion.div>

        {/* Hero Section (Aligned with Recommendation Page style) */}
        <motion.div
          className="mb-16 md:mb-24"
          initial="hidden"
          animate={isPageLoaded ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
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
                    cocktailId={id}
                    imageData={cocktail?.image || null}
                    cocktailName={cocktail?.name}
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="w-full lg:w-3/5 flex flex-col"
              style={{ overflow: "visible", minHeight: "auto" }}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <motion.div
                className="text-center lg:text-left space-y-4"
                style={{ paddingBottom: "0.5rem", lineHeight: "1.2" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5 } },
                }}
              >
                <h1
                  className={`text-5xl md:text-6xl font-bold font-playfair ${gradientText} inline-block`}
                  style={{
                    filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
                    lineHeight: "1.1",
                    paddingBottom: "0.25rem",
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

              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                }}
              >
                {/* Specs - same structure as Rec page */}
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("detail.baseSpirit")}
                    </p>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("detail.alcohol")}
                    </p>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("detail.prepTime")}
                    </p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent(
                      "time_required",
                      "english_time_required",
                    ) || (language === "cn" ? "5分钟" : "5 mins")}
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {t("detail.glass")}
                    </p>
                  </div>
                  <p className={`font-bold text-lg ${textColorClass}`}>
                    {getLocalizedContent(
                      "serving_glass",
                      "english_serving_glass",
                    )}
                  </p>
                </motion.div>
              </motion.div>

              {cocktail?.flavor_profiles?.length > 0 && (
                <motion.div
                  className="mt-8"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { duration: 0.5 } },
                  }}
                >
                  <p className="text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                    {t("detail.flavorProfile")}
                  </p>
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
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(255,255,255,0.1)",
                        }}
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
        />
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
    </div>
  );
});

CocktailDetailPage.displayName = "CocktailDetailPage";

export default CocktailDetailPage;
