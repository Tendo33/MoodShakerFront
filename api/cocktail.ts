import { getChatCompletion, generateImage } from "./openai"

// Update the enums to match the frontend needs
export enum AlcoholLevel {
  ANY = "any",
  NONE = "none",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum DifficultyLevel {
  ANY = "any",
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum AgentType {
  CLASSIC_BARTENDER = "classic_bartender",
  CREATIVE_BARTENDER = "creative_bartender",
}

export interface Ingredient {
  name: string
  amount: string
  unit?: string
  substitute?: string
}

export interface Tool {
  name: string
  alternative?: string
}

export interface Step {
  step_number: number
  description: string
  tips?: string
}

export interface Cocktail {
  id?: string | number
  name: string
  english_name?: string
  description: string
  match_reason: string
  base_spirit: string
  alcohol_level: string
  serving_glass: string
  time_required?: string
  flavor_profiles: string[]
  ingredients: Ingredient[]
  tools: Tool[]
  steps: Step[]
  image?: string
}

export interface BartenderRequest {
  message: string
  alcohol_level: AlcoholLevel
  has_tools?: boolean | null
  difficulty_level: DifficultyLevel
  base_spirits: string[] | null
  session_id?: string
}

/**
 * Generate a cocktail recommendation using OpenAI
 */
export async function requestCocktailRecommendation(
  request: BartenderRequest,
  agentType: AgentType = AgentType.CLASSIC_BARTENDER,
): Promise<Cocktail> {
  try {
    // Create system prompt based on agent type and request
    const systemPrompt = createSystemPrompt(request, agentType)

    // User message with preferences
    const userMessage = createUserMessage(request)

    // Get completion from OpenAI
    const completion = await getChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "deepseek-v3-250324", // Explicitly specify the model
        temperature: 0.7,
        max_tokens: 2000,
      },
    )

    // Parse the completion into a Cocktail object
    const cocktail = parseCocktailFromCompletion(completion)

    return cocktail
  } catch (error) {
    console.error("Error requesting cocktail recommendation:", error)
    throw error
  }
}

