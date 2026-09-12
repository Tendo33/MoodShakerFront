"use client";

import { useState, memo, type ComponentProps } from "react";
import Image from "next/image";
import { TerminalLoader } from "@/components/ui/terminal-loader";

type SafeImageProps = Omit<ComponentProps<typeof Image>, "src" | "alt"> & {
  src?: string | null;
  fallbackSrc: string;
  alt: string;
};

const SafeImage = memo(function SafeImage({
  src,
  fallbackSrc,
  alt,
  onError,
  onLoad,
  ...props
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const preferredSrc = src || fallbackSrc;
  const imgSrc = failedSrc === preferredSrc ? fallbackSrc : preferredSrc;
  const isLoading = loadedSrc !== imgSrc;

  return (
    <>
      {isLoading ? (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black/75">
          <TerminalLoader rows={5} cols={18} className="opacity-90" />
        </div>
      ) : null}
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onLoad={(event) => {
          setLoadedSrc(imgSrc);
          onLoad?.(event);
        }}
        onError={(event) => {
          setFailedSrc(preferredSrc);
          onError?.(event);
        }}
      />
    </>
  );
});

SafeImage.displayName = "SafeImage";

export { SafeImage };
export type { SafeImageProps };
