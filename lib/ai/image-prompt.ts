import "server-only";

import type { Cocktail } from "@/lib/cocktail-types";

/**
 * Builds the image-generation prompt for a cocktail.
 *
 * Server-only on purpose. This used to live in `api/image.ts` and was called in
 * the browser, with the resulting prompt POSTed to `/api/image`, which forwarded
 * it to the image provider after only a length check. Anyone holding a
 * recommendation id and edit token could therefore generate arbitrary images on
 * the project's API key. The prompt is now derived on the server from the stored
 * cocktail payload, and the `server-only` import makes a client component that
 * tries to reach for it fail at build time rather than at review time.
 */
export function buildImagePrompt(
  cocktail: Pick<Cocktail, "name" | "english_name" | "serving_glass">,
): string {
  const wineName = cocktail.english_name || cocktail.name;
  const glassType = cocktail.serving_glass || "appropriate cocktail glass";

  return `Create a high-resolution image showcasing a cocktail named ${wineName}, served in a ${glassType}. Think carefully about the appearance of ${wineName}, centered and elegantly garnished. The background should be softly blurred to highlight the cocktail. Use a top-down perspective for consistency across different names, focusing on the cocktail's charm. Simulate a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 for a shallow depth of field. The style should be vivid and clear, emphasizing the cocktail's intricate details and vibrant colors. Make sure the ${glassType} is prominently featured and enhances the overall presentation of the cocktail.`;
}