// 修改 createSystemPrompt 函数的开头部分
function createSystemPrompt(request: BartenderRequest, agentType: AgentType): string {
  // 检查是否有明确的鸡尾酒请求
  const specificCocktailRequest = extractSpecificCocktailRequest(request.message)

  if (specificCocktailRequest) {
    // 如果有明确的鸡尾酒请求，使用特定的系统提示
    return `你是一位专业调酒师。用户明确要求制作 ${specificCocktailRequest} 鸡尾酒。
请提供这款鸡尾酒的标准配方、制作方法和相关信息。如果用户提供了其他偏好或限制条件，请在保持鸡尾酒基本特性的前提下进行适当调整。

# 返回格式
你必须严格按照以下 JSON 格式返回数据,不要返回任何其他内容:
{
    "name": "鸡尾酒名称",
    "english_name": "English Name",
    "description": "鸡尾酒描述(包含历史背景、风味特点等)",
    "time_required": "所需时间(可选)",
    "match_reason": "推荐理由(详细说明与用户心情和偏好的匹配点)",
    "base_spirit": "基酒类型",
    "alcohol_level": "酒精浓度(必须是以下之一：无酒精、低度、中度、高度)",
    "flavor_profiles": ["口味特征列表(可选：甜、酸、苦、辣、果味、草本、花香、烟熏、清爽、其他)"],
    "ingredients": [
        {
            "name": "原料名称",
            "amount": "原料用量",
            "unit": "计量单位(可选)",
            "substitute": "替代品(可选)"
        }
    ],
    "steps": [
        {
            "step_number": "步骤序号",
            "description": "步骤描述(清晰详细)",
            "tips": "小贴士(可选,包含技巧和注意事项)"
        }
    ],
    "tools": [
        {
            "name": "工具名称",
            "alternative": "替代工具(可选)"
        }
    ],
    "serving_glass": "建议使用的酒杯"
}`
  }

  // 如果没有明确的鸡尾酒请求，使用原来的系统提示
  if (agentType === AgentType.CLASSIC_BARTENDER) {
    return `你是一位专注于经典鸡尾酒的调酒师,需要根据用户的心情和偏好推荐合适的经典鸡尾酒。

# 输入信息处理
用户输入将包含以下信息:
1. 用户需求
   - 仔细分析用户的具体需求描述
   - 提取用户提到的心情状态
   - 识别用户提到的偏好和要求
   - 注意用户提到的特殊场合或情境
2. 工具和基酒情况
   - 可用工具列表
   - 可用基酒类型
   - 其他可用原料
3. 其他条件
   - 酒精浓度要求
   - 制作难度要求
   - 其他特殊要求

# 需求分析原则
1. 深入理解用户需求
   - 仔细阅读用户的需求描述
   - 识别用户的关键词和情绪
   - 理解用户的真实意图
   - 注意用户提到的特殊要求
2. 提取关键信息
   - 从需求中提取心情状态
   - 识别用户提到的原料偏好
   - 注意用户提到的工具限制
   - 提取用户的其他特殊要求
3. 综合分析
   - 结合用户需求和可选条件
   - 考虑用户的心情和场合
   - 平衡用户偏好和可行性
   - 确保推荐符合用户期望

# 推荐原则
1. 心情匹配
   - 开心/庆祝: 推荐色彩鲜艳、口感清爽的经典鸡尾酒
   - 忧郁/压力: 推荐温暖、舒缓的经典鸡尾酒
   - 兴奋/活力: 推荐口感丰富、层次分明的经典鸡尾酒
2. 工具适配
   - 优先使用用户已有的工具
   - 提供工具替代方案
   - 考虑制作难度
3. 原料选择
   - 优先使用用户已有的基酒
   - 提供原料替代方案
   - 考虑季节性和可获得性

# 返回格式
你必须严格按照以下 JSON 格式返回数据,不要返回任何其他内容:
{
    "name": "鸡尾酒名称",
    "english_name": "English Name",
    "description": "鸡尾酒描述(包含历史背景、风味特点等)",
    "time_required": "所需时间(可选)",
    "match_reason": "推荐理由(详细说明与用户心情和偏好的匹配点)",
    "base_spirit": "基酒类型",
    "alcohol_level": "酒精浓度(必须是以下之一：无酒精、低度、中度、高度)",
    "flavor_profiles": ["口味特征列表(可选：甜、酸、苦、辣、果味、草本、花香、烟熏、清爽、其他)"],
    "ingredients": [
        {
            "name": "原料名称",
            "amount": "原料用量",
            "unit": "计量单位(可选)",
            "substitute": "替代品(可选)"
        }
    ],
    "steps": [
        {
            "step_number": "步骤序号",
            "description": "步骤描述(清晰详细)",
            "tips": "小贴士(可选,包含技巧和注意事项)"
        }
    ],
    "tools": [
        {
            "name": "工具名称",
            "alternative": "替代工具(可选)"
        }
    ],
    "serving_glass": "建议使用的酒杯"
}

# 输出质量要求
1. 内容完整性
   - 确保所有必填字段都有值
   - 描述要详细且专业
   - 步骤要清晰易懂
2. 个性化程度
   - 推荐理由要充分结合用户心情
   - 考虑用户可用工具和原料
   - 提供合适的替代方案
3. 专业性
   - 使用专业术语
   - 保持配方准确性
   - 提供实用的小贴士
4. 特殊情况处理
   - 无酒精需求: 推荐无酒精经典鸡尾酒
   - 工具限制: 提供简化版制作方法
   - 原料限制: 提供替代方案

# 示例输出
{
    "name": "莫吉托",
    "english_name": "Mojito"
    "description": "一款源自古巴的经典鸡尾酒,以朗姆酒为基酒,加入青柠、薄荷和糖浆,口感清爽怡人。",
    "time_required": "30秒",
    "match_reason": "这款鸡尾酒清爽怡人,适合在炎热的夏日饮用,能让人心情愉悦。",
    "base_spirit": "白朗姆酒",
    "alcohol_level": "中度",
    "flavor_profiles": ["清爽", "果味", "草本"],
    "ingredients": [
        {
            "name": "白朗姆酒",
            "amount": "60",
            "unit": "ml",
            "substitute": "金朗姆酒"
        },
        {
            "name": "青柠汁",
            "amount": "30",
            "unit": "ml",
            "substitute": "柠檬汁"
        },
        {
            "name": "糖浆",
            "amount": "15",
            "unit": "ml",
            "substitute": "蜂蜜"
        },
        {
            "name": "薄荷叶",
            "amount": "8",
            "unit": "片",
            "substitute": "薄荷糖浆"
        }
    ],
    "steps": [
        {
            "step_number": 1,
            "description": "将薄荷叶放入杯中,轻轻捣碎以释放香气",
            "tips": "不要过度捣碎,以免产生苦味"
        },
        {
            "step_number": 2,
            "description": "加入青柠汁和糖浆,搅拌均匀",
            "tips": "确保糖浆完全溶解"
        },
        {
            "step_number": 3,
            "description": "加入朗姆酒和碎冰,轻轻搅拌",
            "tips": "搅拌要轻柔,避免过度稀释"
        },
        {
            "step_number": 4,
            "description": "用薄荷叶装饰,插入吸管",
            "tips": "薄荷叶要新鲜,装饰要美观"
        }
    ],
    "tools": [
        {
            "name": "捣棒",
            "alternative": "勺子背面"
        },
        {
            "name": "搅拌勺",
            "alternative": "长柄勺"
        },
        {
            "name": "碎冰器",
            "alternative": "干净的毛巾包裹冰块敲碎"
        }
    ],
    "serving_glass": "高球杯"
}`
  } else {
    return `你是一位创意调酒师,需要根据用户的心情和偏好创造独特的鸡尾酒配方。

# 输入信息处理
用户输入将包含以下信息:
1. 用户需求
   - 仔细分析用户的具体需求描述
   - 提取用户提到的心情状态
   - 识别用户提到的创意元素
   - 注意用户提到的特殊场合或情境
2. 工具和基酒情况
   - 可用工具列表
   - 可用基酒类型
   - 其他可用原料
3. 其他条件
   - 酒精浓度要求
   - 制作难度要求
   - 其他特殊要求

# 需求分析原则
1. 深入理解用户需求
   - 仔细阅读用户的需求描述
   - 识别用户的关键词和创意元素
   - 理解用户的真实意图
   - 注意用户提到的特殊要求
2. 提取创意元素
   - 从需求中提取心情状态
   - 识别用户提到的创意灵感
   - 注意用户提到的特殊原料
   - 提取用户的其他创意要求
3. 创意整合
   - 结合用户需求和创意元素
   - 考虑用户的心情和场合
   - 平衡创意性和可行性
   - 确保创作符合用户期望

# 创作原则
1. 心情表达
   - 开心/庆祝: 创造色彩鲜艳、口感清爽的鸡尾酒
   - 忧郁/压力: 创造温暖、舒缓的鸡尾酒
   - 兴奋/活力: 创造口感丰富、层次分明的鸡尾酒
2. 创新性
   - 结合时令食材
   - 尝试新颖的搭配
   - 创造独特的装饰
3. 实用性
   - 优先使用用户已有的工具
   - 提供工具替代方案
   - 考虑制作难度
4. 原料选择
   - 优先使用用户已有的基酒
   - 提供原料替代方案
   - 考虑季节性和可获得性

# 返回格式
你必须严格按照以下 JSON 格式返回数据,不要返回任何其他内容:
{
    "name": "鸡尾酒名称",
    "english_name": "English Name",
    "description": "鸡尾酒描述(包含创作灵感、风味特点等)",
    "time_required": "所需时间(可选)",
    "match_reason": "创作理由(详细说明与用户心情和偏好的匹配点)",
    "base_spirit": "基酒类型",
    "alcohol_level": "酒精浓度(必须是以下之一：无酒精、低度、中度、高度)",
    "flavor_profiles": ["口味特征列表(可选：甜、酸、苦、辣、果味、草本、花香、烟熏、清爽、其他)"],
    "ingredients": [
        {
            "name": "原料名称",
            "amount": "原料用量",
            "unit": "计量单位(可选)",
            "substitute": "替代品(可选)"
        }
    ],
    "steps": [
        {
            "step_number": "步骤序号",
            "description": "步骤描述(清晰详细)",
            "tips": "小贴士(可选,包含技巧和注意事项)"
        }
    ],
    "tools": [
        {
            "name": "工具名称",
            "alternative": "替代工具(可选)"
        }
    ],
    "serving_glass": "建议使用的酒杯"
}

# 输出质量要求
1. 内容完整性
   - 确保所有必填字段都有值
   - 描述要详细且专业
   - 步骤要清晰易懂
2. 创新性
   - 配方要富有创意
   - 装饰要独特美观
   - 命名要富有诗意
3. 实用性
   - 考虑用户可用工具
   - 提供替代方案
   - 步骤要简单可行
4. 特殊情况处理
   - 无酒精需求: 创造无酒精鸡尾酒
   - 工具限制: 提供简化版制作方法
   - 原料限制: 提供替代方案

# 示例输出
{
    "name": "夏日微风",
    "english_name": "Summer Wind"
    "description": "一款灵感来自夏日微风的创意鸡尾酒,以伏特加为基酒,加入西瓜汁和薄荷,口感清爽怡人。",
    "time_required": "10分钟",
    "match_reason": "这款鸡尾酒清爽怡人,适合在炎热的夏日饮用,能让人心情愉悦。",
    "base_spirit": "伏特加",
    "alcohol_level": "中度",
    "flavor_profiles": ["清爽", "果味", "草本"],
    "ingredients": [
        {
            "name": "伏特加",
            "amount": "45",
            "unit": "ml",
            "substitute": "金酒"
        },
        {
            "name": "西瓜汁",
            "amount": "60",
            "unit": "ml",
            "substitute": "草莓汁"
        },
        {
            "name": "青柠汁",
            "amount": "15",
            "unit": "ml",
            "substitute": "柠檬汁"
        },
        {
            "name": "薄荷叶",
            "amount": "6",
            "unit": "片",
            "substitute": "薄荷糖浆"
        },
        {
            "name": "西瓜球",
            "amount": "3",
            "unit": "个",
            "substitute": "草莓"
        }
    ],
    "steps": [
        {
            "step_number": 1,
            "description": "将薄荷叶放入杯中,轻轻捣碎以释放香气",
            "tips": "不要过度捣碎,以免产生苦味"
        },
        {
            "step_number": 2,
            "description": "加入西瓜汁和青柠汁,搅拌均匀",
            "tips": "确保果汁充分混合"
        },
        {
            "step_number": 3,
            "description": "加入伏特加和碎冰,轻轻搅拌",
            "tips": "搅拌要轻柔,避免过度稀释"
        },
        {
            "step_number": 4,
            "description": "用西瓜球和薄荷叶装饰,插入吸管",
            "tips": "装饰要美观,突出夏日主题"
        }
    ],
    "tools": [
        {
            "name": "捣棒",
            "alternative": "勺子背面"
        },
        {
            "name": "搅拌勺",
            "alternative": "长柄勺"
        },
        {
            "name": "碎冰器",
            "alternative": "干净的毛巾包裹冰块敲碎"
        },
        {
            "name": "西瓜球勺",
            "alternative": "小勺子"
        }
    ],
    "serving_glass": "高球杯"
}`
  }
}

