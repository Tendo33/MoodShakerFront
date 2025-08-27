/**
 * 本地存储工具函数
 * 提供类型安全的本地存储操作
 */

import { appLogger } from "@/utils/logger";

/**
 * 从localStorage获取数据并解析
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 解析后的数据或默认值
 */
export function getFromStorage<T>(key: string, defaultValue: T): T;
export function getFromStorage(key: string): any;
export function getFromStorage<T>(key: string, defaultValue?: T): T | any {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    return JSON.parse(item);
  } catch (error) {
    appLogger.error("localStorage read error");
    return defaultValue;
  }
}

/**
 * 将数据存储到localStorage
 * @param key 存储键名
 * @param value 要存储的数据
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    appLogger.error("localStorage save error");
  }
}

/**
 * 从localStorage删除数据
 * @param key 存储键名
 */
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch (error) {
    appLogger.error("localStorage remove error");
  }
}

/**
 * 清除所有以特定前缀开头的localStorage项
 * @param prefix 键名前缀
 */
export function clearStorageWithPrefix(prefix: string): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];

    // First collect all keys to remove
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    });

    // Then remove them
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    appLogger.info("localStorage items cleared");
  } catch (error) {
    appLogger.error(
      `Error clearing localStorage items with prefix ${prefix}`,
      error,
    );
  }
}
