"use client"

import { useState, useEffect } from "react"
import Image, { type ImageProps } from "next/image"

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc: string
  fallbackAlt?: string
}

/**
 * 带有备用图像的图片组件
 * 当主图像加载失败时显示备用图像
 */
export default function ImageWithFallback({ src, fallbackSrc, alt, fallbackAlt, ...rest }: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [imgAlt, setImgAlt] = useState(alt)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setImgSrc(src)
    setImgAlt(alt)
  }, [src, alt])

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <Image
        {...rest}
        src={imgSrc || "/placeholder.svg"}
        alt={imgAlt}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc)
          if (fallbackAlt) setImgAlt(fallbackAlt)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
