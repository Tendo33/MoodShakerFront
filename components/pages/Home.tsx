"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowRight,
  History,
  ChevronRight,
  Sparkles,
  BookOpen,
  Beaker,
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
import { useImagePreload } from "@/utils/performance-utils";
import { useAsyncState } from "@/hooks/useAsyncState";

import { cocktailImages } from "@/utils/cocktail-images";

// Robust Image component that handles errors without direct DOM manipulation
const SafeImage = React.memo(({ src, fallbackSrc, alt, ...props }: any) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
});
SafeImage.displayName = "SafeImage";

const Home = React.memo(function Home() {
  const { t, language } = useLanguage();
  const [currentCocktailIndex, setCurrentCocktailIndex] = useState(0);

  const shouldAnimate = useDelayedAnimation(100);

  // Use in-view animation hooks for sections
  const [featuresRef, featuresInView] = useInViewAnimation();
  const [popularRef, popularInView] = useInViewAnimation();
  const [ctaRef, ctaInView] = useInViewAnimation();

  // 使用异步状态检查保存的会话 - 性能优化核心
  const { data: savedAnswers, isLoading: isCheckingSession } = useAsyncState({
    storageKey: "moodshaker-answers",
    defaultValue: {},
    immediate: true, // 立即加载但不阻塞渲染
  });

  // 检查是否有推荐结果
  const { data: savedRecommendation } = useAsyncState({
    storageKey: "moodshaker-recommendation",
    defaultValue: null,
    immediate: true,
  });

  // 计算会话状态
  const hasSavedSession = savedAnswers && Object.keys(savedAnswers).length > 0;
  const hasRecommendation = savedRecommendation !== null;

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

  // Features data with translations
  const features = [
    {
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      title: t("home.feature1.title"),
      description: t("home.feature1.description"),
    },
    {
      icon: <BookOpen className="h-6 w-6 text-pink-500" />,
      title: t("home.feature2.title"),
      description: t("home.feature2.description"),
    },
    {
      icon: <Beaker className="h-6 w-6 text-purple-500" />,
      title: t("home.feature3.title"),
      description: t("home.feature3.description"),
    },
  ];

  // Get paths with language prefix
  const getPathWithLanguage = (path: string) => {
    const langPrefix = language === "en" ? "en" : "cn";
    return `/${langPrefix}${path}`;
  };

  const questionsPath = getPathWithLanguage("/questions");
  const newQuestionPath = getPathWithLanguage("/questions?new=true");
  const galleryPath = getPathWithLanguage("/gallery");
  const recommendationPath = getPathWithLanguage("/cocktail/recommendation");

  return (
    <div className="bg-background text-foreground">
      <section className="relative hero-height flex items-center section-spacing pt-16 md:pt-20 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
            animate={floatAnimation as any}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
            animate={
              {
                ...floatAnimation,
                transition: { ...floatAnimation.transition, delay: 1 },
              } as any
            }
          />
          <motion.div
            className="absolute top-2/3 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
            animate={
              {
                ...floatAnimation,
                transition: { ...floatAnimation.transition, delay: 2 },
              } as any
            }
          />
        </div>

        <Container size="xl">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={animations.staggerContainer as any}
              className="content-spacing"
            >
              <motion.div variants={animations.slideUp as any} className="mb-6">
                <div className="inline-flex items-center bg-primary/20 text-primary border border-primary/30 px-3 py-1.5 text-sm rounded-full font-medium glass-effect">
                  <Sparkles className="h-3.5 w-3.5 mr-2 fill-primary" />
                  {language === "en"
                    ? "AI-Powered Cocktail Recommendations"
                    : "AI 驱动的鸡尾酒推荐"}
                </div>
              </motion.div>

              <motion.h1
                className="font-playfair font-bold text-shadow mb-6"
                variants={animations.slideUp as any}
              >
                <GradientText as="span" className="block leading-tight">
                  {t("home.title")}
                </GradientText>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-foreground/80 font-source-sans leading-relaxed max-w-xl mb-8"
                variants={animations.slideUp as any}
              >
                {t("home.subtitle")}
              </motion.p>

              {hasRecommendation ? (
                <motion.div
                  className="glass-effect card-spacing rounded-2xl border border-border/50 glow-effect max-w-lg"
                  variants={animations.slideUp as any}
                >
                  <div className="flex items-center mb-4">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold font-playfair">
                      {language === "en" ? "Your Recommendation" : "您的推荐"}
                    </h3>
                  </div>
                  <p className="mb-6 text-foreground/70 font-source-sans">
                    {language === "en"
                      ? "Your personalized cocktail is ready! View it now or explore more options."
                      : "您的专属鸡尾酒已准备好！立即查看或探索更多选择。"}
                  </p>
                  <div className="button-group flex flex-col sm:flex-row sm:flex-wrap gap-3">
                    <Button
                      size="lg"
                      iconPosition="right"
                      icon={<ChevronRight className="h-4 w-4" />}
                      href={recommendationPath}
                      variant="primary"
                      effect="shine"
                    >
                      <span className="flex items-center gap-2">
                        <Martini className="h-4 w-4" /> 
                        <span>{language === "en" ? "View My Cocktail" : "查看我的鸡尾酒"}</span>
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      href={galleryPath}
                      effect="lift"
                      icon={<Library className="h-5 w-5" />}
                    >
                      {language === "en" ? "Browse More" : "浏览更多"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      href={newQuestionPath}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {language === "en"
                        ? "Start a new recommendation"
                        : "重新开始推荐"}
                    </Link>
                  </div>
                </motion.div>
              ) : hasSavedSession ? (
                <motion.div
                  className="glass-effect card-spacing rounded-2xl border border-border/50 glow-effect max-w-lg"
                  variants={animations.slideUp as any}
                >
                  <div className="flex items-center mb-4">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <History className="h-5 w-5 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-bold font-playfair">
                      {t("home.savedSession")}
                    </h3>
                  </div>
                  <p className="mb-6 text-foreground/70 font-source-sans">
                    {t("home.savedSessionDesc")}
                  </p>
                  <div className="button-group flex flex-col sm:flex-row sm:flex-wrap gap-3">
                    <Button
                      size="lg"
                      iconPosition="right"
                      icon={<ChevronRight className="h-4 w-4" />}
                      href={questionsPath}
                      variant="primary"
                      effect="pulse"
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
                      effect="lift"
                      icon={<Library className="h-5 w-5" />}
                    >
                      {language === "en" ? "Browse Gallery" : "浏览酒单库"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      href={newQuestionPath}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {language === "en"
                        ? "Start a new session instead"
                        : "开始新的对话"}
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  variants={animations.slideUp as any}
                  className="flex flex-col sm:flex-row sm:flex-wrap gap-4"
                >
                  <Button
                    size="xl"
                    iconPosition="right"
                    icon={<ArrowRight className="h-5 w-5" />}
                    href={questionsPath}
                    variant="primary"
                    effect="shine"
                    className="shadow-2xl"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" /> 
                      <span>{t("home.start")}</span>
                    </span>
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    href={galleryPath}
                    effect="lift"
                    className="shadow-lg border-primary/30 hover:bg-primary/10"
                    icon={<Library className="h-5 w-5" />}
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
                          className="block relative h-full group"
                        >
                          <motion.div
                            className="absolute -inset-8 bg-gradient-to-r from-primary/40 to-secondary/40 rounded-full blur-3xl opacity-60"
                            animate={
                              {
                                ...pulseAnimation,
                                scale: [1, 1.1, 1],
                                opacity: [0.6, 0.8, 0.6],
                              } as any
                            }
                            transition={{
                              duration: 3,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                          />
                          <div className="relative h-full rounded-3xl overflow-hidden glass-effect border border-border/30 shadow-2xl shadow-primary/10 group-hover:shadow-primary/20 transition-all duration-500">
                            <SafeImage
                              src={cocktail.image}
                              fallbackSrc={`/placeholder.svg?height=600&width=500&query=${encodeURIComponent(cocktail.name)}`}
                              alt={cocktail.name}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority={index === currentCocktailIndex}
                              className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                            />
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background/98 via-background/85 to-transparent backdrop-blur-sm"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                            >
                              <h3 className="text-3xl font-bold font-playfair text-foreground mb-2 tracking-tight">
                                {cocktail.name}
                              </h3>
                              <p className="text-sm text-muted-foreground font-source-sans mb-3 tracking-wide uppercase">
                                {cocktail.englishName}
                              </p>
                              <p className="text-foreground/90 font-source-sans text-lg mb-4 leading-relaxed">
                                {cocktail.description}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {cocktail.tags.map((tag, tagIndex) => (
                                  <div
                                    key={tagIndex}
                                    className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium backdrop-blur-sm ${
                                      tagIndex % 3 === 0
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : tagIndex % 3 === 1
                                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    }`}
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

              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
                {featuredCocktails.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentCocktailIndex(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      index === currentCocktailIndex
                        ? "bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/40 ring-2 ring-primary/20"
                        : "bg-muted/40 hover:bg-muted/70 hover:shadow-md"
                    }`}
                    whileHover={{ scale: 1.3, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{
                      scale: index === currentCocktailIndex ? 1.4 : 1,
                      y: index === currentCocktailIndex ? -2 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    aria-label={`View cocktail ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <section
        ref={featuresRef}
        className="section-spacing pt-24 md:pt-32 lg:pt-40 bg-gradient-to-b from-background to-card/50"
      >
        <Container size="xl">
          <motion.div
            className="text-center mb-8 lg:mb-12 container-narrow"
            initial={{ opacity: 0, y: 20 }}
            animate={
              featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <GradientText
              as="h2"
              className="text-3xl md:text-4xl lg:text-5xl mb-4 lg:mb-6"
            >
              {language === "en"
                ? "Why Choose MoodShaker?"
                : "为什么选择 MoodShaker?"}
            </GradientText>
            <p className="text-lg md:text-xl text-foreground/75 font-source-sans leading-relaxed">
              {language === "en"
                ? "Our intelligent recommendation system finds the perfect cocktail based on your preferences and mood"
                : "我们的智能推荐系统会根据您的喜好和心情，为您找到完美的鸡尾酒"}
            </p>
          </motion.div>

          <div className="card-grid grid-cols-1 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="relative overflow-hidden rounded-xl border border-border glass-effect card-hover h-full text-center group p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
                  <div className="relative z-10 text-spacing">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto shadow-lg mb-6 group-hover:shadow-xl transition-all duration-300"
                      whileHover={{
                        scale: 1.15,
                        rotate: index % 2 === 0 ? 8 : -8,
                        y: -4,
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {feature.icon}
                      </motion.div>
                    </motion.div>
                    <h3 className="text-xl lg:text-2xl font-bold font-playfair mb-4 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base leading-relaxed text-muted-foreground/90 font-source-sans">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section ref={popularRef} className="section-spacing bg-card/50">
        <Container size="xl">
          <motion.div
            className="text-center mb-8 lg:mb-12 container-narrow"
            initial={{ opacity: 0, y: 20 }}
            animate={
              popularInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <GradientText
              as="h2"
              className="text-3xl md:text-4xl lg:text-5xl mb-4 lg:mb-6"
            >
              {language === "en" ? "Popular Cocktails" : "热门鸡尾酒"}
            </GradientText>
            <p className="text-lg md:text-xl text-foreground/75 font-source-sans leading-relaxed">
              {language === "en"
                ? "Explore our users' favorite cocktails"
                : "探索我们用户最喜爱的鸡尾酒"}
            </p>
          </motion.div>

          <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCocktails.map((cocktail, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  popularInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Link href={getPathWithLanguage(`/cocktail/${cocktail.id}`)}>
                  <div className="relative overflow-hidden rounded-xl border border-border/30 glass-effect card-hover h-full group hover:border-primary/20 transition-all duration-500 p-8">
                    <div className="relative h-40 md:h-48 overflow-hidden mb-4 rounded-xl">
                      <motion.div
                        className="w-full h-full relative"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <SafeImage
                          src={cocktail.image}
                          fallbackSrc={`/placeholder.svg?height=300&width=400&query=${encodeURIComponent(cocktail.name)}`}
                          alt={cocktail.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="object-cover transition-all duration-600 group-hover:brightness-110 group-hover:contrast-110"
                          loading="lazy"
                        />
                      </motion.div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="text-spacing">
                      <h3 className="text-xl lg:text-2xl font-bold font-playfair mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {cocktail.name}
                      </h3>
                      <p className="text-sm md:text-base leading-relaxed text-muted-foreground/90 font-source-sans">
                        {cocktail.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section
        ref={ctaRef}
        className="section-spacing bg-gradient-to-r from-background/90 to-card"
      >
        <Container size="xl">
          <motion.div
            className="text-center container-narrow"
            initial={{ opacity: 0, y: 50 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7 }}
          >
            <GradientText
              as="h2"
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6"
            >
              {t("home.cta.title")}
            </GradientText>
            <p className="text-lg md:text-xl text-foreground/75 font-source-sans leading-relaxed mb-10">
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
              <span className="mr-2">✨</span> {t("home.start")}
            </Button>
          </motion.div>
        </Container>
      </section>
    </div>
  );
});

Home.displayName = "Home";

export default Home;
