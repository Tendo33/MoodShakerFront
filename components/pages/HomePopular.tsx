"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { GradientText } from "@/components/ui/gradient-text";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { TerminalNote } from "@/components/ui/terminal-note";
import { useLanguage } from "@/context/LanguageContext";
import { useInViewAnimation } from "@/utils/animation-utils";
import Link from "next/link";
import { cocktailImages } from "@/utils/cocktail-images";
import { SafeImage } from "@/components/SafeImage";

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
            className="mb-4 text-3xl font-heading font-black uppercase tracking-[0.16em] md:text-4xl lg:mb-6 lg:text-5xl"
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
                <Card hover="lift" scanline className="group h-full p-8">
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
                  <CardContent className="text-spacing">
                    <CardTitle className="mb-3 transition-colors duration-300 group-hover:text-secondary">
                      {cocktail.name}
                    </CardTitle>
                    <TerminalNote className="p-3 text-sm transition-colors group-hover:border-secondary md:text-base">
                      {cocktail.description}
                    </TerminalNote>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
