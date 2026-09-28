"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SafeImage } from "@/components/SafeImage";
import { useLanguage } from "@/context/LanguageContext";
import { cocktailImages } from "@/utils/cocktail-images";

export interface FeaturedDrink {
  id: string;
  name: string;
  image: string;
}

export function featuredDrinks(language: string): FeaturedDrink[] {
  const english = language === "en";
  return [
    {
      id: "mojito",
      name: english ? "Mojito" : "莫吉托",
      image: cocktailImages.mojito,
    },
    {
      id: "margarita",
      name: english ? "Margarita" : "玛格丽特",
      image: cocktailImages.margarita,
    },
    {
      id: "cosmopolitan",
      name: english ? "Cosmopolitan" : "大都会",
      image: cocktailImages.cosmopolitan,
    },
  ];
}

interface HomePopularProps {
  drinks: FeaturedDrink[];
  setApi: (api: CarouselApi) => void;
}

export default function HomePopular({ drinks, setApi }: HomePopularProps) {
  const { getPathWithLanguage } = useLanguage();
  const reduceMotion = useReducedMotion() === true;

  return (
    <div className="relative h-full min-h-0 w-full">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", duration: reduceMotion ? 0 : 22 }}
        className="h-full"
      >
        <CarouselContent className="ml-0 h-full">
          {drinks.map((drink, index) => (
            <CarouselItem key={drink.id} className="relative h-auto pl-0 md:h-full">
              <div className="relative w-full md:absolute md:inset-0 md:overflow-hidden">
                <div className="relative w-full md:absolute md:top-1/2 md:left-1/2 md:w-[max(100%,calc((100vh-5rem)*0.8))] md:-translate-x-1/2 md:-translate-y-1/2">
                  <AspectRatio ratio={4 / 5} className="overflow-hidden bg-black">
                    <SafeImage
                      src={drink.image}
                      fallbackSrc={`/placeholder.svg?height=1000&width=800&query=${encodeURIComponent(drink.name)}`}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      priority={index === 0}
                      className="object-cover"
                    />
                  </AspectRatio>
                </div>
                <Link
                  href={getPathWithLanguage(`/cocktail/${drink.id}`)}
                  className="focus-ring absolute inset-0 z-[1] block"
                >
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080212] via-[#080212]/80 to-transparent px-5 pt-16 pb-6 md:px-8 md:pb-8">
                    <span className="text-safe-wrap block font-heading text-3xl font-bold uppercase tracking-[0.12em] text-foreground md:text-5xl">
                      {drink.name}
                    </span>
                    <span className="mt-4 block h-px w-20 bg-primary" />
                  </span>
                </Link>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
