/**
 * Unified Logging Utility
 * Provides consistent logging format and handling logic across the application.
 */

type LogLevel = "INFO" | "ERROR" | "DEBUG" | "WARN";

interface LoggerOptions {
  module?: string;
  timestamp?: boolean;
  maxDataLength?: number;
}

/**
 * Creates a modular logger instance.
 * @param moduleName Name of the module to identify log source.
 * @param options Logging configuration options.
 */
export function createLogger(moduleName: string, options: LoggerOptions = {}) {
  const { timestamp = true, maxDataLength = 500 } = options;

  return {
    info: (message: string, data?: unknown) =>
      logDetail("INFO", message, data, moduleName, {
        timestamp,
        maxDataLength,
      }),
    error: (message: string, data?: unknown) =>
      logDetail("ERROR", message, data, moduleName, {
        timestamp,
        maxDataLength,
      }),
    debug: (message: string, data?: unknown) =>
      logDetail("DEBUG", message, data, moduleName, {
        timestamp,
        maxDataLength,
      }),
    warn: (message: string, data?: unknown) =>
      logDetail("WARN", message, data, moduleName, {
        timestamp,
        maxDataLength,
      }),
  };
}

/**
 * General purpose function to log details.
 * @param type Log severity level.
 * @param message The main log message.
 * @param data Additional data to log (will be stringified).
 * @param moduleName Module name for context.
 * @param options Formatting options.
 */
function logDetail(
  type: LogLevel,
  message: string,
  data?: unknown,
  moduleName = "App",
  options: { timestamp?: boolean; maxDataLength?: number } = {},
): void {
  const { timestamp = true, maxDataLength = 500 } = options;

  const timestampStr = timestamp ? new Date().toISOString() : "";
  const prefix = timestamp
    ? `[${type}][${moduleName}][${timestampStr}]`
    : `[${type}][${moduleName}]`;

  let logMessage = `${prefix} ${message}`;

  if (data !== undefined) {
    try {
      if (typeof data === "object" && data !== null) {
        const stringified = JSON.stringify(data);
        if (stringified) {
          logMessage += `\n${stringified.length > maxDataLength ? stringified.substring(0, maxDataLength) + "..." : stringified}`;
        } else {
          logMessage += "\n[Unserializable object]";
        }
      } else {
        logMessage += `\n${data}`;
      }
    } catch {
      logMessage += `\n[Object cannot be stringified]`;
    }
  }

  console[
    type === "ERROR"
      ? "error"
      : type === "DEBUG"
        ? "debug"
        : type === "WARN"
          ? "warn"
          : "log"
  ](logMessage);
}

// Pre-defined common loggers
export const cocktailLogger = createLogger("Cocktail API");
export const openaiLogger = createLogger("OpenAI API");
export const imageLogger = createLogger("Image API");
export const appLogger = createLogger("App");

/**
 * Safe Application State Logger
 * Logs basic app states and user interactions without including sensitive information.
 */
export const safeLogger = {
  // Application lifecycle
  appStart: () => appLogger.info("Application started"),
  appError: (component: string) =>
    appLogger.error(`Component error: ${component}`),

  // User interactions (safe level)
  userInteraction: (action: string) =>
    appLogger.debug(`User action: ${action}`),
  pageNavigation: (path: string) => appLogger.debug(`Page navigation: ${path}`),

  // System status
  cacheOperation: (operation: string) =>
    appLogger.debug(`Cache operation: ${operation}`),
  networkRequest: (status: string) =>
    appLogger.debug(`Network request: ${status}`),

  // Performance metrics (generic)
  performanceMetric: (metric: string, value: number) =>
    appLogger.debug(`Performance metric ${metric}: ${value}ms`),
};
