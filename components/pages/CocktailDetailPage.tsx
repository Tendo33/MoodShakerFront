"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Cocktail } from "@/lib/cocktail-types";
import { CocktailImage } from "@/components/CocktailImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CocktailSharePortal } from "@/components/share/CocktailSharePortal";
import { CocktailRecipeSections } from "@/components/pages/CocktailRecipeSections";
import { CocktailHero } from "@/components/pages/shared/CocktailHero";
import { CocktailActions } from "@/components/pages/shared/CocktailActions";
import { enterDuration, enterEase } from "@/utils/animation-utils";

interface CocktailDetailPageProps {
  slug: string;
  initialData?: Cocktail | null;
}

const CocktailDetailPage = React.memo(function CocktailDetailPage({
  slug,
  initialData,
}: CocktailDetailPageProps) {
  const router = useRouter();
  const { t, getPathWithLanguage, language } = useLanguage();
  const cocktail = initialData || null;
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const reduceMotion = useReducedMotion() === true;

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
          <Card variant="effect" className="py-12 text-center">
            <CardHeader>
              <CardTitle className="mb-4 text-2xl font-medium text-foreground">
                {t("recommendation.notFound")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                {t("recommendation.notFoundDesc")}
              </p>
              <Button onClick={handleBack} variant="primary">
                {t("recommendation.back")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container relative mx-auto min-w-0 px-4 py-8 md:py-12">
        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between md:mb-12"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={
            reduceMotion || isPageLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }
          }
          transition={{ duration: reduceMotion ? 0 : enterDuration, ease: enterEase }}
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
              cocktail.imageUrl ||
              `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktail.name)}`
            }
          >
            {({ isGeneratingCard, generationError, generateCard }) => (
              <div className="flex flex-col items-end gap-3">
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
                  className="text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300"
                >
                  {t("recommendation.saveImage")}
                </Button>
                {generationError && (
                  <p className="text-sm text-destructive font-mono">
                    {t("share.error.generate")}
                  </p>
                )}
              </div>
            )}
          </CocktailSharePortal>
        </motion.div>

        <CocktailHero
          cocktail={cocktail}
          language={language}
          isPageLoaded={isPageLoaded}
          t={t}
          imageContent={
            <div className="relative h-full w-full">
              <CocktailImage
                cocktailId={slug}
                imageData={cocktail?.imageUrl || null}
                cocktailName={cocktail?.name}
                priority
              />
            </div>
          }
        >
          <CocktailRecipeSections cocktail={cocktail} isPageLoaded={isPageLoaded} />
        </CocktailHero>
        <CocktailActions t={t} onBack={handleBack} />
      </div>
    </div>
  );
});

CocktailDetailPage.displayName = "CocktailDetailPage";

export default CocktailDetailPage;
