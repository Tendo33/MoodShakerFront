import { generateImage } from "./openai"

/**
 * Image API integration
 */

/**
 * Generate an image prompt for the cocktail
 */
export function generateImagePrompt(cocktail: { english_name?: string; name: string }): string {
	return `Create a high-resolution image featuring a cocktail named ${cocktail.english_name} prominently in the center, elegantly garnished. The background should be intentionally blurred to draw attention to the ${cocktail.english_name} cocktail. Maintain a consistent top-down perspective for various name variations, ensuring the cocktail's allure is always showcased. Capture the image using a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 to create a shallow depth of field. The photo should have a vivid and clear style, highlighting the intricate details and vibrant colors of the ${cocktail.english_name} cocktail.`;
}

/**
 * Generate a cocktail image
 */
export async function generateCocktailImage(prompt: string, sessionId: string): Promise<string> {
	const requestId = `cocktail_img_${Math.random().toString(36).substring(2, 15)}`;
	const startTime = Date.now();

	console.log("INFO", `开始生成鸡尾酒图片 [${requestId}]`, {
		sessionId,
		promptLength: prompt.length,
		promptPreview: prompt.substring(0, 100) + "...",
	});

	try {
		// 检查缓存
		if (typeof window !== "undefined") {
			const cacheKey = `moodshaker-image-prompt-${prompt.substring(0, 50)}`;
			const cachedImage = localStorage.getItem(cacheKey);

			if (cachedImage) {
				console.log("INFO", `使用缓存的鸡尾酒图片 [${requestId}]`, {
					cacheKey,
					imageUrlPreview: cachedImage.substring(0, 50) + "...",
				});
				return cachedImage;
			}
		}

		console.log("DEBUG", `调用图像生成API [${requestId}]`, {
			negativePrompt: "low quality, blurry, out of focus, low resolution, bad anatomy, worst quality, low quality",
			imageSize: "1024x1024",
		});

		// 更新图像生成调用，使用更详细的提示词和负面提示词
		const imageUrl = await generateImage(prompt, {
			negative_prompt: "low quality, blurry, out of focus, low resolution, bad anatomy, worst quality, low quality",
			image_size: "1024x1024",
			// 不传入image参数，因为我们是从文本生成图像
		});

		const endTime = Date.now();
		const duration = endTime - startTime;

		console.log("INFO", `鸡尾酒图片生成成功 [${requestId}] (${duration}ms)`, {
			imageUrlPreview: imageUrl.substring(0, 50) + "...",
		});

		// 保存图片URL到本地存储
		if (typeof window !== "undefined") {
			localStorage.setItem(`moodshaker-image-${sessionId}`, imageUrl);

			// 同时按prompt缓存
			const cacheKey = `moodshaker-image-prompt-${prompt.substring(0, 50)}`;
			localStorage.setItem(cacheKey, imageUrl);

			console.log("DEBUG", `已缓存鸡尾酒图片 [${requestId}]`, {
				sessionCacheKey: `moodshaker-image-${sessionId}`,
				promptCacheKey: cacheKey,
			});
		}

		return imageUrl;
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		console.error("ERROR", `鸡尾酒图片生成失败 [${requestId}] (${duration}ms)`, {
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
					  }
					: String(error),
		});

		// 添加更多错误信息记录
		console.error("生成图片失败详情:", error);

		console.log("INFO", `返回占位图片 [${requestId}]`);
		return `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent("cocktail")}`;
	}
}

/**
 * 获取会话的鸡尾酒图片
 */
export function getCocktailImage(sessionId: string): string | null {
	if (typeof window === "undefined") return null;

	const imageKey = `moodshaker-image-${sessionId}`;
	const imageUrl = localStorage.getItem(imageKey);

	console.log("DEBUG", `获取会话鸡尾酒图片`, {
		sessionId,
		imageKey,
		found: !!imageUrl,
		imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + "..." : "null",
	});

	return imageUrl;
}