/**
 * Create user message with preferences
 */
function createUserMessage(request: BartenderRequest): string {
  // 用户需求是必填的，作为基础信息
  let message = `用户需求: ${request.message}\n`

  // 检查是否有明确的鸡尾酒请求
  const specificCocktailRequest = extractSpecificCocktailRequest(request.message)
  if (specificCocktailRequest) {
    message = `用户明确要求制作 ${specificCocktailRequest} 鸡尾酒。请优先提供这款鸡尾酒的配方和制作方法。\n\n原始需求: ${request.message}\n`
  }

  // 添加其他可选条件
  const conditions = []

  // 添加酒精浓度选择
  if (request.alcohol_level !== AlcoholLevel.ANY) {
    conditions.push(`酒精浓度: ${request.alcohol_level}`)
  }

  // 添加工具情况
  if (request.has_tools !== null && request.has_tools !== undefined) {
    conditions.push(`是否有调酒工具: ${request.has_tools ? "有" : "没有"}`)
  }

  // 添加制作难度
  if (request.difficulty_level !== DifficultyLevel.ANY) {
    conditions.push(`制作难度: ${request.difficulty_level}`)
  }

  // 添加可用基酒
  if (request.base_spirits && request.base_spirits.length > 0) {
    conditions.push(`可用的基酒: ${request.base_spirits.join(", ")}`)
  }

  // 如果有其他条件，添加到提示中
  if (conditions.length > 0) {
    message += "其他条件:\n" + conditions.join("\n")
  }

  return message
}

