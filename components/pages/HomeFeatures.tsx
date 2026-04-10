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
      className="section-spacing bg-linear-to-b from-background to-card/50 pt-24 md:pt-32 lg:pt-40"
    >
      <Container size="xl">
        <motion.div
          className="container-narrow mb-8 text-center lg:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={
            featuresInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.6 }}
        >
          <GradientText
            as="h2"
            className="mb-4 text-3xl font-heading font-black uppercase tracking-[0.16em] drop-shadow-[0_0_10px_rgba(255,79,216,0.28)] md:text-4xl lg:mb-6 lg:text-5xl"
          >
            {language === "en"
              ? "Why Choose MoodShaker?"
              : "为什么选择 MoodShaker？"}
          </GradientText>
          <p className="mt-4 text-base font-mono leading-relaxed text-foreground/84 drop-shadow-md md:text-lg">
            {language === "en"
              ? "> INITIALIZING INTELLIGENT RECOMMENDATION PROTOCOL..."
              : "> 正在初始化智能推荐协议..."}
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
              <div className="glass-panel card-hover group relative h-full overflow-hidden border border-primary/35 p-8 text-center transition-all duration-500 hover:border-secondary hover:shadow-[0_24px_48px_rgba(3,0,9,0.28),0_0_18px_rgba(93,246,255,0.16)]">
                <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] pointer-events-none mix-blend-overlay" />
                <div className="relative z-10 text-spacing">
                  <motion.div
                    className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border border-primary/45 bg-black/55 shadow-[0_16px_26px_rgba(3,0,9,0.22)] transition-all duration-300 transform group-hover:border-secondary group-hover:shadow-[0_18px_30px_rgba(3,0,9,0.24)]"
                    whileHover={{
                      scale: 1.08,
                      rotate: index % 2 === 0 ? 4 : -4,
                      y: -2,
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
                  <h3 className="mb-4 text-xl font-bold font-heading uppercase tracking-[0.16em] text-primary transition-colors group-hover:text-secondary lg:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="border-l-2 border-primary/60 bg-black/40 p-4 text-sm font-mono leading-relaxed text-foreground/88 transition-colors group-hover:border-secondary md:text-base">
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
