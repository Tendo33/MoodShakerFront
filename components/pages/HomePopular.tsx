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
                <div className="relative overflow-hidden rounded-2xl border border-white/5 glass-panel card-hover h-full group hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] transition-all duration-500 p-8">
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
  );
}
