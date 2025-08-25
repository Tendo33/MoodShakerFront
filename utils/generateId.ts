/**
 * 统一的ID生成工具
 * 提供一致的ID生成逻辑
 */

/**
 * 生成随机字符串ID
 * @param prefix ID前缀
 * @param length ID长度（不包括前缀），默认为13
 * @returns 格式化的ID字符串
 */
export function generateId(prefix?: string, length: number = 13): string {
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 2 + length);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}

/**
 * 生成请求ID
 * @param type 请求类型
 * @returns 请求ID
 */
export function generateRequestId(type: string = "req"): string {
  return generateId(type, 13);
}

/**
 * 生成会话ID
 * @returns 会话ID
 */
export function generateSessionId(): string {
  return generateId("session", 13);
}

/**
 * 生成鸡尾酒相关的ID
 * @returns 鸡尾酒ID
 */
export function generateCocktailId(): string {
  return generateId("cocktail", 13);
}

/**
 * 生成图片相关的ID
 * @returns 图片ID
 */
export function generateImageId(): string {
  return generateId("cocktail_img", 13);
}

/**
 * 生成UI组件ID
 * @param componentType 组件类型
 * @returns 组件ID
 */
export function generateComponentId(componentType: string): string {
  return generateId(componentType, 7);
}

// 预定义的常用ID生成器
export const idGenerators = {
  request: () => generateRequestId(),
  session: () => generateSessionId(),
  cocktail: () => generateCocktailId(),
  image: () => generateImageId(),
  input: () => generateComponentId("input"),
  password: () => generateComponentId("password"),
};
