"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TerminalNote } from "@/components/ui/terminal-note";
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
            className="mb-4 text-3xl font-heading font-black uppercase tracking-[0.16em] md:text-4xl lg:mb-6 lg:text-5xl"
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
              <Card
                hover="lift"
                scanline
                className="group h-full p-8 text-center"
              >
                <CardHeader className="text-spacing">
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
                  <CardTitle className="mb-4 transition-colors group-hover:text-secondary">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TerminalNote className="text-sm transition-colors group-hover:border-secondary md:text-base">
                    {feature.description}
                  </TerminalNote>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
