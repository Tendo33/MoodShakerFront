"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Cocktail } from "@/lib/cocktail-types";
import { CocktailImage } from "@/components/CocktailImage";
import { Button } from "@/components/ui/core";
import { useLocalizedCocktail } from "@/hooks/useLocalizedCocktail";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";
import { CocktailHero } from "@/components/pages/shared/CocktailHero";
import { CocktailActions } from "@/components/pages/shared/CocktailActions";

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
  const cocktail = initialData || null;
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
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    router.push(getPathWithLanguage("/"));
  };

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
        className="fixed inset-0 overflow-hidden opacity-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/40 rounded-full blur-[120px] mix-blend-screen"
          animate={{ y: [0, -20, 0], scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/40 rounded-full blur-[120px] mix-blend-screen"
          animate={{ y: [0, 20, 0], scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
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
                  className="text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300"
                >
                  {t("recommendation.saveImage")}
                </Button>
              </div>
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
                cocktailId={id}
                imageData={cocktail?.image || null}
                cocktailName={cocktail?.name}
              />
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
        />
        <CocktailActions t={t} onBack={handleBack} />
      </div>
    </div>
  );
});

CocktailDetailPage.displayName = "CocktailDetailPage";

export default CocktailDetailPage;
