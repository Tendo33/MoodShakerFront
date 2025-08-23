/**
 * 统一的日志工具
 * 提供一致的日志格式和处理逻辑
 */

export type LogLevel = "INFO" | "ERROR" | "DEBUG" | "WARN";

interface LoggerOptions {
  module?: string;
  timestamp?: boolean;
  maxDataLength?: number;
}

/**
 * 创建模块化的日志记录器
 * @param moduleName 模块名称，用于标识日志来源
 * @param options 日志选项
 */
export function createLogger(moduleName: string, options: LoggerOptions = {}) {
  const {
    timestamp = true,
    maxDataLength = 500,
  } = options;

  return {
    info: (message: string, data?: any) => logDetail("INFO", message, data, moduleName, { timestamp, maxDataLength }),
    error: (message: string, data?: any) => logDetail("ERROR", message, data, moduleName, { timestamp, maxDataLength }),
    debug: (message: string, data?: any) => logDetail("DEBUG", message, data, moduleName, { timestamp, maxDataLength }),
    warn: (message: string, data?: any) => logDetail("WARN", message, data, moduleName, { timestamp, maxDataLength }),
  };
}

/**
 * 通用日志详情记录函数
 * @param type 日志级别
 * @param message 日志消息
 * @param data 附加数据
 * @param moduleName 模块名称
 * @param options 日志选项
 */
export function logDetail(
  type: LogLevel,
  message: string,
  data?: any,
  moduleName = "App",
  options: { timestamp?: boolean; maxDataLength?: number } = {}
): void {
  const { timestamp = true, maxDataLength = 500 } = options;
  
  const timestampStr = timestamp ? new Date().toISOString() : "";
  const prefix = timestamp 
    ? `[${type}][${moduleName}][${timestampStr}]`
    : `[${type}][${moduleName}]`;
  
  let logMessage = `${prefix} ${message}`;

  if (data) {
    try {
      if (typeof data === "object") {
        const stringified = JSON.stringify(data);
        logMessage += `\n${stringified.length > maxDataLength ? stringified.substring(0, maxDataLength) + "..." : stringified}`;
      } else {
        logMessage += `\n${data}`;
      }
    } catch (e) {
      logMessage += `\n[Object cannot be stringified]`;
    }
  }

  console[type === "ERROR" ? "error" : type === "DEBUG" ? "debug" : type === "WARN" ? "warn" : "log"](
    logMessage,
  );
}

// 预定义的常用日志记录器
export const cocktailLogger = createLogger("Cocktail API");
export const openaiLogger = createLogger("OpenAI API");
export const imageLogger = createLogger("Image API");
export const appLogger = createLogger("App");
