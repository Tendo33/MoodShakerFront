"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container, GradientText } from "@/components/ui/core";
import { useLanguage } from "@/context/LanguageContext";
import { useInViewAnimation } from "@/utils/animation-utils";
import Link from "next/link";
import Image from "next/image";
import { cocktailImages } from "@/utils/cocktail-images";

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

export default function HomePopular() {
  const { language } = useLanguage();
  const [popularRef, popularInView] = useInViewAnimation();

  const getPathWithLanguage = (path: string) => {
    const langPrefix = language === "en" ? "en" : "cn";
    return `/${langPrefix}${path}`;
  };

  const featuredCocktails = [
    {
      id: "mojito",
      name: language === "en" ? "Mojito" : "莫吉托",
      description:
        language === "en"
          ? "A refreshing blend of mint and lime"
          : "清新薄荷与青柠的完美结合",
      image: cocktailImages.mojito,
    },
    {
      id: "margarita",
      name: language === "en" ? "Margarita" : "玛格丽特",
      description:
        language === "en"
          ? "Classic tequila cocktail with perfect balance"
          : "经典龙舌兰鸡尾酒，酸甜平衡",
      image: cocktailImages.margarita,
    },
    {
      id: "cosmopolitan",
      name: language === "en" ? "Cosmopolitan" : "大都会",
      description:
        language === "en"
          ? "Stylish cranberry vodka cocktail"
          : "时尚优雅的蔓越莓伏特加鸡尾酒",
      image: cocktailImages.cosmopolitan,
    },
  ];

  return (
    <section ref={popularRef} className="section-spacing bg-card/50">
      <Container size="xl">
        <motion.div
          className="container-narrow mb-8 text-center lg:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={
            popularInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.6 }}
        >
          <GradientText
            as="h2"
            className="mb-4 text-3xl font-heading font-black uppercase tracking-[0.16em] drop-shadow-[0_0_10px_rgba(255,79,216,0.28)] md:text-4xl lg:mb-6 lg:text-5xl"
          >
            {language === "en" ? "Popular Cocktails" : "热门鸡尾酒"}
          </GradientText>
          <p className="mt-4 text-base font-mono leading-relaxed text-foreground/84 drop-shadow-md md:text-lg">
            {language === "en"
              ? "> QUERYING MOST ACCESSED SELECTION ALGORITHMS..."
              : "> 正在查询最常用的选择算法..."}
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
              <Link
                href={getPathWithLanguage(`/cocktail/${cocktail.id}`)}
                className="focus-ring"
              >
                <div className="glass-panel card-hover group relative h-full overflow-hidden border border-primary/35 p-8 transition-all duration-500 hover:border-secondary hover:shadow-[0_24px_48px_rgba(3,0,9,0.28),0_0_18px_rgba(93,246,255,0.16)]">
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.2)_50%)] bg-size-[100%_4px] pointer-events-none mix-blend-overlay z-0" />
                  
                  <div className="relative z-10 mb-6 h-40 overflow-hidden border border-primary/45 transition-colors group-hover:border-secondary md:h-48">
                    <motion.div
                      className="w-full h-full relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <SafeImage
                        src={cocktail.image}
                        fallbackSrc={`/placeholder.svg?height=300&width=400&query=${encodeURIComponent(cocktail.name)}`}
                        alt={cocktail.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover opacity-95 transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    </motion.div>
                    <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-secondary/30 mix-blend-overlay pointer-events-none group-hover:opacity-0 transition-opacity duration-300" />
                  </div>
                  <div className="text-spacing relative z-10">
                    <h3 className="mb-3 text-xl font-bold font-heading uppercase tracking-[0.16em] text-primary transition-colors duration-300 group-hover:text-secondary lg:text-2xl">
                      {cocktail.name}
                    </h3>
                    <p className="border-l-2 border-primary/60 bg-black/40 p-3 text-sm font-mono leading-relaxed text-foreground/88 transition-colors group-hover:border-secondary md:text-base">
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
  );
}
