import { generateImage } from "./openai";

/**
 * Generate an image prompt for the cocktail
 */
export function generateImagePrompt(cocktail: {
  english_name?: string;
  name: string;
}): string {
  const wine_name = cocktail.english_name || cocktail.name;

  return `Create a high-resolution product photo of a cocktail named ${wine_name} with these specifications:

Composition:

Center the cocktail perfectly in frame using a top-down perspective
Elevate the glass on an invisible stand for dimensional emphasis
Include elegant garnishes arranged in [suggest placement: spiral/radial/asymmetrical] pattern
Optical Characteristics:

Use a Canon EOS 5D Mark IV with 50mm f/1.8 lens
Technical Settings → ISO 100 | 1/200s | f/1.8
Achieve bokeh background with foreground/background separation
Lighting & Texture:

Soft directional lighting from [choose: left/right/top] to create:
Gentle liquid refraction patterns
Condensation beads on glass surface
Garnish texture details (salt rims, herb veins, fruit pulp)
Color Treatment:

Boost saturation selectively on:
Liquid hues (emphasize layered colors if present)
Garnish elements (citrus zest, edible flowers, etc.)
Maintain neutral white balance (5500K)
Style Consistency:

Commercial food photography aesthetic
Focus stacking for full liquid clarity
Negative space ratio: 30% around subject
For variant handling: Maintain identical framing/composition across different cocktail names, only changing liquid colors and garnish elements.`;
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
