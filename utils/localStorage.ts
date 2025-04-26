/**
 * 本地存储工具函数
 * 提供类型安全的本地存储操作
 */

/**
 * 从localStorage获取数据并解析
 * @param key 存储键名
 * @param defaultValue 默认值
 * @returns 解析后的数据或默认值
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue

    return JSON.parse(item) as T
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * 将数据存储到localStorage
 * @param key 存储键名
 * @param value 要存储的数据
 */
export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
  }
}

/**
 * 从localStorage删除数据
 * @param key 存储键名
 */
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error)
  }
}

/**
 * 清除所有以特定前缀开头的localStorage项
 * @param prefix 键名前缀
 */
export function clearStorageWithPrefix(prefix: string): void {
  if (typeof window === "undefined") return

  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => localStorage.removeItem(key))
  } catch (error) {
    console.error(`Error clearing localStorage items with prefix ${prefix}:`, error)
  }
}
