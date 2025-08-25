// OpenAI API integration for direct model interactions

import { openaiLogger } from "@/utils/logger";
import { generateRequestId, generateImageId } from "@/utils/generateId";

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

  openaiLogger.info(`Starting model request [${requestId}]`, {
    model,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000,
    messagesCount: messages.length,
  });

  try {
    const response = await fetch(`${OPENAI_BASE_URL}chat/completions`, {
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
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      openaiLogger.error(`Request failed [${requestId}] (${duration}ms)`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    openaiLogger.info(`Request successful [${requestId}] (${duration}ms)`, {
      status: response.status,
      model: data.model,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason,
    });

    return data.choices[0].message.content;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    openaiLogger.error(`Request exception [${requestId}] (${duration}ms)`, {
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : String(error),
    });

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

  openaiLogger.info(`Starting image generation [${requestId}]`, {
    promptLength: prompt.length,
    imageSize: options.image_size || "1024x1024",
    hasSeed: !!options.seed,
    hasNegativePrompt: !!options.negative_prompt,
    hasImage: !!options.image,
  });

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

    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IMAGE_API_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!response.ok) {
      const responseText = await response.text();
      openaiLogger.error(
        `Image generation failed [${requestId}] (${duration}ms)`,
        {
          status: response.status,
          statusText: response.statusText,
          responseText,
        },
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
      openaiLogger.error(`Failed to parse response JSON [${requestId}]`, {
        error: e instanceof Error ? e.message : String(e),
      });
      throw new Error("Failed to parse response as JSON");
    }

    openaiLogger.info(
      `Image generation successful [${requestId}] (${duration}ms)`,
      {
        status: response.status,
        hasImages: !!data.images,
        imagesCount: data.images?.length || 0,
      },
    );

    // Check response format
    if (!data.images || !data.images[0] || !data.images[0].url) {
      openaiLogger.error(
        `Invalid response format from image API [${requestId}]`,
        data,
      );
      throw new Error("Invalid response format from image API");
    }

    return data.images[0].url;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    openaiLogger.error(
      `Image generation exception [${requestId}] (${duration}ms)`,
      {
        error:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : String(error),
      },
    );

    throw error;
  }
}
