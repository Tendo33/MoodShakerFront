import sharp from "sharp";

/**
 * Lifts near-white to white. Drinks are shot on white and laid on coloured
 * fields with `mix-blend-mode: multiply`, where any grey left in the backdrop
 * shows as a band. Generated backdrops land around #e0-#f0; a gain of 1.12
 * clips those to white and barely moves the colours of the drink.
 */
export function whitenBackground(source: Buffer): Promise<Buffer> {
  return sharp(source).linear(1.12, 0).png().toBuffer();
}
