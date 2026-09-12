"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import { cocktailImages } from "@/utils/cocktail-images";
import { shouldBypassNextImageOptimization } from "@/utils/image-optimization";
import { SafeImage } from "@/components/SafeImage";

interface CocktailImageProps {
  cocktailId?: string;
  imageData: string | null;
  cocktailName?: string;
  priority?: boolean;
}

const CocktailImage = memo(function CocktailImage({
  cocktailId,
  imageData,
  cocktailName = "Cocktail",
  priority = false,
}: CocktailImageProps) {
  const placeholderUrl = `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktailName || "cocktail")}`;
  const imageSrc = useMemo(() => {
    if (imageData) {
      return imageData;
    }
    if (cocktailId && cocktailId in cocktailImages) {
      return cocktailImages[cocktailId as keyof typeof cocktailImages];
    }
    return placeholderUrl;
  }, [cocktailId, imageData, placeholderUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full w-full"
    >
      <SafeImage
        src={imageSrc}
        fallbackSrc={placeholderUrl}
        alt={cocktailName || "Cocktail"}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={priority}
        unoptimized={shouldBypassNextImageOptimization(imageSrc)}
        className="object-cover"
      />
    </motion.div>
  );
});

CocktailImage.displayName = "CocktailImage";

export { CocktailImage };
