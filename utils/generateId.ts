/**
 * 统一的ID生成工具
 * 提供一致的ID生成逻辑
 */

import { randomBytes } from "node:crypto";

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
 * 生成编辑令牌
 * @returns 用于私有推荐结果编辑/读取的安全令牌
 */
export function generateEditToken(): string {
  return randomBytes(24).toString("hex");
}
