// OpenAI API integration for direct model interactions

import { openaiLogger } from "@/utils/logger";
import { generateRequestId, generateImageId } from "@/utils/generateId";
import { optimizedFetch, createCacheKey } from "@/utils/api-optimization";

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

// Image generation API
const IMAGE_API_URL = process.env.IMAGE_API_URL;
const IMAGE_API_KEY = process.env.IMAGE_API_KEY;
const IMAGE_MODEL = process.env.IMAGE_MODEL || "Kwai-Kolors/Kolors";

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
    // 验证必要的环境变量
    if (!OPENAI_API_KEY) {
      openaiLogger.error(`Missing API key [${requestId}]`);
      throw new Error("OpenAI API密钥未配置，请检查环境变量OPENAI_API_KEY");
    }

    if (!OPENAI_BASE_URL) {
      openaiLogger.error(`Missing API base URL [${requestId}]`);
      throw new Error("OpenAI API地址未配置，请检查环境变量OPENAI_BASE_URL");
    }

    if (!model) {
      openaiLogger.error(`Missing model name [${requestId}]`);
      throw new Error("OpenAI模型名称未配置，请检查环境变量OPENAI_MODEL");
    }

    // 生成缓存键 - 基于消息内容和选项
    const cacheKey = createCacheKey(
      "chat-completion",
      model,
      messages,
      options,
    );

    const apiUrl = `${OPENAI_BASE_URL}chat/completions`;
    openaiLogger.debug(`Requesting ${apiUrl} with model ${model}`);

    const response = await optimizedFetch(
      apiUrl,
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
      let errorText = "";
      let errorDetails = "";

      try {
        errorText = await response.text();
        // 尝试解析JSON错误响应
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorText;
        } catch {
          errorDetails = errorText;
        }
      } catch {
        errorDetails = "无法读取错误响应";
      }

      openaiLogger.error(
        `Request failed [${requestId}] (${duration}ms) - Status: ${response.status}`,
        { statusText: response.statusText, error: errorDetails },
      );

      // 根据不同的HTTP状态码提供更友好的错误信息
      let userMessage = "";
      switch (response.status) {
        case 401:
          userMessage = "API密钥无效或已过期，请检查您的OpenAI API配置";
          break;
        case 429:
          userMessage = "API请求频率过高或配额已用尽，请稍后重试";
          break;
        case 500:
        case 502:
        case 503:
          userMessage = "OpenAI服务暂时不可用，请稍后重试";
          break;
        case 400:
          userMessage = `请求格式错误: ${errorDetails}`;
          break;
        default:
          userMessage = `API请求失败 (状态码 ${response.status}): ${errorDetails}`;
      }

      throw new Error(userMessage);
    }

    const data = await response.json();

    openaiLogger.info(`Request successful [${requestId}] (${duration}ms)`);

    // 验证响应数据格式
    if (
      !data ||
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message
    ) {
      openaiLogger.error(`Invalid response format [${requestId}]`, data);
      throw new Error("API返回了无效的响应格式");
    }

    return data.choices[0].message.content;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 如果错误已经是我们抛出的友好错误，直接传递
    if (error instanceof Error) {
      openaiLogger.error(
        `Request exception [${requestId}] (${duration}ms): ${error.message}`,
      );
      throw error;
    }

    // 处理未知错误
    openaiLogger.error(
      `Request exception [${requestId}] (${duration}ms)`,
      error,
    );
    throw new Error("API请求失败，请检查网络连接或稍后重试");
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
