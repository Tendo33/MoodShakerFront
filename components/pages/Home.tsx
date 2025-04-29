"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  History,
  ChevronRight,
  Sparkles,
  BookOpen,
  Beaker,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Container,
  GradientText,
  Badge,
} from "@/components/ui/core";
import {
  animations,
  useDelayedAnimation,
  floatAnimation,
  pulseAnimation,
  useInViewAnimation,
} from "@/utils/animation-utils";

// Import cocktail images
const cocktailImages = {
  mojito: "/vibrant-mojito.png",
  margarita: "/vibrant-margarita.png",
  cosmopolitan: "/city-lights-cocktail.png",
};

export default function Home() {
  const { t, language } = useLanguage();
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [currentCocktailIndex, setCurrentCocktailIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const shouldAnimate = useDelayedAnimation(100);

  // Use in-view animation hooks for sections
  const [featuresRef, featuresInView] = useInViewAnimation();
  const [popularRef, popularInView] = useInViewAnimation();
  const [ctaRef, ctaInView] = useInViewAnimation();

  // Featured cocktails for the hero section with translations
  const featuredCocktails = [
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
  ];

  useEffect(() => {
    setIsClient(true);
    const answers = localStorage.getItem("moodshaker-answers");
    setHasSavedSession(!!answers);
  }, []);

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

  // Get the correct question path based on language
  const questionsPath = `/${language === "en" ? "en" : "cn"}/questions`;
  const newQuestionPath = `/${language === "en" ? "en" : "cn"}/questions?new=true`;

  const getPathWithLanguage = (path: string) => {
    return `/${language === "en" ? "en" : "cn"}${path}`;
  };

  return (
    <div className="bg-gray-900 text-white">
      {/* Hero Section with enhanced animations */}
      <section className="relative min-h-[90vh] flex items-center py-16 md:py-24 overflow-hidden">
        {/* Background gradient effects with improved animations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 right-1/4 w-72 h-72 bg-amber-500 rounded-full blur-3xl opacity-20"
            animate={floatAnimation}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-pink-500 rounded-full blur-3xl opacity-20"
            animate={{
              ...floatAnimation,
              transition: { ...floatAnimation.transition, delay: 1 },
            }}
          />
          <motion.div
            className="absolute top-2/3 right-1/3 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-10"
            animate={{
              ...floatAnimation,
              transition: { ...floatAnimation.transition, delay: 2 },
            }}
          />
        </div>

        <Container>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left column - Text content with enhanced animations */}
            <motion.div
              initial="hidden"
              animate={shouldAnimate ? "visible" : "hidden"}
              variants={animations.staggerContainer}
            >
              <motion.div variants={animations.slideUp} className="mb-2">
                <Badge variant="primary" size="md">
                  {language === "en"
                    ? "✨ AI-Powered Cocktail Recommendations"
                    : "✨ AI 驱动的鸡尾酒推荐"}
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                variants={animations.slideUp}
              >
                <GradientText as="span" className="block">
                  {t("home.title")}
                </GradientText>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl mb-8 text-gray-300"
                variants={animations.slideUp}
              >
                {t("home.subtitle")}
              </motion.p>

              {/* Session buttons with enhanced animations */}
              {hasSavedSession ? (
                <motion.div
                  className="p-6 border border-gray-700/50 rounded-xl mb-6 bg-gray-800/80 backdrop-blur-sm"
                  variants={animations.slideUp}
                >
                  <div className="flex items-center mb-4">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 flex items-center justify-center mr-3"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <History className="h-5 w-5 text-amber-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold">
                      {t("home.savedSession")}
                    </h3>
                  </div>
                  <p className="mb-5 text-gray-400">
                    {t("home.savedSessionDesc")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="md"
                      iconPosition="right"
                      icon={<ChevronRight />}
                      href={questionsPath}
                    >
                      {t("home.continue")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      href={newQuestionPath}
                    >
                      {t("home.new")}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={animations.slideUp}>
                  <Button
                    size="md"
                    iconPosition="right"
                    icon={<ArrowRight className="h-4 w-4" />}
                    href={questionsPath}
                  >
                    {t("home.start")}
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Right column - Featured cocktail with enhanced animations */}
            <motion.div
              className="relative h-[400px] md:h-[500px]"
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
                          className="block relative h-full"
                        >
                          <motion.div
                            className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-pink-500/20 rounded-full blur-xl"
                            animate={pulseAnimation}
                          />
                          <img
                            src={
                              cocktail.image ||
                              `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(cocktail.name) || "/placeholder.svg"}`
                            }
                            alt={cocktail.name}
                            className="relative rounded-3xl shadow-2xl w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                            onError={(e) => {
                              e.currentTarget.src = `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(
                                cocktail.name,
                              )}`;
                            }}
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent rounded-b-3xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                          >
                            <h3 className="text-2xl font-bold text-white">
                              {cocktail.name}
                            </h3>
                            <p className="text-sm text-gray-300">
                              {cocktail.englishName}
                            </p>
                            <p className="text-white/80 mt-2">
                              {cocktail.description}
                            </p>

                            {/* Tags for each cocktail */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {cocktail.tags.map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant={
                                    tagIndex % 3 === 0
                                      ? "primary"
                                      : tagIndex % 3 === 1
                                        ? "info"
                                        : "success"
                                  }
                                  size="sm"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ),
                )}
              </AnimatePresence>

              {/* Navigation dots with enhanced animations */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
                {featuredCocktails.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentCocktailIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentCocktailIndex
                        ? "bg-gradient-to-r from-amber-500 to-pink-500 shadow-md shadow-pink-500/20"
                        : "bg-white/30"
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    animate={{
                      scale: index === currentCocktailIndex ? 1.25 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    aria-label={`View cocktail ${index + 1}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Features Section with enhanced animations */}
      <section
        ref={featuresRef}
        className="py-20 bg-gradient-to-b from-gray-900 to-gray-800/90"
      >
        <Container>
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={
              featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <GradientText as="h2" className="text-3xl font-bold mb-4">
              {language === "en"
                ? "Why Choose MoodShaker?"
                : "为什么选择 MoodShaker?"}
            </GradientText>
            <p className="text-lg max-w-2xl mx-auto text-gray-400">
              {language === "en"
                ? "Our intelligent recommendation system finds the perfect cocktail based on your preferences and mood"
                : "我们的智能推荐系统会根据您的喜好和心情，为您找到完美的鸡尾酒"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={
                  featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card
                  gradient={true}
                  hoverEffect={true}
                  bordered={false}
                  className="h-full"
                >
                  <CardContent className="p-6">
                    <motion.div
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center mb-5 shadow-lg"
                      whileHover={{
                        scale: 1.1,
                        rotate: index % 2 === 0 ? 5 : -5,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <CardTitle className="mb-3">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-400 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Popular Cocktails Section with enhanced animations */}
      <section ref={popularRef} className="py-20 bg-gray-800/50">
        <Container>
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={
              popularInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.6 }}
          >
            <GradientText as="h2" className="text-3xl font-bold mb-4">
              {language === "en" ? "Popular Cocktails" : "热门鸡尾酒"}
            </GradientText>
            <p className="text-lg max-w-2xl mx-auto text-gray-400">
              {language === "en"
                ? "Explore our users' favorite cocktails"
                : "探索我们用户最喜爱的鸡尾酒"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <Card
                    gradient={false}
                    hoverEffect={true}
                    className="overflow-hidden border-gray-700/50 h-full"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <motion.div
                        className="w-full h-full"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                      >
                        <img
                          src={
                            cocktail.image ||
                            `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(cocktail.name) || "/placeholder.svg"}`
                          }
                          alt={cocktail.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(
                              cocktail.name,
                            )}`;
                          }}
                        />
                      </motion.div>
                    </div>
                    <CardContent className="p-6">
                      <CardTitle className="text-xl font-bold mb-2">
                        {cocktail.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {cocktail.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Call to Action Section with enhanced animations */}
      <section
        ref={ctaRef}
        className="py-24 bg-gradient-to-r from-gray-800/90 to-gray-900"
      >
        <Container>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.7 }}
          >
            <GradientText as="h2" className="text-4xl font-bold mb-6">
              {language === "en"
                ? "Ready to discover your perfect cocktail?"
                : "准备好发现您的完美鸡尾酒了吗?"}
            </GradientText>
            <p className="text-xl text-gray-400 mb-8">
              {language === "en"
                ? "Start now and let us recommend the perfect drink for your mood."
                : "立即开始，让我们为您推荐最适合您心情的饮品。"}
            </p>
            <Button
              size="md"
              iconPosition="right"
              icon={<ArrowRight className="h-4 w-4" />}
              href={questionsPath}
            >
              {t("home.start")}
            </Button>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
