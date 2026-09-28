"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { useAsyncState } from "@/hooks/useAsyncState";
import type { RecommendationMeta } from "@/lib/cocktail-types";
import { hasRecoverableRecommendation } from "@/lib/recommendation-state";
import { useImagePreload } from "@/utils/performance-utils";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/carousel";
import HomeFeatures from "./HomeFeatures";
import HomePopular, { featuredDrinks } from "./HomePopular";

const Home = React.memo(function Home() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const drinks = useMemo(() => featuredDrinks(language), [language]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: savedAnswers } = useAsyncState({
    storageKey: "moodshaker-answers",
    defaultValue: {},
    immediate: true,
  });

  const { data: savedRecommendation } = useAsyncState<Record<string, unknown> | null>({
    storageKey: "moodshaker-recommendation",
    defaultValue: null,
    immediate: true,
  });

  const { data: savedRecommendationMeta } = useAsyncState<RecommendationMeta | null>({
    storageKey: "moodshaker-recommendation-meta",
    defaultValue: null,
    immediate: true,
  });

  const hasStoredRecommendation = savedRecommendation !== null;
  const hasRecoverableRemoteRecommendation =
    hasRecoverableRecommendation(savedRecommendationMeta);
  const hasRecommendation =
    hasStoredRecommendation || hasRecoverableRemoteRecommendation;
  const hasSavedSession =
    !hasRecommendation &&
    savedAnswers !== null &&
    Object.keys(savedAnswers as Record<string, unknown>).length > 0;

  useImagePreload(drinks.map((drink) => drink.image));

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const sync = () => setActiveIndex(carouselApi.selectedScrollSnap());
    sync();
    carouselApi.on("select", sync);
    return () => {
      carouselApi.off("select", sync);
    };
  }, [carouselApi]);

  const questionsPath = getPathWithLanguage("/questions");
  const newQuestionPath = getPathWithLanguage("/questions?new=true");
  const recommendationPath = hasRecoverableRemoteRecommendation
    ? getPathWithLanguage(
        `/cocktail/recommendation?id=${encodeURIComponent(
          savedRecommendationMeta.recommendationId,
        )}`,
      )
    : getPathWithLanguage("/cocktail/recommendation");

  return (
    <div className="bg-background text-foreground">
      <section className="grid min-h-[calc(100vh-5rem)] grid-cols-1 md:h-[calc(100vh-5rem)] md:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] md:overflow-hidden">
        <div className="flex flex-col justify-center gap-6 px-4 py-10 md:overflow-y-auto md:px-8 lg:px-12">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-foreground/55">
            {language === "en" ? "Night index" : "今夜索引"}
          </p>
          <div className="flex flex-col gap-4">
            <h1 className="text-safe-wrap font-heading text-[clamp(1.75rem,4vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-[0.08em] text-foreground">
              {t("home.title")}
            </h1>
            {hasRecommendation ? (
              <p className="font-mono text-sm uppercase tracking-[0.14em] text-foreground/78">
                <Link
                  href={recommendationPath}
                  className="focus-ring text-primary hover:text-secondary"
                >
                  {language === "en" ? "View recommendation" : "查看推荐"}
                </Link>
                <span aria-hidden="true"> / </span>
                <Link href={newQuestionPath} className="focus-ring hover:text-secondary">
                  {t("home.new")}
                </Link>
              </p>
            ) : hasSavedSession ? (
              <p className="font-mono text-sm uppercase tracking-[0.14em] text-foreground/78">
                <Link href={questionsPath} className="focus-ring text-primary hover:text-secondary">
                  {t("home.continue")}
                </Link>
                <span aria-hidden="true"> / </span>
                <Link href={newQuestionPath} className="focus-ring hover:text-secondary">
                  {t("home.new")}
                </Link>
              </p>
            ) : null}
            <p className="max-w-md font-mono text-base leading-relaxed text-foreground/80">
              {t("home.subtitle")}
            </p>
          </div>
          <Button
            size="lg"
            iconPosition="right"
            icon={<ArrowRight className="h-5 w-5" />}
            href={questionsPath}
            variant="primary"
            className="self-start"
          >
            {t("home.start")}
          </Button>
          <div
            className="flex gap-2"
            role="group"
            aria-label={language === "en" ? "Featured drinks" : "推荐酒款"}
          >
            {drinks.map((drink, index) => {
              const selected = index === activeIndex;
              return (
                <button
                  key={drink.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={drink.name}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={cn(
                    "focus-ring min-h-11 min-w-11 border px-3 font-mono text-sm tracking-[0.16em]",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/15 bg-transparent text-foreground/70 hover:border-secondary hover:text-secondary",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative min-w-0 bg-black md:h-full md:overflow-hidden">
          <HomePopular drinks={drinks} setApi={setCarouselApi} />
        </div>
      </section>

      <HomeFeatures />
    </div>
  );
});

Home.displayName = "Home";

export default Home;
