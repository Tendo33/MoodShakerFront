"use client"

import React, { useState, useEffect } from "react"

interface CocktailImageProps {
  cocktailId?: string
  imageData: string | null
  cocktailName?: string
  staticCocktailImages: Record<string, string>
  className?: string
  placeholderClassName?: string
}

const CocktailImage = React.memo(
  ({
    cocktailId,
    imageData,
    cocktailName,
    staticCocktailImages,
    className = "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
    placeholderClassName = "",
  }: CocktailImageProps) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    // Generate a reliable placeholder URL
    const placeholderUrl = `/placeholder.svg?height=500&width=500&query=${encodeURIComponent(cocktailName || "cocktail")}`

    useEffect(() => {
      // Reset states when inputs change
      setIsLoading(true)
      setError(null)

      // Determine the source based on available data
      let sourceToUse: string | null = null

      if (cocktailId && staticCocktailImages[cocktailId]) {
        // If we have a cocktailId, use the static image if available
        sourceToUse = staticCocktailImages[cocktailId]
      } else if (imageData) {
        // Otherwise use the imageData if available
        sourceToUse = imageData
      }

      if (!sourceToUse) {
        // If no source is available, use placeholder and stop loading
        setImageSrc(placeholderUrl)
        setIsLoading(false)
        return
      }

      // Don't try to load the image if it's a data URL (base64)
      // Just set it directly as the source
      if (sourceToUse.startsWith("data:")) {
        setImageSrc(sourceToUse)
        setIsLoading(false)
        return
      }

      // Load the image
      const img = new Image()
      img.onload = () => {
        setImageSrc(sourceToUse)
        setIsLoading(false)
      }
      img.onerror = (e) => {
        console.error("Failed to load image:", sourceToUse)
        setError(new Error(`Failed to load image: ${sourceToUse}`))
        setImageSrc(placeholderUrl)
        setIsLoading(false)
      }
      img.src = sourceToUse
    }, [cocktailId, imageData, staticCocktailImages, placeholderUrl])

    if (isLoading) {
      return (
        <div className={`flex items-center justify-center bg-gray-800/50 ${placeholderClassName} h-full w-full`}>
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-amber-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-b-amber-500 border-r-pink-500 border-t-transparent border-l-transparent animate-spin"></div>
          </div>
        </div>
      )
    }

    return (
      <img
        src={imageSrc || placeholderUrl}
        alt={cocktailName ?? "Cocktail image"}
        className={className}
        loading="lazy"
      />
    )
  },
)

CocktailImage.displayName = "CocktailImage"

export default CocktailImage
