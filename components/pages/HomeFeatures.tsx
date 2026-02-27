"use client";

import { motion } from "framer-motion";
import { Container, GradientText } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";
import { useInViewAnimation } from "@/utils/animation-utils";
import { Sparkles, BookOpen, Beaker } from "lucide-react";

export default function HomeFeatures() {
  const { t, language } = useLanguage();
  const [featuresRef, featuresInView] = useInViewAnimation();

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

  return (
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
              <div className="relative overflow-hidden rounded-2xl border border-white/5 glass-panel card-hover h-full text-center group p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
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
  );
}
