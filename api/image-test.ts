import { generateImage } from "./openai"

/**
 * 测试图像生成API
 * 这个函数可以用来直接测试图像生成API是否正常工作
 */
export async function testImageGeneration(prompt = "a beautiful cocktail with ice and lemon"): Promise<string> {
  console.log("开始测试图像生成API...")
  console.log("使用提示词:", prompt)

  try {
    // 使用与用户示例相同的参数
    const imageUrl = await generateImage(prompt, {
      negative_prompt: "low quality, blurry, out of focus, low resolution",
      image_size: "1024x1024",
      seed: 4999999999,
    })

    console.log("图像生成成功:", imageUrl)
    return imageUrl
  } catch (error) {
    console.error("图像生成测试失败:", error)
    throw error
  }
}

/**
 * 使用不同模型测试图像生成
 * 尝试多个模型，看哪个能成功
 */
export async function testMultipleModels(
  prompt = "a beautiful cocktail with ice and lemon",
): Promise<Record<string, string | Error>> {
  const models = [
    "Kwai-Kolors/Kolors",
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
  ]

  const results: Record<string, string | Error> = {}

  for (const model of models) {
    console.log(`测试模型: ${model}`)
    try {
      // 创建一个自定义的generateImage函数调用，指定模型
      const response = await fetch(
        process.env.NEXT_PUBLIC_IMAGE_API_URL || "https://api.siliconflow.cn/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_IMAGE_API_KEY}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            model,
            prompt,
            negative_prompt: "low quality, blurry, out of focus, low resolution",
            image_size: "1024x1024",
            batch_size: 1,
            seed: 4999999999,
            num_inference_steps: 20,
            guidance_scale: 7.5,
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      if (!data.images || !data.images[0] || !data.images[0].url) {
        throw new Error("Invalid response format")
      }

      results[model] = data.images[0].url
      console.log(`模型 ${model} 成功:`, data.images[0].url)
    } catch (error) {
      results[model] = error instanceof Error ? error : new Error(String(error))
      console.error(`模型 ${model} 失败:`, error)
    }
  }

  return results
}
