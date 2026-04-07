"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TargetAndTransition, Variants } from "framer-motion";
import {
  ArrowRight,
  History,
  ChevronRight,
  Sparkles,
  Martini,
  Library,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { Button, Container, GradientText } from "@/components/ui/core";
import {
  animations,
  useDelayedAnimation,
  floatAnimation,
  pulseAnimation,
  useInViewAnimation,
} from "@/utils/animation-utils";
import HomeFeatures from "./HomeFeatures";
import HomePopular from "./HomePopular";
import { useImagePreload } from "@/utils/performance-utils";
import { useAsyncState } from "@/hooks/useAsyncState";
import type { RecommendationMeta } from "@/lib/cocktail-types";

import { cocktailImages } from "@/utils/cocktail-images";

// Robust Image component that handles errors without direct DOM manipulation
type SafeImageProps = Omit<React.ComponentProps<typeof Image>, "src" | "alt"> & {
  src?: string;
  fallbackSrc: string;
  alt: string;
};

const SafeImage = React.memo(function SafeImage({
  src,
  fallbackSrc,
  alt,
  onError,
  ...props
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const preferredSrc = src ?? fallbackSrc;
  const imgSrc = failedSrc === preferredSrc ? fallbackSrc : preferredSrc;

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={(event) => {
        setFailedSrc(preferredSrc);
        onError?.(event);
      }}
    />
  );
});
SafeImage.displayName = "SafeImage";

const Home = React.memo(function Home() {
  const { t, language, getPathWithLanguage } = useLanguage();
  const [currentCocktailIndex, setCurrentCocktailIndex] = useState(0);

  const shouldAnimate = useDelayedAnimation(100);

  // Use in-view animation hooks for sections
  const [ctaRef, ctaInView] = useInViewAnimation();

  // 使用异步状态检查保存的会话 - 性能优化核心
  const { data: savedAnswers } = useAsyncState({
    storageKey: "moodshaker-answers",
    defaultValue: {},
    immediate: true, // 立即加载但不阻塞渲染
  });

  // 检查是否有推荐结果
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

  // 计算会话状态
  const hasRecommendation =
    savedRecommendation !== null && savedRecommendationMeta !== null;
  const hasSavedSession =
    !hasRecommendation &&
    savedAnswers !== null &&
    Object.keys(savedAnswers as Record<string, unknown>).length > 0;

  // Featured cocktails for the hero section with translations - 使用 useMemo 优化性能
  interface FeaturedCocktail {
    id: string;
    name: string;
    englishName: string;
    description: string;
    image: string;
    tags: string[];
  }

  const featuredCocktails = useMemo<FeaturedCocktail[]>(
    () => [
      {
        id: "mojito",
        name: language === "en" ? "Mojito" : "莫吉托",
        englishName: "Mojito",
        description:
          language === "en"
            ? "A refreshing blend of mint and lime"
            : "清新薄荷与青柠的完美结合",
        image: cocktailImages.mojito,
        tags:
          language === "en"
            ? ["Refreshing", "Mint", "Rum"]
            : ["清爽", "薄荷", "朗姆酒"],
      },
      {
        id: "margarita",
        name: language === "en" ? "Margarita" : "玛格丽特",
        englishName: "Margarita",
        description:
          language === "en"
            ? "Classic tequila cocktail with perfect balance"
            : "经典龙舌兰鸡尾酒，酸甜平衡",
        image: cocktailImages.margarita,
        tags:
          language === "en"
            ? ["Classic", "Tangy", "Tequila"]
            : ["经典", "酸甜", "龙舌兰"],
      },
      {
        id: "cosmopolitan",
        name: language === "en" ? "Cosmopolitan" : "大都会",
        englishName: "Cosmopolitan",
        description:
          language === "en"
            ? "Stylish cranberry vodka cocktail"
            : "时尚优雅的蔓越莓伏特加鸡尾酒",
        image: cocktailImages.cosmopolitan,
        tags:
          language === "en"
            ? ["Stylish", "Fruity", "Vodka"]
            : ["时尚", "果味", "伏特加"],
      },
    ],
    [language],
  ); // 仅在语言变化时重新计算

  // 性能优化：预加载关键图片
  const imageUrls = useMemo(
    () => featuredCocktails.map((cocktail) => cocktail.image).filter(Boolean),
    [featuredCocktails],
  );
  useImagePreload(imageUrls);

  // Rotate featured cocktails
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCocktailIndex((prev) => (prev + 1) % featuredCocktails.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredCocktails.length]);

  const questionsPath = getPathWithLanguage("/questions");
  const newQuestionPath = getPathWithLanguage("/questions?new=true");
  const galleryPath = getPathWithLanguage("/gallery");
  const recommendationPath =
    savedRecommendationMeta?.recommendationId
      ? getPathWithLanguage(
          `/cocktail/recommendation?id=${encodeURIComponent(
            savedRecommendationMeta.recommendationId,
          )}`,
        )
      : getPathWithLanguage("/cocktail/recommendation");
  const floatAnimationTarget = floatAnimation as TargetAndTransition;
  const delayedFloatAnimation = (delay: number): TargetAndTransition => ({
    ...floatAnimation,
    transition: { ...floatAnimation.transition, delay },
  });
  const pulseGlowAnimation: TargetAndTransition = {
    ...pulseAnimation,
    scale: [1, 1.1, 1],
    opacity: [0.6, 0.8, 0.6],
  };
  const staggerContainerVariants = animations.staggerContainer as Variants;
  const slideUpVariants = animations.slideUp as Variants;

  return (
    <div className="bg-background text-foreground">
      <section className="relative hero-height flex items-center section-spacing pt-16 md:pt-20 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/18 blur-[72px]"
            animate={floatAnimationTarget}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 h-72 w-72 rounded-full bg-secondary/18 blur-[72px]"
            animate={delayedFloatAnimation(1)}
          />
          <motion.div
            className="absolute top-2/3 right-1/3 h-56 w-56 rounded-full bg-accent/12 blur-[60px]"
            animate={delayedFloatAnimation(2)}
          />
        </div>

        <Container size="xl">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={staggerContainerVariants}
              className="content-spacing"
            >
              <motion.div variants={slideUpVariants} className="mb-6">
                <div className="inline-flex items-center bg-transparent text-primary border-2 border-primary px-4 py-2 text-sm rounded-none font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,0,255,0.4)]">
                  <Sparkles className="h-4 w-4 mr-2 text-secondary animate-neon-pulse" />
                  {language === "en"
                    ? "AI-Powered Cocktail Recommendations"
                    : "AI 驱动的鸡尾酒推荐"}
                </div>
              </motion.div>

              <motion.h1
                className="font-heading font-black text-6xl md:text-8xl lang-en:text-6xl lang-en:md:text-8xl leading-none mb-6 text-shadow"
                variants={slideUpVariants}
              >
                <GradientText as="span" className="block leading-tight drop-shadow-[0_0_16px_rgba(255,0,255,0.6)]">
                  {t("home.title")}
                </GradientText>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl lang-en:text-lg lang-en:md:text-xl text-foreground font-mono leading-relaxed max-w-xl mb-8 tracking-wide drop-shadow-md"
                variants={slideUpVariants}
              >
                {t("home.subtitle")}
              </motion.p>

              {hasRecommendation ? (
                <motion.div
                  className="glass-panel p-6 rounded-none border-t-2 border-t-secondary border-b-2 border-b-primary shadow-[0_0_22px_rgba(0,255,255,0.15)] max-w-lg mb-8 relative overflow-hidden"
                  variants={slideUpVariants}
                >
                  {/* Decorative Scanline inside card */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] pointer-events-none mix-blend-overlay"></div>
                  
                  <div className="flex items-center mb-6 relative z-10">
                    <motion.div
                      className="w-12 h-12 bg-black border-2 border-secondary flex items-center justify-center mr-4 shadow-[0_0_15px_var(--color-secondary)] rotate-45 shrink-0"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="h-6 w-6 text-secondary -rotate-45 group-hover:rotate-0 transition-transform" />
                    </motion.div>
                    <h3 className="text-xl lang-en:text-lg font-heading font-bold text-secondary tracking-widest lang-en:tracking-wider uppercase drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]">
                      {language === "en" ? "Your Recommendation" : "您的推荐"}
                    </h3>
                  </div>
                  <p className="mb-8 text-foreground font-mono text-sm lang-en:text-sm leading-relaxed lang-en:leading-normal relative z-10">
                    {language === "en"
                      ? "> SYSTEM LOG: Personalized cocktail sequence initialized. View output or explore alternative logic paths."
                      : "> 系统日志：专属鸡尾酒序列已生成，请查看输出或探索替代逻辑路径。"}
                  </p>
                  <div className="button-group flex flex-col sm:flex-row sm:flex-wrap gap-4 relative z-10">
                    <Button
                      size="lg"
                      iconPosition="right"
                      icon={<ChevronRight className="h-4 w-4" />}
                      href={recommendationPath}
                      variant="primary"
                    >
                      <span className="flex items-center gap-2">
                        <Martini className="h-4 w-4" /> 
                        <span>{language === "en" ? "View Cocktail" : "查看鸡尾酒"}</span>
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      href={galleryPath}
                      icon={<Library className="h-5 w-5" />}
                    >
                      {language === "en" ? "Browse More" : "浏览更多"}
                    </Button>
                  </div>
                  <div className="mt-6 text-center relative z-10">
                    <Link
                      href={newQuestionPath}
                      className="text-sm text-primary font-mono tracking-widest hover:text-secondary hover:underline transition-colors uppercase drop-shadow-[0_0_5px_currentColor] focus-ring"
                    >
                      {language === "en"
                        ? "Start a new recommendation"
                        : "重新开始推荐"}
                    </Link>
                  </div>
                </motion.div>
              ) : hasSavedSession ? (
                <motion.div
                  className="glass-panel p-6 rounded-none border-t-2 border-t-primary border-b-2 border-b-secondary shadow-[0_0_22px_rgba(255,0,255,0.15)] max-w-lg mb-8 relative overflow-hidden"
                  variants={slideUpVariants}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] pointer-events-none mix-blend-overlay"></div>
                  
                  <div className="flex items-center mb-6 relative z-10">
                    <motion.div
                      className="w-12 h-12 bg-black border-2 border-primary flex items-center justify-center mr-4 shadow-[0_0_15px_var(--color-primary)] rotate-45 shrink-0"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <History className="h-6 w-6 text-primary -rotate-45 group-hover:rotate-0 transition-transform" />
                    </motion.div>
                    <h3 className="text-xl lang-en:text-lg font-heading font-bold text-primary tracking-widest lang-en:tracking-wider uppercase drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]">
                      {t("home.savedSession")}
                    </h3>
                  </div>
                  <p className="mb-8 text-foreground font-mono text-sm lang-en:text-sm leading-relaxed lang-en:leading-normal relative z-10">
                    {t("home.savedSessionDesc")}
                  </p>
                  <div className="button-group flex flex-col sm:flex-row sm:flex-wrap gap-4 relative z-10">
                    <Button
                      size="lg"
                      iconPosition="right"
                      icon={<ChevronRight className="h-4 w-4" />}
                      href={questionsPath}
                      variant="secondary"
                    >
                      <span className="flex items-center gap-2">
                        <History className="h-4 w-4" /> 
                        <span>{t("home.continue")}</span>
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      href={galleryPath}
                      icon={<Library className="h-5 w-5" />}
                    >
                      {language === "en" ? "Browse Gallery" : "浏览酒单"}
                    </Button>
                  </div>
                  <div className="mt-6 text-center relative z-10">
                    <Link
                      href={newQuestionPath}
                      className="text-sm text-secondary font-mono tracking-widest hover:text-primary hover:underline transition-colors uppercase drop-shadow-[0_0_5px_currentColor] focus-ring"
                    >
                      {language === "en"
                        ? "Start a new session instead"
                        : "开始新的会话"}
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  variants={slideUpVariants}
                  className="flex flex-col sm:flex-row sm:flex-wrap gap-4"
                >
                  <Button
                    size="xl"
                    iconPosition="right"
                    icon={<ArrowRight className="h-5 w-5" />}
                    href={questionsPath}
                    variant="primary"
                    className="shadow-[0_0_16px_var(--color-secondary)] uppercase"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 animate-neon-pulse" /> 
                      <span>{t("home.start")}</span>
                    </span>
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    href={galleryPath}
                    icon={<Library className="h-5 w-5" />}
                    className="uppercase"
                  >
                    {language === "en" ? "View Gallery" : "浏览酒单"}
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="relative h-[400px] md:h-[500px] lg:h-[550px]"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {featuredCocktails.map(
                  (cocktail, index) =>
                    index === currentCocktailIndex && (
                      <motion.div
                        key={cocktail.id}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Link
                          href={getPathWithLanguage(`/cocktail/${cocktail.id}`)}
                          className="block relative h-full group focus-ring"
                        >
                          <motion.div
                            className="absolute -inset-8 bg-gradient-to-r from-primary/40 to-secondary/40 rounded-full blur-3xl opacity-60"
                              animate={pulseGlowAnimation}
                              transition={{
                              duration: 4,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          />
                          <div className="relative h-full rounded-none overflow-hidden glass-panel border-2 border-secondary/50 shadow-[0_0_22px_rgba(0,255,255,0.2)] group-hover:shadow-[0_0_36px_rgba(0,255,255,0.4)] transition duration-500">
                            {/* Neon Terminal Title Bar overlay */}
                            <div className="absolute top-0 w-full bg-black/80 border-b-2 border-secondary px-4 py-2 flex items-center gap-2 z-20 backdrop-blur-md mix-blend-hard-light">
                              <div className="h-3 w-3 rounded-full bg-primary" />
                              <div className="h-3 w-3 rounded-full bg-secondary" />
                              <div className="h-3 w-3 rounded-full bg-accent" />
                              <span className="ml-2 font-mono text-[10px] text-secondary tracking-widest uppercase">IMAGE_DATA_RENDER.EXE</span>
                            </div>
                            
                            <SafeImage
                              src={cocktail.image}
                              fallbackSrc={`/placeholder.svg?height=600&width=500&query=${encodeURIComponent(cocktail.name)}`}
                              alt={cocktail.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority={index === currentCocktailIndex}
                              className="object-cover opacity-95 transition duration-500 group-hover:scale-[1.03]"
                            />
                            {/* Vaporwave duotone gradient overlay over images */}
                            <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-secondary/30 mix-blend-overlay pointer-events-none group-hover:opacity-0 transition-opacity duration-500" />
                            
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 p-8 pt-20 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-[2px]"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                            >
                              <h3 className="text-3xl font-heading font-black text-white mb-1 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                                {cocktail.name}
                              </h3>
                              <p className="text-xs text-secondary font-mono mb-4 tracking-[0.2em] uppercase">
                                {cocktail.englishName}
                              </p>
                              <p className="text-foreground font-mono text-sm mb-6 leading-relaxed bg-black/50 p-3 border-l-2 border-primary">
                                {cocktail.description}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {cocktail.tags.map((tag, tagIndex) => (
                                  <div
                                    key={tagIndex}
                                    className="inline-flex items-center px-3 py-1 text-xs rounded-none font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-secondary border border-secondary shadow-[0_0_8px_rgba(0,255,255,0.3)]"
                                  >
                                    {tag}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </div>
                        </Link>
                      </motion.div>
                    ),
                )}
              </AnimatePresence>

              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {featuredCocktails.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentCocktailIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      index === currentCocktailIndex
                        ? "bg-primary shadow-[0_0_15px_var(--color-primary)] ring-2 ring-secondary/50 rounded-none scale-110"
                        : "bg-muted hover:bg-secondary hover:shadow-[0_0_10px_var(--color-secondary)] hover:rounded-none"
                    }`}
                    whileHover={{ scale: 1.2, rotate: 45 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{
                      scale: index === currentCocktailIndex ? 1.2 : 1,
                      rotate: index === currentCocktailIndex ? 45 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "linear" }}
                    aria-label={`View cocktail ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <HomeFeatures />

      <HomePopular />

      <section
        ref={ctaRef}
        className="section-spacing relative bg-[#090014] overflow-hidden border-t-4 border-t-primary"
      >
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-size-[100%_4px] pointer-events-none z-10"></div>
        <Container size="xl" className="relative z-20">
          <motion.div
            className="text-center container-narrow glass-panel p-10 md:p-16 border-2 border-secondary shadow-[0_0_36px_rgba(0,255,255,0.15)] rounded-none"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "linear" }}
          >
            <GradientText
              as="h2"
              className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight uppercase"
            >
              {t("home.cta.title")}
            </GradientText>
            <p className="text-xl text-foreground font-mono leading-relaxed mb-12 tracking-wide uppercase drop-shadow-md">
              {t("home.cta.subtitle")}
            </p>
            <Button
              size="xl"
              iconPosition="right"
              icon={<ArrowRight className="h-5 w-5" />}
              href={questionsPath}
              variant="primary"
              className="shadow-2xl"
            >
              <span className="mr-2">→</span> {t("home.start")}
            </Button>
          </motion.div>
        </Container>
      </section>
    </div>
  );
});

Home.displayName = "Home";

export default Home;
