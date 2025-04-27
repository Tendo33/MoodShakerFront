import { generateImage } from "./openai";

/**
 * Image API integration
 */

/**
 * Generate an image prompt for the cocktail
 */
export function generateImagePrompt(cocktail: {
  english_name?: string;
  name: string;
}): string {
  return `Create a high-resolution image featuring a cocktail named ${cocktail.english_name || cocktail.name} prominently in the center, elegantly garnished. The background should be intentionally blurred to draw attention to the ${cocktail.english_name || cocktail.name} cocktail. Maintain a consistent top-down perspective for various name variations, ensuring the cocktail's allure is always showcased. Capture the image using a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 to create a shallow depth of field. The photo should have a vivid and clear style, highlighting the intricate details and vibrant colors of the ${cocktail.english_name || cocktail.name} cocktail.`;
}

/**
 * Generate a cocktail image
 */
export async function generateCocktailImage(
  prompt: string,
  sessionId: string,
): Promise<string> {
  const requestId = `cocktail_img_${Math.random().toString(36).substring(2, 15)}`;
  const startTime = Date.now();
  const negativePrompt =
    "low quality, blurry, out of focus, low resolution, bad anatomy, worst quality, low quality";

  console.log("INFO", `开始生成鸡尾酒图片 [${requestId}]`, {
    sessionId,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100) + "...",
    negativePromptLength: negativePrompt.length,
    negativePromptPreview: negativePrompt.substring(0, 100) + "...",
  });

  try {
    // Always use a unique seed to prevent caching of similar prompts
    const uniqueSeed = Math.floor(Math.random() * 4999999999);

    // Update image generation call, using more detailed prompts and negative prompts
    const imageUrl = await generateImage(prompt, {
      negative_prompt: negativePrompt,
      image_size: "1024x1024",
      seed: uniqueSeed, // Use the unique seed
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log("INFO", `鸡尾酒图片生成成功 [${requestId}] (${duration}ms)`, {
      imageUrlPreview: imageUrl.substring(0, 50) + "...",
    });

    // Store the image URL in memory for the current session
    // We're not caching to localStorage anymore, just keeping track of the current image
    if (typeof window !== "undefined") {
      // Add timestamp to the image URL to prevent caching
      const timestampedUrl = imageUrl.includes("?")
        ? `${imageUrl}&_t=${Date.now()}`
        : `${imageUrl}?_t=${Date.now()}`;

      // Store in memory for the current session only
      window.__currentCocktailImage = {
        url: timestampedUrl,
        sessionId,
        timestamp: Date.now(),
      };

      console.log("DEBUG", `生成了新的鸡尾酒图片 [${requestId}]`, {
        sessionId,
        timestamp: Date.now(),
      });
    }

    // Return the image URL with a timestamp to prevent caching
    return imageUrl.includes("?")
      ? `${imageUrl}&_t=${Date.now()}`
      : `${imageUrl}?_t=${Date.now()}`;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error(
      "ERROR",
      `鸡尾酒图片生成失败 [${requestId}] (${duration}ms)`,
      {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
      },
    );

    // 添加更多错误信息记录
    console.error("生成图片失败详情:", error);

    console.log("INFO", `返回占位图片 [${requestId}]`);
    return `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent("cocktail")}&_t=${Date.now()}`;
  }
}

/**
 * 获取会话的鸡尾酒图片
 */
export function getCocktailImage(sessionId: string): string | null {
  if (typeof window === "undefined") return null;

  // We're not using localStorage anymore
  // Instead, check if we have a current image in memory
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

    console.log("DEBUG", `获取当前会话鸡尾酒图片`, {
      sessionId,
      found: true,
      timestamp: timestamp.toString(),
      imageUrlPreview: refreshedUrl.substring(0, 50) + "...",
    });

    return refreshedUrl;
  }

  console.log("DEBUG", `没有找到当前会话的鸡尾酒图片`, {
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
