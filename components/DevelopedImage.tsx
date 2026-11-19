"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * A photograph that comes up once it has loaded, like a print in the tray. Used
 * where the picture arrives after the page does: a drink's own page, a minute
 * after its recipe. The opacity sits on the image, which carries the multiply
 * blend itself, so the fade never shows the white backdrop as a square.
 */
export function DevelopedImage({ className = "", alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={`${className} transition-[opacity,transform] duration-[900ms] ease-out motion-reduce:transition-none ${
        loaded ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
      }`}
    />
  );
}
