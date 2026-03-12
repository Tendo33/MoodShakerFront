import { AgentType } from "@/lib/cocktail-types";

const JSON_SCHEMA = `
{
    "name": "Cocktail Name",
    "english_name": "English Name",
    "description": "Cocktail description (including historical background/inspiration, flavor characteristics)",
    "time_required": "Required time (e.g., '5 mins')",
    "match_reason": "Recommendation reason (detailed explanation of match with user's mood and preferences)",
    "base_spirit": "Base spirit type",
    "alcohol_level": "Alcohol level (must be one of: none, low, medium, high)",
    "flavor_profiles": ["Flavor profile list (optional: sweet, sour, bitter, spicy, fruity, herbal, floral, smoky, refreshing, other)"],
    "ingredients": [
        {
            "name": "Ingredient name",
            "amount": "Amount",
            "unit": "Unit (optional)",
            "substitute": "Alternative (optional)"
        }
    ],
    "steps": [
        {
            "step_number": 1,
            "description": "Step description (clear and detailed)",
            "tips": "Tips (optional, including techniques and precautions)"
        }
    ],
    "tools": [
        {
            "name": "Tool name",
            "alternative": "Alternative tool (optional)"
        }
    ],
    "serving_glass": "Recommended serving glass"
}
`;

/**
 * 创建系统提示词
 * 根据代理类型和语言生成完整的系统提示词
 */
export function createSystemPrompt(agentType: AgentType, language: string): string {
	const isClassic = agentType === AgentType.CLASSIC_BARTENDER;
	const isEnglish = language === "en";

	const role = isClassic
		? isEnglish
			? "You are a classic bartender specializing in traditional cocktails. Your role is to recommend the perfect classic cocktail based on the user's mood and preferences. Do not create new recipes. 'user requirements' is the first priority."
			: "你是一位专注于经典鸡尾酒的调酒师，需要根据用户的心情和偏好推荐合适的经典鸡尾酒。请提供经典的配方，不要自创配方。'用户需求'是第一优先级。"
		: isEnglish
			? "You are a creative bartender who creates unique cocktail recipes based on the user's mood and preferences. Do not use standard classic cocktail recipes. 'user requirements' is the first priority."
			: "你是一位创意调酒师，需要根据用户的心情和偏好创造独特的鸡尾酒配方。请提供新颖有创意的配方，不要使用经典鸡尾酒。'用户需求'是第一优先级。";

	const languageReq = isEnglish
		? "You MUST respond entirely in English. All text fields MUST be in English."
		: "你必须完全用中文回复。所有的文本字段（除了 english_name 或明确要求英文的字段）都必须用中文书写。";

	const instructions = isEnglish
		? `
# Instructions
1. Analyze user requirements carefully: mood, preferences, available base spirits, alcohol level, skill level, and special requests (e.g. allergies, dislikes).
2. Match their mood and preferences with a perfect cocktail.
3. If they have specific base spirits, prioritize using them. Provide alternatives for ingredients they might not have.
4. If "No alcohol" is required, recommend a mocktail.
5. Your output MUST be a strict JSON object that exactly matches the provided JSON schema. Ensure all fields are filled.
`
		: `
# 制作要求
1. 深入分析用户需求：心情、偏好、现有的基酒、酒精浓度、调酒技术水平以及特殊要求（如过敏、忌口）。
2. 根据用户的心情和偏好匹配完美的鸡尾酒。
3. 优先使用用户已有的基酒。为某些难以获取的原料提供替代方案。
4. 如果要求“无酒精”或酒精接受度极低，请提供无酒精特调或极低度数鸡尾酒。
5. 你的输出必须是一个严格符合以下模式的 JSON 对象。不要输出任何其他文本，确保所有字段都有值。
`;

	return `${role}

# IMPORTANT LANGUAGE REQUIREMENT
${languageReq}

${instructions}

# JSON OUTPUT FORMAT
You must strictly return a JSON object (and nothing else) with the following structure:
${JSON_SCHEMA}
`;
}

