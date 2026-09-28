"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Cocktail } from "@/lib/cocktail-types";
import { CocktailSpecs } from "@/components/pages/shared/CocktailSpecs";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLanguage } from "@/context/LanguageContext";
import { enterDuration, enterEase } from "@/utils/animation-utils";

interface CocktailHeroProps {
  cocktail: Cocktail;
  language: string;
  isPageLoaded: boolean;
  t: (key: TranslationKey) => string;
  imageContent: ReactNode;
  children?: ReactNode;
}

export function CocktailHero({
  cocktail,
  language,
  isPageLoaded,
  t,
  imageContent,
  children,
}: CocktailHeroProps) {
  const { getPathWithLanguage } = useLanguage();
  const reduceMotion = useReducedMotion() === true;
  const shown = reduceMotion || isPageLoaded;
  const enter = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, transition: { duration: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          transition: { duration: enterDuration, delay, ease: enterEase },
        };

  return (
    <motion.div
      className="mb-12 md:mb-16"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={shown ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : enterDuration, ease: enterEase }}
    >
      <Breadcrumb className="mb-6">
        <BreadcrumbList className="font-mono text-xs uppercase tracking-[0.16em]">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={getPathWithLanguage("/gallery")} className="focus-ring">
                {language === "en" ? "Gallery" : "酒单库"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-safe-wrap max-w-[16rem] truncate font-heading tracking-[0.12em] sm:max-w-none">
              {cocktail.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] md:gap-10">
        <motion.div
          className="min-w-0 md:sticky md:top-24 md:self-start"
          {...enter(0)}
          animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        >
          <AspectRatio ratio={1} className="overflow-hidden bg-black">
            {imageContent}
          </AspectRatio>
        </motion.div>

        <motion.div
          className="min-w-0"
          {...enter(0.06)}
          animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        >
          <h1 className="text-safe-wrap font-heading text-3xl font-bold uppercase tracking-[0.1em] text-foreground md:text-4xl">
            {cocktail.name}
          </h1>
          <div className="mt-5 h-px w-24 bg-primary" aria-hidden />
          {cocktail.nameAllLocales.en && language === "cn" ? (
            <p className="text-safe-wrap mt-3 font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
              {cocktail.nameAllLocales.en}
            </p>
          ) : null}
          <p className="text-safe-wrap mt-5 font-mono text-base leading-relaxed text-foreground/80">
            {cocktail.description}
          </p>
          <CocktailSpecs language={language} cocktail={cocktail} />
          {cocktail.flavorProfileLabels.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                {t("detail.flavorProfile")}
              </p>
              <div className="flex flex-wrap gap-2">
                {cocktail.flavorProfileLabels.map((flavor) => (
                  <Badge
                    key={flavor}
                    variant="accent"
                    className="text-safe-wrap px-3 py-1.5 text-sm tracking-[0.14em]"
                  >
                    {flavor}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
