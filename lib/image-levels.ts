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

/** The tallest a subject stands in the frame, and the widest it spreads, as shares of the side. */
const SUBJECT_HEIGHT = 0.78;
const SUBJECT_WIDTH = 0.6;
/** Darker than this counts as subject. The backdrop has already been lifted to white. */
const INK = 236;
/** A cut-out is never enlarged past this: a small glass blown up goes soft. */
const MAX_ENLARGE = 1.5;

/**
 * Sets the subject of a white-backdrop photograph at one size and in the
 * middle. The model is told how much of the frame the glass may take and does
 * not keep to it: one coupe touches the rim while a highball stands small, and
 * side by side on the menu they read as different shoots. Two limits rather
 * than one, so a low wide glass is not blown up to the height of a tall one.
 *
 * A picture with no white backdrop to speak of is returned as it came.
 */
export async function frameSubject(source: Buffer): Promise<Buffer> {
  const flat = sharp(source).flatten({ background: "#ffffff" });
  const { data, info } = await flat.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // A row or a column belongs to the subject when enough of it is inked; a stray
  // speck, or the provider's small mark in a corner, does not move the frame.
  const rows = new Uint32Array(height);
  const columns = new Uint32Array(width);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[y * width + x] < INK) {
        rows[y] += 1;
        columns[x] += 1;
      }
    }
  }
  const span = (counts: Uint32Array, least: number): [number, number] => {
    let first = 0;
    let last = counts.length - 1;
    while (first < last && counts[first] < least) first += 1;
    while (last > first && counts[last] < least) last -= 1;
    return [first, last];
  };
  const [top, bottom] = span(rows, Math.max(3, Math.round(width * 0.006)));
  const [left, right] = span(columns, Math.max(3, Math.round(height * 0.006)));
  const boxWidth = right - left + 1;
  const boxHeight = bottom - top + 1;
  if (boxWidth < width * 0.05 || boxHeight < height * 0.05) return source;
  if (boxWidth > width * 0.97 && boxHeight > height * 0.97) return source;

  const scale = Math.min((SUBJECT_HEIGHT * height) / boxHeight, (SUBJECT_WIDTH * width) / boxWidth, MAX_ENLARGE);
  const subjectWidth = Math.min(Math.round(boxWidth * scale), width);
  const subjectHeight = Math.min(Math.round(boxHeight * scale), height);
  const subject = await flat
    .extract({ left, top, width: boxWidth, height: boxHeight })
    .resize(subjectWidth, subjectHeight, { fit: "fill" })
    .png()
    .toBuffer();

  return sharp({ create: { width, height, channels: 3, background: "#ffffff" } })
    .composite([
      { input: subject, left: Math.round((width - subjectWidth) / 2), top: Math.round((height - subjectHeight) / 2) },
    ])
    .png()
    .toBuffer();
}

/**
 * Makes a studio shot sit cleanly on a coloured field under
 * `mix-blend-mode: multiply`, where anything short of white shows.
 *
 * Lifts near-white to white: generated backdrops land around #e0-#f0, and a
 * gain of 1.12 clips those while barely moving the colours of the drink. Sets
 * the glass at the house size in the middle of the frame. Then fades the rim,
 * for what the gain cannot reach.
 */
export async function whitenBackground(source: Buffer): Promise<Buffer> {
  return fadeEdges(await frameSubject(await sharp(source).linear(1.12, 0).png().toBuffer()));
}
