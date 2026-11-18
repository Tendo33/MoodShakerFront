import sharp from "sharp";

/** How much of each side is faded out, as a share of that side. */
const EDGE = 0.06;

/**
 * A white frame, opaque at the rim and clear a little way in. A cast shadow or
 * a reflection that runs off the photograph would otherwise end in a straight
 * line where the picture stops, visible once it is laid on a coloured field.
 */
function edgeFade(width: number, height: number): Buffer {
  const side = (id: string, x1: number, y1: number, x2: number, y2: number, rect: string) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<rect ${rect} fill="url(#${id})"/>`;
  const w = Math.round(width * EDGE);
  const h = Math.round(height * EDGE);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      side("l", 0, 0, 1, 0, `x="0" y="0" width="${w}" height="${height}"`) +
      side("r", 1, 0, 0, 0, `x="${width - w}" y="0" width="${w}" height="${height}"`) +
      side("t", 0, 0, 0, 1, `x="0" y="0" width="${width}" height="${h}"`) +
      side("b", 0, 1, 0, 0, `x="0" y="${height - h}" width="${width}" height="${h}"`) +
      `</svg>`,
  );
}

/** Fades the rim of a photograph to white. Exported for repairing pictures that are already stored. */
export async function fadeEdges(source: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) return source;
  return sharp(source)
    .flatten({ background: "#ffffff" })
    .composite([{ input: edgeFade(width, height) }])
    .png()
    .toBuffer();
}

/**
 * Makes a studio shot sit cleanly on a coloured field under
 * `mix-blend-mode: multiply`, where anything short of white shows.
 *
 * Lifts near-white to white: generated backdrops land around #e0-#f0, and a
 * gain of 1.12 clips those while barely moving the colours of the drink. Then
 * fades the rim, for what the gain cannot reach.
 */
export async function whitenBackground(source: Buffer): Promise<Buffer> {
  return fadeEdges(await sharp(source).linear(1.12, 0).png().toBuffer());
}
