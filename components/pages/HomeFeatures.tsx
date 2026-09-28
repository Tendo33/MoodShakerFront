"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { useLanguage } from "@/context/LanguageContext";
import { enterDuration, enterEase, useInViewAnimation } from "@/utils/animation-utils";

export default function HomeFeatures() {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion() === true;
  const [featuresRef, featuresInView] = useInViewAnimation();
  const shown = reduceMotion || featuresInView;

  const features = [
    {
      title: t("home.feature1.title"),
      description: t("home.feature1.description"),
    },
    {
      title: t("home.feature2.title"),
      description: t("home.feature2.description"),
    },
    {
      title: t("home.feature3.title"),
      description: t("home.feature3.description"),
    },
  ];

  return (
    <section ref={featuresRef} className="border-t border-white/10 section-spacing">
      <Container size="xl">
        <motion.ul
          className="mx-auto max-w-3xl"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: reduceMotion ? 0 : enterDuration, ease: enterEase }}
        >
          {features.map((feature) => (
            <li key={feature.title} className="border-t border-white/10 py-6 first:border-t-0">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground">
                {feature.title}
              </p>
              <p className="mt-2 max-w-2xl font-mono text-sm leading-relaxed text-foreground/72">
                {feature.description}
              </p>
            </li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
