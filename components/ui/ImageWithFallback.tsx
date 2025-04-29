"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackSrc: string;
  fallbackAlt?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  fallbackAlt,
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [imgAlt, setImgAlt] = useState(alt);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(src);
    setImgAlt(alt);
  }, [src, alt]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}
      <Image
        {...rest}
        src={imgSrc || fallbackSrc}
        alt={imgAlt || fallbackAlt || "Image"}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          if (fallbackAlt) setImgAlt(fallbackAlt);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
