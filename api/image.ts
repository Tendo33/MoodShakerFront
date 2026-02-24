import { imageLogger } from "@/utils/logger";

/**
 * Generate an image prompt for the cocktail
 * This function creates a detailed prompt for AI image generation
 */
export function generateImagePrompt(cocktail: {
  english_name?: string;
  name: string;
  serving_glass?: string;
}): string {
  const wine_name = cocktail.english_name || cocktail.name;
  const glass_type = cocktail.serving_glass || "appropriate cocktail glass";
  const image_prompt = `Create a high-resolution image showcasing a cocktail named ${wine_name}, served in a ${glass_type}. Think carefully about the appearance of ${wine_name}, centered and elegantly garnished. The background should be softly blurred to highlight the cocktail. Use a top-down perspective for consistency across different names, focusing on the cocktail's charm. Simulate a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 for a shallow depth of field. The style should be vivid and clear, emphasizing the cocktail's intricate details and vibrant colors. Make sure the ${glass_type} is prominently featured and enhances the overall presentation of the cocktail.`;
  imageLogger.info(`Generated image prompt for ${wine_name}`);
  return image_prompt;
}
