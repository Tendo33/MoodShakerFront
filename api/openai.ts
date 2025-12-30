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
	} = {}
): Promise<string> {
	const requestId = generateRequestId();
	const startTime = Date.now();
	const model = OPENAI_MODEL;

	openaiLogger.info(`Starting model request [${requestId}]`);

	try {
		// Validate required environment variables
		if (!OPENAI_API_KEY) {
			openaiLogger.error(`Missing API key [${requestId}]`);
			throw new Error("OpenAI API key not configured. Please check OPENAI_API_KEY.");
		}

		if (!OPENAI_BASE_URL) {
			openaiLogger.error(`Missing API base URL [${requestId}]`);
			throw new Error("OpenAI API URL not configured. Please check OPENAI_BASE_URL.");
		}

		if (!model) {
			openaiLogger.error(`Missing model name [${requestId}]`);
			throw new Error("OpenAI Model not configured. Please check OPENAI_MODEL.");
		}

		// Generate cache key - based on messages and options
		const cacheKey = createCacheKey("chat-completion", model, messages, options);

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
				cacheTTL: 10 * 60 * 1000, // 10 minutes cache
				deduplicate: true,
				retryCount: 2,
			}
		);

		const endTime = Date.now();
		const duration = endTime - startTime;

		if (!response.ok) {
			let errorText = "";
			let errorDetails = "";

			try {
				errorText = await response.text();
				// Try to parse JSON error response
				try {
					const errorJson = JSON.parse(errorText);
					errorDetails = errorJson.error?.message || errorText;
				} catch {
					errorDetails = errorText;
				}
			} catch {
				errorDetails = "Cannot read error response";
			}

			openaiLogger.error(`Request failed [${requestId}] (${duration}ms) - Status: ${response.status}`, {
				statusText: response.statusText,
				error: errorDetails,
			});

			// Provide friendlier error messages based on HTTP status
			let userMessage = "";
			switch (response.status) {
				case 401:
					userMessage = "API Key invalid or expired. Check configuration.";
					break;
				case 429:
					userMessage = "API rate limit exceeded or quota exhausted. Try again later.";
					break;
				case 500:
				case 502:
				case 503:
					userMessage = "OpenAI service unavailable. Try again later.";
					break;
				case 400:
					userMessage = `Bad request: ${errorDetails}`;
					break;
				default:
					userMessage = `API request failed (Status ${response.status}): ${errorDetails}`;
			}

			throw new Error(userMessage);
		}

		const data = await response.json();

		openaiLogger.info(`Request successful [${requestId}] (${duration}ms)`);

		// Validate response data format
		if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
			openaiLogger.error(`Invalid response format [${requestId}]`, data);
			throw new Error("API returned invalid response format");
		}

		return data.choices[0].message.content;
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		// If it's already a friendly error we threw, pass it through
		if (error instanceof Error) {
			openaiLogger.error(`Request exception [${requestId}] (${duration}ms): ${error.message}`);
			throw error;
		}

		// Handle unknown errors
		openaiLogger.error(`Request exception [${requestId}] (${duration}ms)`, error);
		throw new Error("API request failed. Check network connection or try again later.");
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
	} = {}
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

		// Generate cache key - image generation typically not cached as we want new images
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
				cacheTTL: 0, // No cache for image gen
				deduplicate: true, // But deduplicate requests
				retryCount: 1,
			}
		);

		const endTime = Date.now();
		const duration = endTime - startTime;

		if (!response.ok) {
			const responseText = await response.text();
			openaiLogger.error(`Image generation failed [${requestId}] (${duration}ms)`);
			throw new Error(`Image generation API error (${response.status}): ${responseText}`);
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

		openaiLogger.info(`Image generation successful [${requestId}] (${duration}ms)`);

		// Check response format
		if (!data.images || !data.images[0] || !data.images[0].url) {
			openaiLogger.error(`Invalid response format from image API [${requestId}]`, data);
			throw new Error("Invalid response format from image API");
		}

		return data.images[0].url;
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		openaiLogger.error(`Image generation exception [${requestId}] (${duration}ms)`);

		throw error;
	}
}
