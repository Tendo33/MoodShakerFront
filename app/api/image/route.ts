import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { generateImage } from "@/api/openai";
import { apiError, apiSuccess } from "@/lib/api-response";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getRecommendationSessionById, updateRecommendationSessionImage } from "@/lib/recommendation-sessions";
import { validateImageRequest } from "@/lib/request-validation";
import { imageLogger } from "@/utils/logger";

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

function getAllowedImageHosts(): Set<string> {
  const hosts = new Set<string>();
  const configured = process.env.IMAGE_FETCH_HOST_ALLOWLIST;

  if (configured) {
    configured
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((host) => hosts.add(host));
  }

  if (process.env.IMAGE_API_URL) {
    try {
      hosts.add(new URL(process.env.IMAGE_API_URL).hostname);
    } catch {
      imageLogger.warn("Failed to parse IMAGE_API_URL for host allowlist");
    }
  }

  return hosts;
}

function isAllowedRemoteImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return getAllowedImageHosts().has(parsed.hostname);
  } catch {
    return false;
  }
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

async function imageUrlToBuffer(url: string): Promise<Buffer> {
  if (!isAllowedRemoteImageUrl(url)) {
    throw new Error("Image host is not allowed for server-side fetch.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeoutId);
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

function isMissingJsonColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = validateImageRequest(body);

    if (!validated.success) {
      return apiError("INVALID_PAYLOAD", validated.message, 400);
    }

    const { recommendationId, editToken, prompt } = validated.data;
    const recommendation = await getRecommendationSessionById(
      recommendationId,
      editToken,
    );

    if (!recommendation) {
      return apiError(
        "FORBIDDEN",
        "You do not have permission to update this recommendation.",
        403,
      );
    }

    const rateLimit = consumeRateLimit(
      `image:${recommendationId}`,
      3,
      60 * 1000,
    );
    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMITED",
        "Image refresh is happening too frequently. Please wait a moment.",
        429,
      );
    }

    const imageUrl = await generateImage(prompt, {
      negative_prompt: "low quality, blurry, distorted",
      image_size: "1024x1024",
    });

    let optimizedImage = imageUrl;
    let thumbnailImage = imageUrl;

    try {
      const sharp = await getSharpFactory();
      if (sharp && isAllowedRemoteImageUrl(imageUrl)) {
        const buffer = await imageUrlToBuffer(imageUrl);
        optimizedImage = await createOptimizedImageData(sharp, buffer, 1024, 80);
        thumbnailImage = await createOptimizedImageData(sharp, buffer, 320, 60);
      } else if (!isAllowedRemoteImageUrl(imageUrl)) {
        imageLogger.warn("Skipping server-side image fetch due to host allowlist");
      }
    } catch (error) {
      if (!isMissingJsonColumnError(error)) {
        imageLogger.warn("Failed to optimize generated image", error);
      }
    }

    const updatedRecommendation = await updateRecommendationSessionImage({
      id: recommendationId,
      editToken,
      image: optimizedImage,
      thumbnail: thumbnailImage,
    });

    if (!updatedRecommendation) {
      return apiError(
        "NOT_FOUND",
        "Recommendation not found.",
        404,
      );
    }

    return apiSuccess(
      {
        image: updatedRecommendation.image || optimizedImage,
        thumbnail: updatedRecommendation.thumbnail || thumbnailImage,
      },
      200,
    );
  } catch (error) {
    imageLogger.error(
      "Image generation failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    return apiError(
      "IMAGE_GENERATION_FAILED",
      "Unable to generate a cocktail image right now.",
      500,
    );
  }
}
