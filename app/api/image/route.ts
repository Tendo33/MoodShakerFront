import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/api/openai";
import { imageLogger } from "@/utils/logger";
import { prisma } from "@/lib/prisma";

/**
 * Convert URL image to Base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
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
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (error) {
    imageLogger.error("Failed to convert image to base64", error);
    throw error;
  }
}

/**
 * POST /api/image
 * 生成鸡尾酒图片
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sessionId, forceRefresh = false, cocktailName } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数: prompt" },
        { status: 400 },
      );
    }

    imageLogger.info(`Processing image generation request`);

    // 调用图片生成 API
    const imageUrl = await generateImage(prompt, {
      negative_prompt: "low quality, blurry, distorted",
      image_size: "1024x1024",
    });

    imageLogger.info(`Image generation completed`);

    // Convert to Base64 and save to DB if cocktailName is provided
    let finalImage = imageUrl;
    if (cocktailName) {
      try {
        imageLogger.info(
          `Attempting to convert and save image for: ${cocktailName}`,
        );
        const base64Image = await imageUrlToBase64(imageUrl);
        finalImage = base64Image; // Return Base64 to frontend to avoid expiration

        await prisma.cocktail.updateMany({
          where: { name: cocktailName },
          data: { image: base64Image },
        });
        imageLogger.info(`Saved image for cocktail: ${cocktailName}`);
      } catch (dbError) {
        imageLogger.error("Failed to save image to DB", dbError);
        // Fallback: Return original URL if Base64 conversion/save fails
        // But note: original URL might expire or be inaccessible
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
