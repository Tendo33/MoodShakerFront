// OpenAI API integration for direct model interactions

// Environment variables
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL

// Image generation API
const IMAGE_API_URL = process.env.NEXT_PUBLIC_IMAGE_API_URL || "https://api.siliconflow.cn/v1/images/generations"
const IMAGE_API_KEY = process.env.NEXT_PUBLIC_IMAGE_API_KEY

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
  try {
    const response = await fetch(`${OPENAI_BASE_URL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || "deepseek-v3-250324", // Updated to use the specified model
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
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
  } = {},
): Promise<string> {
  try {
    console.log("Image API URL:", IMAGE_API_URL)
    console.log("Image API Key available:", !!IMAGE_API_KEY)

    // Add more detailed logging
    if (!IMAGE_API_KEY) {
      console.error("Image API Key is missing or empty")
      throw new Error("Image API Key is required")
    }

    const requestBody = {
      model: "black-forest-labs/FLUX.1-schnell", // Updated to use the specified model
      prompt,
      negative_prompt: options.negative_prompt || "",
      image_size: options.image_size || "1024x1024",
      batch_size: 1,
      seed: options.seed || Math.floor(Math.random() * 4999999999),
      num_inference_steps: 20,
      guidance_scale: 7.5,
    }

    console.log("Image generation request body:", JSON.stringify(requestBody))

    const response = await fetch(IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${IMAGE_API_KEY}`,
        // Add additional headers that might be required by the API
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Image API response status: ${response.status}`)
      console.error(`Image API response body: ${errorText}`)
      throw new Error(`Image generation API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    console.log("Image generation successful, received data:", JSON.stringify(data).substring(0, 100) + "...")

    // Check if the expected data structure is present
    if (!data.images || !data.images[0] || !data.images[0].url) {
      console.error("Unexpected response format from image API:", JSON.stringify(data))
      throw new Error("Invalid response format from image API")
    }

    return data.images[0].url
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}
