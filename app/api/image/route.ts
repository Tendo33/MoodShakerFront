import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/api/openai";
import { imageLogger } from "@/utils/logger";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface SharpTransformer {
  rotate(): SharpTransformer;
  resize(options: {
    width: number;
    withoutEnlargement: boolean;
    fit: "inside";
  }): SharpTransformer;
  webp(options: { quality: number }): SharpTransformer;
  toBuffer(): Promise<Buffer>;
}

type SharpFactory = (input: Buffer) => SharpTransformer;

let sharpFactory: SharpFactory | null | undefined;
let sharpFactoryPromise: Promise<SharpFactory | null> | null = null;
const THUMBNAIL_COLUMN_NAME = "thumbnail";

function isMissingThumbnailColumnError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2022") {
    return false;
  }

  const meta = error.meta as { column?: unknown } | undefined;
  const column = typeof meta?.column === "string" ? meta.column : "";

  return (
    error.message.toLowerCase().includes(THUMBNAIL_COLUMN_NAME) ||
    column.toLowerCase().includes(THUMBNAIL_COLUMN_NAME)
  );
}

async function getSharpFactory(): Promise<SharpFactory | null> {
  if (sharpFactory !== undefined) {
    return sharpFactory;
  }

  if (!sharpFactoryPromise) {
    sharpFactoryPromise = (async () => {
      try {
        const dynamicImport = new Function(
          "moduleName",
          "return import(moduleName)",
        ) as (moduleName: string) => Promise<{ default?: SharpFactory }>;
        const loaded = await dynamicImport("sharp");
        sharpFactory = (loaded.default || loaded) as SharpFactory;
        return sharpFactory;
      } catch {
        sharpFactory = null;
        imageLogger.warn("Sharp unavailable, using original image URLs");
        return null;
      }
    })();
  }

  return sharpFactoryPromise;
}

/**
 * Convert remote image URL to Buffer
 */
async function imageUrlToBuffer(
  url: string,
): Promise<Buffer> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    imageLogger.error("Failed to fetch image buffer", error);
    throw error;
  }
}

function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function createOptimizedImageData(
  sharp: SharpFactory,
  buffer: Buffer,
  width: number,
  quality: number,
): Promise<string> {
  const optimized = await sharp(buffer)
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality })
    .toBuffer();

  return bufferToDataUrl(optimized, "image/webp");
}

/**
 * POST /api/image
 * Generates a cocktail image based on prompts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, cocktailName } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: prompt" },
        { status: 400 },
      );
    }

    imageLogger.info(`Processing image generation request`);

    // Call image generation API
    const imageUrl = await generateImage(prompt, {
      negative_prompt: "low quality, blurry, distorted",
      image_size: "1024x1024",
    });

    imageLogger.info(`Image generation completed`);

    // Convert to optimized Base64 images and save to DB if cocktailName is provided
    let finalImage = imageUrl;
    if (cocktailName) {
      try {
        imageLogger.info(
          `Attempting to optimize and save image for: ${cocktailName}`,
        );
        const sharp = await getSharpFactory();
        let optimizedImage = imageUrl;
        let thumbnailImage = imageUrl;

        if (sharp) {
          const buffer = await imageUrlToBuffer(imageUrl);
          optimizedImage = await createOptimizedImageData(
            sharp,
            buffer,
            1024,
            80,
          );
          thumbnailImage = await createOptimizedImageData(
            sharp,
            buffer,
            320,
            60,
          );
        }

        finalImage = optimizedImage;

        try {
          await prisma.cocktail.updateMany({
            where: { name: cocktailName },
            data: { image: optimizedImage, thumbnail: thumbnailImage },
          });
        } catch (dbError) {
          if (!isMissingThumbnailColumnError(dbError)) {
            throw dbError;
          }

          imageLogger.warn(
            `[DB Compatibility][api/image] Missing "${THUMBNAIL_COLUMN_NAME}". Retrying with image only. Please run "pnpm prisma:migrate" or "pnpm db:init".`,
          );

          await prisma.cocktail.updateMany({
            where: { name: cocktailName },
            data: { image: optimizedImage },
          });
        }
        imageLogger.info(`Saved image for cocktail: ${cocktailName}`);
      } catch (dbError) {
        imageLogger.error("Failed to save image to DB", dbError);
        // Fallback: return original URL if optimization/save fails
      }
    }

    return NextResponse.json({ success: true, data: finalImage });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    imageLogger.error("Image generation failed", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
