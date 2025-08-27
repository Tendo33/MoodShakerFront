// OpenAI API integration for direct model interactions

import { openaiLogger } from "@/utils/logger";
import { generateRequestId, generateImageId } from "@/utils/generateId";
import { optimizedFetch, createCacheKey } from "@/utils/api-optimization";

// Environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
const OPENAI_MODEL = process.env.NEXT_PUBLIC_OPENAI_MODEL;

// Image generation API
const IMAGE_API_URL = process.env.NEXT_PUBLIC_IMAGE_API_URL;
const IMAGE_API_KEY = process.env.NEXT_PUBLIC_IMAGE_API_KEY;
const IMAGE_MODEL = process.env.NEXT_PUBLIC_IMAGE_MODEL || "Kwai-Kolors/Kolors";

/**
 * Send a chat completion request to the OpenAI API
 */
export async function getChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {},
): Promise<string> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const model = OPENAI_MODEL;

  openaiLogger.info(`Starting model request [${requestId}]`);

  try {
    // 生成缓存键 - 基于消息内容和选项
    const cacheKey = createCacheKey(
      "chat-completion",
      model,
      messages,
      options,
    );

    const response = await optimizedFetch(
      `${OPENAI_BASE_URL}chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
        }),
      },
      {
        cacheKey,
        cacheTTL: 10 * 60 * 1000, // 10分钟缓存
        deduplicate: true,
        retryCount: 2,
      },
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      openaiLogger.error(`Request failed [${requestId}] (${duration}ms)`);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    openaiLogger.info(`Request successful [${requestId}] (${duration}ms)`);

    return data.choices[0].message.content;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    openaiLogger.error(`Request exception [${requestId}] (${duration}ms)`);

    throw error;
  }
}

/**
 * Generate an image using the provided API
 */
export async function generateImage(
  prompt: string,
  options: {
    negative_prompt?: string;
    image_size?: string;
    seed?: number;
    image?: string | null;
  } = {},
): Promise<string> {
  const requestId = generateImageId();
  const startTime = Date.now();

  openaiLogger.info(`Starting image generation [${requestId}]`);

  try {
    if (!IMAGE_API_KEY) {
      openaiLogger.error(`Missing API key [${requestId}]`);
      throw new Error("Image API Key is required");
    }

    const seed = options.seed || Math.floor(Math.random() * 4999999999);
    const requestBody = {
      model: IMAGE_MODEL,
      prompt,
      negative_prompt: options.negative_prompt || "",
      image_size: options.image_size || "1024x1024",
      batch_size: 1,
      seed,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    };

    if (!IMAGE_API_URL) {
      throw new Error("Image API URL is required");
    }

    // 生成缓存键 - 图片生成通常不缓存，因为每次都要新的图片
    const cacheKey = createCacheKey("image-generation", prompt, options);

    const response = await optimizedFetch(
      IMAGE_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IMAGE_API_KEY}`,
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      {
        cacheKey,
        cacheTTL: 0, // 图片生成不缓存
        deduplicate: true, // 但要去重
        retryCount: 1,
      },
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      const responseText = await response.text();
      openaiLogger.error(
        `Image generation failed [${requestId}] (${duration}ms)`,
      );
      throw new Error(
        `Image generation API error (${response.status}): ${responseText}`,
      );
    }

    // Parse response text as JSON
    let data;
    try {
      const responseText = await response.text();
      data = JSON.parse(responseText);
    } catch (e) {
      openaiLogger.error(`Failed to parse response JSON [${requestId}]`);
      throw new Error("Failed to parse response as JSON");
    }

    openaiLogger.info(
      `Image generation successful [${requestId}] (${duration}ms)`,
    );

    // Check response format
    if (!data.images || !data.images[0] || !data.images[0].url) {
      openaiLogger.error(
        `Invalid response format from image API [${requestId}]`,
      );
      throw new Error("Invalid response format from image API");
    }

    return data.images[0].url;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    openaiLogger.error(
      `Image generation exception [${requestId}] (${duration}ms)`,
    );

    throw error;
  }
}
