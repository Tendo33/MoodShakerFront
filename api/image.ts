import { generateImage } from "./openai";
import { generateImageId } from "@/utils/generateId";
import { imageCache, persistentImageCache, withCache } from "@/utils/cache-utils";
import { imageLogger } from "@/utils/logger";

/**
 * Generate an image prompt for the cocktail
 */
export function generateImagePrompt(cocktail: {
  english_name?: string;
  name: string;
  serving_glass?: string;
}): string {
  const wine_name = cocktail.english_name || cocktail.name;
  const glass_type = cocktail.serving_glass || "appropriate cocktail glass";
  const image_prompt = `Create a high-resolution image showcasing a cocktail named ${wine_name}, served in a ${glass_type}. Think carefully about the appearance of ${wine_name}, centered and elegantly garnished. The background should be softly blurred to highlight the cocktail. Use a top-down perspective for consistency across different names, focusing on the cocktail's charm. Simulate a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 for a shallow depth of field. The style should be vivid and clear, emphasizing the cocktail's intricate details and vibrant colors. Make sure the ${glass_type} is prominently featured and enhances the overall presentation of the cocktail.`;
  imageLogger.info(`Generated image prompt: ${image_prompt}`);
  return image_prompt;
}

/**
 * Generate a cocktail image - 内部函数（无缓存）
 */
async function _generateCocktailImage(
  prompt: string,
  sessionId: string,
  forceRefresh?: boolean,
): Promise<string> {
  const requestId = generateImageId();
  const startTime = Date.now();
  const negativePrompt =
    "low quality, blurry, out of focus, low resolution, bad anatomy, worst quality, low quality";

  imageLogger.info(`Starting cocktail image generation [${requestId}]`, {
    sessionId,
    promptLength: prompt.length,
  });

  try {
    // Use a unique seed, especially when force refreshing
    const uniqueSeed = forceRefresh 
      ? Math.floor(Math.random() * 4999999999)
      : Math.floor(Math.random() * 4999999999);

    // Update image generation call, using more detailed prompts and negative prompts
    const imageUrl = await generateImage(prompt, {
      negative_prompt: negativePrompt,
      image_size: "1024x1024",
      seed: uniqueSeed,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    imageLogger.info(`Cocktail image generation successful [${requestId}] (${duration}ms)`);

    // Add timestamp to the image URL to prevent caching
    return imageUrl.includes("?")
      ? `${imageUrl}&_t=${Date.now()}`
      : `${imageUrl}?_t=${Date.now()}`;
  } catch (error) {
    imageLogger.error("Error generating cocktail image", error);
    throw error;
  }
}

/**
 * 带缓存的图片生成函数
 */
export const generateCocktailImage = withCache(
  imageCache,
  (prompt: string, sessionId: string, forceRefresh?: boolean) => 
    forceRefresh ? `img:${sessionId}:${prompt.slice(0, 50)}:${Date.now()}` : `img:${sessionId}:${prompt.slice(0, 50)}`,
  10 * 60 * 1000 // 10分钟缓存
)(_generateCocktailImage);

/**
 * Get cocktail image for session
 */
export function getCocktailImage(sessionId: string): string | null {
  if (typeof window === "undefined") return null;

  if (
    window.__currentCocktailImage &&
    window.__currentCocktailImage.sessionId === sessionId
  ) {
    const imageUrl = window.__currentCocktailImage.url;
    const timestamp = Date.now();

    // Add a new timestamp to force a fresh load
    const refreshedUrl = imageUrl.includes("?")
      ? `${imageUrl}&_t=${timestamp}`
      : `${imageUrl}?_t=${timestamp}`;

    imageLogger.debug(`Retrieved current session cocktail image`, {
      sessionId,
      found: true,
      timestamp: timestamp.toString(),
    });

    return refreshedUrl;
  }

  imageLogger.debug(`No cocktail image found for current session`, {
    sessionId,
  });

  return null;
}

// Add this to the global Window interface
declare global {
  interface Window {
    __currentCocktailImage?: {
      url: string;
      sessionId: string;
      timestamp: number;
    };
  }
}
