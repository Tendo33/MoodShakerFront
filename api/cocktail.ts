import { getChatCompletion, generateImage } from "./openai";

// 简化枚举
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

// 接口定义
export interface Ingredient {
	name: string;
	amount: string;
	unit?: string;
	substitute?: string;
}

export interface Tool {
	name: string;
	alternative?: string;
}

export interface Step {
	step_number: number;
	description: string;
	tips?: string;
}

export interface Cocktail {
	id?: string | number;
	name: string;
	english_name?: string;
	description: string;
	match_reason: string;
	base_spirit: string;
	alcohol_level: string;
	serving_glass: string;
	time_required?: string;
	flavor_profiles: string[];
	ingredients: Ingredient[];
	tools: Tool[];
	steps: Step[];
	image?: string;
}

export interface BartenderRequest {
	message: string;
	alcohol_level: AlcoholLevel;
	has_tools?: boolean | null;
	difficulty_level: DifficultyLevel;
	base_spirits: string[] | null;
	session_id?: string;
}

/**
 * 记录详细日志
 */
function logDetail(type: "INFO" | "ERROR" | "DEBUG", message: string, data?: any): void {
	const timestamp = new Date().toISOString();
	const prefix = `[${type}][Cocktail API][${timestamp}]`;

	let logMessage = `${prefix} ${message}`;

	if (data) {
		try {
			if (typeof data === "object") {
				const stringified = JSON.stringify(data);
				logMessage += `\n${stringified.length > 500 ? stringified.substring(0, 500) + "..." : stringified}`;
			} else {
				logMessage += `\n${data}`;
			}
		} catch (e) {
			logMessage += `\n[Object cannot be stringified]`;
		}
	}

	console[type === "ERROR" ? "error" : type === "DEBUG" ? "debug" : "log"](logMessage);
}

/**
 * 创建系统提示
 */
function createSystemPrompt(agentType: AgentType): string {
	// 使用简化的系统提示
	const classic_bartender_prompt = `你是一位专注于经典鸡尾酒的调酒师,需要根据用户的心情和偏好推荐合适的经典鸡尾酒。
分析用户需求，考虑酒精浓度、制作难度和可用基酒，推荐最合适的经典鸡尾酒。

# 重要提示
- 制作步骤必须非常详细，包括具体的操作方法、时间、温度等关键细节
- 每个步骤应该只包含一个明确的动作，不要将多个操作合并到一个步骤中
- 提供专业的调酒技巧和注意事项
- 对于每种原料的处理方式要具体说明
- 包括视觉、嗅觉和味觉的感官描述

# 返回格式
你必须严格按照以下 JSON 格式返回数据,不要返回任何其他内容:
{
    "name": "鸡尾酒名称",
    "english_name": "English Name",
    "description": "鸡尾酒详细描述，包括起源、特点和口感",
    "time_required": "所需时间",
    "match_reason": "详细的推荐理由，解释为什么这款鸡尾酒适合用户",
    "base_spirit": "基酒类型",
    "alcohol_level": "酒精浓度",
    "flavor_profiles": ["口味特征列表"],
    "ingredients": [
        {
            "name": "原料名称",
            "amount": "原料用量",
            "unit": "计量单位",
            "substitute": "替代品"
        }
    ],
    "steps": [
        {
            "step_number": "步骤序号",
            "description": "非常详细的步骤描述，包括具体操作方法、时间、温度等关键细节",
            "tips": "专业调酒技巧和注意事项"
        }
    ],
    "tools": [
        {
            "name": "工具名称",
            "alternative": "替代工具"
        }
    ],
    "serving_glass": "建议使用的酒杯"
}`;
	const creative_bartender_prompt = `你是一位创意调酒师,需要根据用户的心情和偏好创造独特的鸡尾酒配方。
分析用户需求，考虑酒精浓度、制作难度和可用基酒，创造一款独特的鸡尾酒。

# 重要提示
- 制作步骤必须非常详细，包括具体的操作方法、时间、温度等关键细节
- 每个步骤应该只包含一个明确的动作，不要将多个操作合并到一个步骤中
- 提供创新的调酒技巧和独特的调制方法
- 对于每种原料的处理方式要具体说明
- 包括视觉、嗅觉和味觉的感官描述
- 创造性地使用原料，但确保配方实际可行

# 返回格式
你必须严格按照以下 JSON 格式返回数据,不要返回任何其他内容:
{
    "name": "创意鸡尾酒名称",
    "english_name": "Creative English Name",
    "description": "鸡尾酒详细描述，包括灵感来源、特点和口感",
    "time_required": "所需时间",
    "match_reason": "详细的创作理由，解释这款鸡尾酒如何满足用户需求",
    "base_spirit": "基酒类型",
    "alcohol_level": "酒精浓度",
    "flavor_profiles": ["口味特征列表"],
    "ingredients": [
        {
            "name": "原料名称",
            "amount": "原料用量",
            "unit": "计量单位",
            "substitute": "替代品"
        }
    ],
    "steps": [
        {
            "step_number": "步骤序号",
            "description": "非常详细的步骤描述，包括具体操作方法、时间、温度等关键细节",
            "tips": "创新调酒技巧和特别注意事项"
        }
    ],
    "tools": [
        {
            "name": "工具名称",
            "alternative": "替代工具"
        }
    ],
    "serving_glass": "建议使用的酒杯"
}`;

	return agentType === AgentType.CLASSIC_BARTENDER ? classic_bartender_prompt : creative_bartender_prompt;
}

