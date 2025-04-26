"use client";

import React, { useState, useEffect } from "react";

interface CocktailImageProps {
  cocktailId?: string;
  imageData: string | null;
  cocktailName?: string;
  staticCocktailImages: Record<string, string>;
  className?: string;
  placeholderClassName?: string;
}

const CocktailImage = React.memo(
  ({
    cocktailId,
    imageData,
    cocktailName,
    staticCocktailImages,
    className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
  }: CocktailImageProps) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Generate a reliable placeholder URL
    const placeholderUrl = `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(cocktailName || "cocktail")}`;

    useEffect(() => {
      setIsLoading(true);

      // Determine the source based on available data
      let sourceToUse: string | null = null;

      if (cocktailId && staticCocktailImages[cocktailId]) {
        sourceToUse = staticCocktailImages[cocktailId];
      } else if (imageData) {
        sourceToUse = imageData;
      }

      if (!sourceToUse) {
        setImageSrc(placeholderUrl);
        setIsLoading(false);
        return;
      }

      // For data URLs, set directly
      if (sourceToUse.startsWith("data:")) {
        setImageSrc(sourceToUse);
        setIsLoading(false);
        return;
      }

      // Load the image
      const img = new Image();
      img.onload = () => {
        setImageSrc(sourceToUse);
        setIsLoading(false);
      };
      img.onerror = () => {
        console.error("Failed to load image:", sourceToUse);
        setImageSrc(placeholderUrl);
        setIsLoading(false);
      };
      img.src = sourceToUse;
    }, [cocktailId, imageData, staticCocktailImages, placeholderUrl]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center bg-gray-800/50 h-full w-full">
          <div className="relative">
            {/* 添加脉冲背景 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-pink-500/20 animate-pulse"></div>

            {/* 旋转边框 */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-b-amber-500 border-r-pink-500 border-t-transparent border-l-transparent animate-spin"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group overflow-hidden h-full w-full">
        <img
          src={imageSrc || placeholderUrl}
          alt={cocktailName ?? "Cocktail image"}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 animate-fadeIn"
          loading="lazy"
        />
      </div>
    );
  },
);

CocktailImage.displayName = "CocktailImage";

export default CocktailImage;
