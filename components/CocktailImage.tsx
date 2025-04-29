"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { getCocktailImage } from "@/api/image";

interface CocktailImageProps {
  cocktailId?: string;
  imageData: string | null;
  cocktailName?: string;
  staticCocktailImages?: Record<string, string>;
}

export default function CocktailImage({
  cocktailId,
  imageData,
  cocktailName = "Cocktail",
  staticCocktailImages = {},
}: CocktailImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate a placeholder URL for fallback
  const placeholderUrl = `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(cocktailName || "cocktail")}`;

  useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, check if we have a static image for this cocktail ID
        if (cocktailId && staticCocktailImages[cocktailId]) {
          setImageSrc(staticCocktailImages[cocktailId]);
          return;
        }

        // Next, check if we have image data from the context
        if (imageData) {
          setImageSrc(imageData);
          return;
        }

        // If we have a cocktail ID, try to get the image from the session
        if (cocktailId) {
          const sessionImage = await getCocktailImage(cocktailId);
          if (sessionImage) {
            setImageSrc(sessionImage);
            return;
          }
        }

        // Fallback to placeholder
        setImageSrc(placeholderUrl);
      } catch (err) {
        console.error("Error loading cocktail image:", err);
        setError("Failed to load image");
        setImageSrc(placeholderUrl);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [
    cocktailId,
    imageData,
    cocktailName,
    staticCocktailImages,
    placeholderUrl,
  ]);

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}

      {imageSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
        >
          <Image
            src={imageSrc || "/placeholder.svg"}
            alt={cocktailName || "Cocktail"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className="object-cover"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              setError("Failed to load image");
              setImageSrc(placeholderUrl);
            }}
          />
        </motion.div>
      )}

      {error && (
        <div className="absolute bottom-2 left-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
    </>
  );
}