/**
 * 创建用户消息
 */
function createUserMessage(request: BartenderRequest): string {
	let message = `用户需求: ${request.message}\n`;

	// 添加其他条件
	const conditions = [];
	if (request.alcohol_level !== AlcoholLevel.ANY) {
		conditions.push(`酒精浓度: ${request.alcohol_level}`);
	}
	if (request.has_tools !== null && request.has_tools !== undefined) {
		conditions.push(`是否有调酒工具: ${request.has_tools ? "有" : "没有"}`);
	}
	if (request.difficulty_level !== DifficultyLevel.ANY) {
		conditions.push(`制作难度: ${request.difficulty_level}`);
	}
	if (request.base_spirits && request.base_spirits.length > 0) {
		conditions.push(`可用的基酒: ${request.base_spirits.join(", ")}`);
	}

	if (conditions.length > 0) {
		message += "其他条件:\n" + conditions.join("\n");
	}

	return message;
}

/**
 * 解析完成结果为鸡尾酒对象
 */
function parseCocktailFromCompletion(completion: string): Cocktail {
	try {
		logDetail("DEBUG", "解析模型返回的鸡尾酒数据", {
			completionLength: completion.length,
			completionPreview: completion.substring(0, 200) + "...",
		});

		const jsonMatch = completion.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			logDetail("ERROR", "无法从返回中提取JSON数据", {
				completionPreview: completion.substring(0, 300) + "...",
			});
			throw new Error("No JSON found in completion");
		}

		const jsonString = jsonMatch[0];
		logDetail("DEBUG", "提取的JSON字符串", {
			jsonLength: jsonString.length,
			jsonPreview: jsonString.substring(0, 200) + "...",
		});

		const cocktail = JSON.parse(jsonString) as Cocktail;

		// 记录解析结果
		logDetail("INFO", "成功解析鸡尾酒数据", {
			name: cocktail.name,
			english_name: cocktail.english_name,
			ingredientsCount: cocktail.ingredients?.length || 0,
			stepsCount: cocktail.steps?.length || 0,
			toolsCount: cocktail.tools?.length || 0,
		});

		// 确保所有必填字段都存在
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
		};
	} catch (error) {
		logDetail("ERROR", "解析鸡尾酒数据失败", {
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
					  }
					: String(error),
			completionPreview: completion.substring(0, 300) + "...",
		});

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
		};
	}
}

/**
 * 生成鸡尾酒推荐
 */
export async function requestCocktailRecommendation(
	request: BartenderRequest,
	agentType: AgentType = AgentType.CLASSIC_BARTENDER
): Promise<Cocktail> {
	const requestId = `cocktail_${Math.random().toString(36).substring(2, 15)}`;
	const startTime = Date.now();
	try {
		// 检查本地缓存
		const cacheKey = `${agentType}-${request.alcohol_level}-${request.difficulty_level}-${request.message.substring(
			0,
			20
		)}`;
		if (typeof window !== "undefined") {
			const cachedResult = localStorage.getItem(`moodshaker-cocktail-${cacheKey}`);
			if (cachedResult) {
				try {
					const parsed = JSON.parse(cachedResult);
					logDetail("INFO", `找到缓存的鸡尾酒推荐 [${requestId}]`, {
						cacheKey,
						cocktailName: parsed.name,
					});
					return parsed;
				} catch (e) {
					logDetail("DEBUG", `缓存解析失败 [${requestId}]`, {
						error: e instanceof Error ? e.message : String(e),
					});
				}
			}
		}

		const systemPrompt = createSystemPrompt(agentType);
		const userMessage = createUserMessage(request);

		logDetail("DEBUG", `准备发送请求 [${requestId}]`, {
			systemPromptLength: systemPrompt.length,
			userMessageLength: userMessage.length,
			systemPromptPreview: systemPrompt.substring(0, 100) + "...",
			userMessagePreview: userMessage.substring(0, 100) + "...",
		});

		const completion = await getChatCompletion(
			[
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userMessage },
			],
			{
				model: "deepseek-v3-250324",
				temperature: 0.7,
				max_tokens: 2000,
			}
		);

		logDetail("DEBUG", `收到模型响应 [${requestId}]`, {
			completionLength: completion.length,
			completionPreview: completion.substring(0, 100) + "...",
		});

		const cocktail = parseCocktailFromCompletion(completion);

		const endTime = Date.now();
		const duration = endTime - startTime;

		logDetail("INFO", `鸡尾酒推荐完成 [${requestId}] (${duration}ms)`, {
			cocktailName: cocktail.name,
			englishName: cocktail.english_name,
			baseSpirit: cocktail.base_spirit,
			ingredientsCount: cocktail.ingredients.length,
			stepsCount: cocktail.steps.length,
		});

		// 缓存结果
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(`moodshaker-cocktail-${cacheKey}`, JSON.stringify(cocktail));
				logDetail("DEBUG", `已缓存鸡尾酒推荐 [${requestId}]`, { cacheKey });
			} catch (e) {
				logDetail("DEBUG", `缓存鸡尾酒失败 [${requestId}]`, {
					error: e instanceof Error ? e.message : String(e),
				});
			}
		}

		return cocktail;
	} catch (error) {
		const endTime = Date.now();
		const duration = endTime - startTime;

		logDetail("ERROR", `鸡尾酒推荐失败 [${requestId}] (${duration}ms)`, {
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
					  }
					: String(error),
		});

		throw error;
	}
}