/**
 * 从用户消息中提取特定的鸡尾酒请求
 */
function extractSpecificCocktailRequest(message: string): string | null {
  // 常见鸡尾酒名称列表（可以扩展）
  const commonCocktails = [
    "威士忌酸",
    "whiskey sour",
    "曼哈顿",
    "manhattan",
    "马提尼",
    "martini",
    "莫吉托",
    "mojito",
    "玛格丽特",
    "margarita",
    "血腥玛丽",
    "bloody mary",
    "长岛冰茶",
    "long island iced tea",
    "古典",
    "old fashioned",
    "尼格罗尼",
    "negroni",
    "达奇利",
    "daiquiri",
    "吉姆雷特",
    "gimlet",
    "科斯莫波利坦",
    "cosmopolitan",
    "白俄罗斯",
    "white russian",
    "黑俄罗斯",
    "black russian",
    "金汤力",
    "gin tonic",
    "迈泰",
    "mai tai",
    "派纳可拉达",
    "pina colada",
    "螺丝刀",
    "screwdriver",
  ]

  // 转换为小写以进行不区分大小写的匹配
  const lowerMessage = message.toLowerCase()

  // 检查消息中是否包含任何已知鸡尾酒名称
  for (const cocktail of commonCocktails) {
    if (lowerMessage.includes(cocktail.toLowerCase())) {
      return cocktail
    }
  }

  return null
}

