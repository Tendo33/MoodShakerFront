import { generateImage } from "./openai";

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

  console.log("INFO", `Starting cocktail image generation [${requestId}]`, {
    sessionId,
    promptLength: prompt.length,
  });

  try {
    // Always use a unique seed to prevent caching of similar prompts
    const uniqueSeed = Math.floor(Math.random() * 4999999999);

    // Update image generation call, using more detailed prompts and negative prompts
    const imageUrl = await generateImage(prompt, {
      negative_prompt: negativePrompt,
      image_size: "1024x1024",
      seed: uniqueSeed,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      "INFO",
      `Cocktail image generation successful [${requestId}] (${duration}ms)`,
    );

    // Store the image URL in memory for the current session
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

      console.log("DEBUG", `Generated new cocktail image [${requestId}]`, {
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
      `Cocktail image generation failed [${requestId}] (${duration}ms)`,
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : String(error),
      },
    );

    console.log("INFO", `Returning placeholder image [${requestId}]`);
    return `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent("cocktail")}&_t=${Date.now()}`;
  }
}

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

    console.log("DEBUG", `Retrieved current session cocktail image`, {
      sessionId,
      found: true,
      timestamp: timestamp.toString(),
    });

    return refreshedUrl;
  }

  console.log("DEBUG", `No cocktail image found for current session`, {
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
