// OpenAI API integration for direct model interactions

// Environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL

// Image generation API
const IMAGE_API_URL = process.env.NEXT_PUBLIC_IMAGE_API_URL || "https://api.siliconflow.cn/v1/images/generations"
const IMAGE_API_KEY = process.env.NEXT_PUBLIC_IMAGE_API_KEY

/**
 * 格式化日志消息
 */
function formatLogMessage(message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  let formattedMessage = `[${timestamp}] ${message}`

  if (data) {
    // 如果数据是对象，格式化它但限制大小
    if (typeof data === "object") {
      try {
        const stringified = JSON.stringify(data)
        formattedMessage += `\n${stringified.length > 500 ? stringified.substring(0, 500) + "..." : stringified}`
      } catch (e) {
        formattedMessage += `\n[Object cannot be stringified]`
      }
    } else {
      formattedMessage += `\n${data}`
    }
  }

  return formattedMessage
}

/**
 * 记录详细日志
 */
function logDetail(type: "INFO" | "ERROR" | "DEBUG", message: string, data?: any): void {
  const prefix = `[${type}][OpenAI API]`
  console[type === "ERROR" ? "error" : type === "DEBUG" ? "debug" : "log"](
    `${prefix} ${formatLogMessage(message, data)}`,
  )
}

/**
 * Send a chat completion request to the OpenAI API
 */
export async function getChatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options: {
    model?: string
    temperature?: number
    max_tokens?: number
  } = {},
): Promise<string> {
  const requestId = `req_${Math.random().toString(36).substring(2, 15)}`
  const startTime = Date.now()
  const model = options.model || "deepseek-v3-250324"

  logDetail("INFO", `开始请求模型 [${requestId}]`, {
    model,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000,
    messagesCount: messages.length,
    firstMessagePreview: messages[0]?.content.substring(0, 100) + "...",
    lastMessagePreview: messages[messages.length - 1]?.content.substring(0, 100) + "...",
  })

  try {
    // 记录请求详情
    logDetail("DEBUG", `请求详情 [${requestId}]`, {
      url: `${OPENAI_BASE_URL}chat/completions`,
      method: "POST",
      model,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      messagesCount: messages.length,
      totalTokensEstimate: messages.reduce((acc, msg) => acc + msg.content.length / 4, 0), // 粗略估计
    })

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
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    if (!response.ok) {
      const errorText = await response.text()
      logDetail("ERROR", `请求失败 [${requestId}] (${duration}ms)`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        headers: Object.fromEntries(response.headers.entries()),
      })
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // 记录成功响应
    logDetail("INFO", `请求成功 [${requestId}] (${duration}ms)`, {
      status: response.status,
      model: data.model,
      usage: data.usage,
      responsePreview: data.choices[0].message.content.substring(0, 100) + "...",
      finishReason: data.choices[0].finish_reason,
    })

    return data.choices[0].message.content
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime

    logDetail("ERROR", `请求异常 [${requestId}] (${duration}ms)`, {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    })

    throw error
  }
}

/**
 * Generate an image using the provided API
 */
export async function generateImage(
  prompt: string,
  options: {
    negative_prompt?: string
    image_size?: string
    seed?: number
    image?: string | null // 添加image参数，用于图像到图像生成
  } = {},
): Promise<string> {
  const requestId = `img_${Math.random().toString(36).substring(2, 15)}`
  const startTime = Date.now()

  logDetail("INFO", `开始生成图像 [${requestId}]`, {
    promptPreview: prompt.substring(0, 100) + "...",
    imageSize: options.image_size || "1024x1024",
    hasSeed: !!options.seed,
    hasNegativePrompt: !!options.negative_prompt,
    hasImage: !!options.image,
  })

  try {
    logDetail("DEBUG", `图像API配置 [${requestId}]`, {
      apiUrl: IMAGE_API_URL,
      apiKeyAvailable: !!IMAGE_API_KEY,
    })

    // Add more detailed logging
    if (!IMAGE_API_KEY) {
      logDetail("ERROR", `缺少API密钥 [${requestId}]`)
      throw new Error("Image API Key is required")
    }

    const seed = options.seed || Math.floor(Math.random() * 4999999999)

    // 修改为使用用户示例中的模型
    const requestBody = {
      model: "Kwai-Kolors/Kolors", // 更改为用户示例中的模型
      prompt,
      negative_prompt: options.negative_prompt || "",
      image_size: options.image_size || "1024x1024",
      batch_size: 1,
      seed,
      num_inference_steps: 20,
      guidance_scale: 7.5,
    }

    logDetail("DEBUG", `图像生成请求体 [${requestId}]`, {
      model: requestBody.model,
      promptLength: prompt.length,
      negativePromptLength: requestBody.negative_prompt.length,
      imageSize: requestBody.image_size,
      seed,
      steps: requestBody.num_inference_steps,
      guidanceScale: requestBody.guidance_scale,
      hasImage: !!options.image,
    })

    // 打印完整的请求体，便于调试
    console.log("完整请求体:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IMAGE_API_KEY}`,
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    // 打印完整的响应，便于调试
    const responseText = await response.text()
    console.log("API响应:", responseText)

    if (!response.ok) {
      logDetail("ERROR", `图像生成失败 [${requestId}] (${duration}ms)`, {
        status: response.status,
        statusText: response.statusText,
        responseText,
        headers: Object.fromEntries(response.headers.entries()),
      })
      throw new Error(`Image generation API error (${response.status}): ${responseText}`)
    }

    // 解析响应文本为JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      logDetail("ERROR", `解析响应JSON失败 [${requestId}]`, {
        responseText,
        error: e instanceof Error ? e.message : String(e),
      })
      throw new Error("Failed to parse response as JSON")
    }

    logDetail("INFO", `图像生成成功 [${requestId}] (${duration}ms)`, {
      status: response.status,
      responseStructure: {
        hasImages: !!data.images,
        imagesCount: data.images?.length || 0,
        hasUrls: !!data.images?.[0]?.url,
      },
      urlPreview: data.images?.[0]?.url ? data.images[0].url.substring(0, 50) + "..." : "No URL",
      timings: data.timings,
      seed: data.seed,
    })

    // 检查响应格式
    if (!data.images || !data.images[0] || !data.images[0].url) {
      logDetail("ERROR", `图像API响应格式错误 [${requestId}]`, data)
      throw new Error("Invalid response format from image API")
    }

    return data.images[0].url
  } catch (error) {
    const endTime = Date.now()
    const duration = endTime - startTime

    logDetail("ERROR", `图像生成异常 [${requestId}] (${duration}ms)`, {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : String(error),
    })

    throw error
  }
}