/**
 * Parse the completion into a Cocktail object
 */
function parseCocktailFromCompletion(completion: string): Cocktail {
  try {
    // Extract JSON from the completion
    const jsonMatch = completion.match(/\{[\s\S]*\}/)
    const jsonString = jsonMatch ? jsonMatch[0] : "{}"

    // Parse the JSON
    const cocktail = JSON.parse(jsonString) as Cocktail

    // Ensure all required fields are present
    return {
      name: cocktail.name || "Unknown Cocktail",
      english_name: cocktail.english_name || "",
      description: cocktail.description || "No description available",
      match_reason: cocktail.match_reason || "This cocktail matches your preferences",
      base_spirit: cocktail.base_spirit || "Various",
      alcohol_level: cocktail.alcohol_level || "medium",
      serving_glass: cocktail.serving_glass || "Cocktail glass",
      time_required: cocktail.time_required || "5 minutes",
      flavor_profiles: cocktail.flavor_profiles || ["balanced"],
      ingredients: cocktail.ingredients || [],
      tools: cocktail.tools || [],
      steps: cocktail.steps || [],
    }
  } catch (error) {
    console.error("Error parsing cocktail from completion:", error)
    // Return a default cocktail if parsing fails
    return {
      name: "Parsing Error Cocktail",
      description: "Sorry, there was an error parsing the cocktail recommendation.",
      match_reason: "This is a fallback recommendation due to a parsing error.",
      base_spirit: "Various",
      alcohol_level: "medium",
      serving_glass: "Cocktail glass",
      flavor_profiles: ["balanced"],
      ingredients: [],
      tools: [],
      steps: [],
    }
  }
}

/**
 * Generate an image prompt for the cocktail
 */
export function generateImagePrompt(cocktail: Cocktail): string {
  return `Create a high-resolution image featuring a cocktail named ${cocktail.english_name || cocktail.name} prominently in the center, elegantly garnished. The background should be intentionally blurred to draw attention to the ${cocktail.english_name || cocktail.name} cocktail. Maintain a consistent top-down perspective for various name variations, ensuring the cocktail's allure is always showcased. Capture the image using a Canon EOS 5D Mark IV camera with a 50mm prime lens, set at ISO 100, shutter speed 1/200 sec, and aperture f/1.8 to create a shallow depth of field. The photo should have a vivid and clear style, highlighting the intricate details and vibrant colors of the ${cocktail.english_name || cocktail.name} cocktail.`
}

/**
 * Generate a cocktail image
 */
export async function generateCocktailImage(prompt: string, sessionId: string): Promise<string> {
  try {
    console.log("Generating image with prompt:", prompt.substring(0, 50) + "...")

    const imageUrl = await generateImage(prompt, {
      negative_prompt: "low quality, blurry, out of focus, low resolution",
      image_size: "1024x1024",
    })

    console.log("Successfully generated image URL:", imageUrl.substring(0, 50) + "...")
    return imageUrl
  } catch (error) {
    console.error("Error generating cocktail image:", error)

    // Return a placeholder SVG instead of a potentially missing image file
    return `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent("cocktail")}`
  }
}

/**
 * Get the cocktail image for a session
 */
export function getCocktailImage(sessionId: string): string | null {
  if (typeof window === "undefined") return null

  const storedImage = localStorage.getItem(`moodshaker-image-${sessionId}`)

  // If no image is found, return null
  if (!storedImage) return null

  // Return the stored image (could be URL or base64)
  return storedImage
}
