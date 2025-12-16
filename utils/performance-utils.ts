// 性能优化工具函数

import { useEffect, useState } from "react";
import { appLogger } from "@/utils/logger";

// 图片预加载 Hook
export const useImagePreload = (imageSources: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
      });
    };

    const preloadImages = async () => {
      try {
        const loaded = await Promise.allSettled(imageSources.map(preloadImage));

        const successful = loaded
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<string>).value);

        setLoadedImages(new Set(successful));
      } catch (error) {
        appLogger.warn("Image preload failed", error);
      }
    };

    if (imageSources.length > 0) {
      preloadImages();
    }
  }, [imageSources]);

  return loadedImages;
};
