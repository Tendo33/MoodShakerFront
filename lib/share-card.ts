"use client";

import type { Dictionary } from "@/lib/dictionaries";
import type { RecipeView } from "@/lib/domain/recipe";
import type { Mood } from "@/lib/domain/vocabulary";
import { moodColor } from "@/lib/moods";

/**
 * The take-home card: the drink as a specimen on its mood's colour, its name
 * and what goes in it. Drawn on a canvas rather than snapshotted from the DOM so
 * the output is exact and no font has to be inlined.
 */

const WIDTH = 1080;
const HEIGHT = 1350;
const MARGIN = 72;
const INK = "#1a1a1a";
const INK_SOFT = "rgba(26, 26, 26, 0.68)";

function cssFamily(variable: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

/** Splits on spaces for Latin text and per character for CJK, then fits to `maxWidth`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const tokens = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);
  const lines: string[] = [];
  let line = "";

  for (const token of tokens) {
    const candidate = line + token;
    if (ctx.measureText(candidate).width <= maxWidth || line === "") {
      line = candidate;
    } else {
      lines.push(line.trimEnd());
      line = token.trimStart();
    }
  }
  if (line) lines.push(line.trimEnd());

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    // Through the same-origin image optimizer, so the canvas is never tainted by CORS.
    // q must be one of images.qualities (Next's default allows only 75).
    image.src = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
  });
}

export async function renderShareCard(
  recipe: RecipeView,
  imageUrl: string | null,
  mood: Mood | null,
  dict: Pick<Dictionary, "vocab">,
): Promise<Blob> {
  const sans = `${cssFamily("--font-hanken", "Helvetica")}, ${cssFamily("--font-noto-sans-sc", "sans-serif")}, sans-serif`;
  const ingredients = recipe.ingredients.slice(0, 5);
  const allText = [recipe.name, recipe.altName, ...ingredients.map((item) => item.name)].join("");

  const fonts = [`500 92px ${sans}`, `400 36px ${sans}`, `500 30px ${sans}`, `400 30px ${sans}`];
  await Promise.all(fonts.map((font) => document.fonts.load(font, allText).catch(() => [])));
  const image = imageUrl ? await loadImage(imageUrl) : null;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = moodColor(mood);
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // The drink, with its white backdrop multiplied away into the field.
  if (image) {
    const box = 700;
    const scale = Math.min(box / image.width, box / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(image, (WIDTH - w) / 2, 40 + (box - h) / 2, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.fillStyle = INK;
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 92px ${sans}`;
  ctx.letterSpacing = "-3px";
  let y = 840;
  for (const line of wrap(ctx, recipe.name, WIDTH - MARGIN * 2, 2)) {
    ctx.fillText(line, MARGIN, y);
    y += 92;
  }
  ctx.letterSpacing = "0px";

  ctx.fillStyle = INK_SOFT;
  ctx.font = `400 36px ${sans}`;
  ctx.fillText(wrap(ctx, recipe.altName, WIDTH - MARGIN * 2, 1)[0] ?? "", MARGIN, y - 30);
  y += 40;

  for (const item of ingredients) {
    const amount = [item.amount, item.unit].filter(Boolean).join(" ");
    ctx.fillStyle = INK;
    ctx.font = `500 30px ${sans}`;
    ctx.fillText(amount, MARGIN, y);
    ctx.font = `400 30px ${sans}`;
    ctx.fillText(wrap(ctx, item.name, WIDTH - MARGIN * 2 - 200, 1)[0] ?? "", MARGIN + 200, y);
    y += 46;
  }

  ctx.fillStyle = INK;
  ctx.font = `500 34px ${sans}`;
  ctx.fillText("MoodShaker", MARGIN, HEIGHT - MARGIN);
  ctx.textAlign = "right";
  ctx.font = `400 28px ${sans}`;
  ctx.fillText(
    `${dict.vocab.spirits[recipe.baseSpirit]} · ${dict.vocab.alcohol[recipe.alcoholLevel]}`,
    WIDTH - MARGIN,
    HEIGHT - MARGIN,
  );

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/png"),
  );
}

/** Native share sheet where files can be shared (mostly mobile), a download otherwise. */
export async function deliverCard(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
