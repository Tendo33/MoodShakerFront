import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/api/openai";
import { imageLogger } from "@/utils/logger";

/**
 * POST /api/image
 * 生成鸡尾酒图片
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sessionId, forceRefresh = false } = body;

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

    return NextResponse.json({ success: true, data: imageUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

