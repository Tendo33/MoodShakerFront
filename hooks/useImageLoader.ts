"use client"

import { useState, useEffect } from "react"

interface UseImageLoaderOptions {
  fallbackImage?: string
  onError?: (error: Error) => void
  onLoad?: () => void
}

/**
 * Custom hook for loading images with error handling and loading state
 */
export function useImageLoader(
  src: string | null | undefined,
  options: UseImageLoaderOptions = {},
): {
  imageSrc: string
  isLoading: boolean
  error: Error | null
  retry: () => void
} {
  const { fallbackImage = "/placeholder.svg", onError, onLoad } = options
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackImage)
  const [isLoading, setIsLoading] = useState<boolean>(!!src)
  const [error, setError] = useState<Error | null>(null)

  const loadImage = (url: string) => {
    if (!url) {
      setImageSrc(fallbackImage)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Don't try to load the image if it's a data URL (base64)
    // Just set it directly as the source
    if (url.startsWith("data:")) {
      setImageSrc(url)
      setIsLoading(false)
      if (onLoad) onLoad()
      return
    }

    const img = new Image()
    img.src = url

    img.onload = () => {
      setImageSrc(url)
      setIsLoading(false)
      if (onLoad) onLoad()
    }

    img.onerror = () => {
      const err = new Error(`Failed to load image: ${url}`)
      console.error("Image loading error:", err)
      setError(err)
      setIsLoading(false)

      // Always use a placeholder SVG as the ultimate fallback
      const placeholderSvg = `/placeholder.svg?height=500&width=800&query=${encodeURIComponent("cocktail")}`
      setImageSrc(placeholderSvg)

      if (onError) onError(err)
    }
  }

  useEffect(() => {
    if (src) {
      loadImage(src)
    } else {
      setImageSrc(fallbackImage)
      setIsLoading(false)
    }
  }, [src])

  const retry = () => {
    if (src) {
      loadImage(src)
    }
  }

  return { imageSrc, isLoading, error, retry }
}
