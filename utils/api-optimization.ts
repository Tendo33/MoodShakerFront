/**
 * API请求优化工具 - 请求去重和缓存
 * 解决重复请求问题，提升API调用效率
 */

import { apiCache, cacheMetrics } from "@/utils/cache-utils";
import { appLogger } from "@/utils/logger";

interface PendingRequest {
  promise: Promise<CachedResponseData>;
  timestamp: number;
}

interface CachedResponseData {
  status: number;
  statusText: string;
  headers: Array<[string, string]>;
  body: string;
}

// 正在进行的请求映射
const pendingRequests = new Map<string, PendingRequest>();

// 请求配置
interface RequestConfig {
  cacheKey?: string;
  cacheTTL?: number;
  deduplicate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * 生成请求缓存键
 */
function generateCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || "GET";
  const body = options?.body ? JSON.stringify(options.body) : "";
  return `${method}:${url}:${body}`;
}

/**
 * 带缓存和去重的fetch封装
 */
export async function optimizedFetch(
  url: string,
  options: RequestInit = {},
  config: RequestConfig = {},
): Promise<Response> {
  const {
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5分钟缓存
    deduplicate = true,
    retryCount = 2,
    retryDelay = 1000,
  } = config;

  const key = cacheKey || generateCacheKey(url, options);

  // 1. 检查缓存
  const cachedResponse = apiCache.get(key) as CachedResponseData | null;
  if (cachedResponse) {
    cacheMetrics.recordHit();
    appLogger.debug("Request cache hit");
    return buildResponseFromCache(cachedResponse);
  }

  cacheMetrics.recordMiss();

  // 2. 检查重复请求
  if (deduplicate) {
    const existingRequest = pendingRequests.get(key);
    if (existingRequest) {
      appLogger.debug("Request deduplication");
      const cachedData = await existingRequest.promise;
      return buildResponseFromCache(cachedData);
    }
  }

  // 3. 创建新请求（并序列化，避免缓存不可复用的 Response 实例）
  const requestPromise = createRequestWithRetry(
    url,
    options,
    retryCount,
    retryDelay,
  ).then(serializeResponse);

  if (deduplicate) {
    pendingRequests.set(key, {
      promise: requestPromise,
      timestamp: Date.now(),
    });
  }

  try {
    const responseData = await requestPromise;
    const response = buildResponseFromCache(responseData);

    // 4. 缓存成功响应
    if (response.ok) {
      apiCache.set(key, responseData, cacheTTL);
    }

    return response;
  } finally {
    // 5. 清理pending请求
    if (deduplicate) {
      pendingRequests.delete(key);
    }
  }
}

async function serializeResponse(response: Response): Promise<CachedResponseData> {
  const body = await response.text();
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Array.from(response.headers.entries()),
    body,
  };
}

function buildResponseFromCache(data: CachedResponseData): Response {
  return new Response(data.body, {
    status: data.status,
    statusText: data.statusText,
    headers: data.headers,
  });
}

/**
 * 带重试机制的请求创建
 */
async function createRequestWithRetry(
  url: string,
  options: RequestInit,
  retryCount: number,
  retryDelay: number,
): Promise<Response> {
  let lastError: Error;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Request failed");

      if (attempt < retryCount) {
        const delay = retryDelay * Math.pow(2, attempt); // 指数退避
        appLogger.warn(
          `Request failed (attempt ${attempt + 1}), retrying in ${delay}ms:`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * 清理过期的pending请求
 */
function cleanupExpiredPendingRequests(): void {
  const now = Date.now();
  const maxAge = 30 * 1000; // 30秒

  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > maxAge) {
      pendingRequests.delete(key);
      appLogger.debug("Cleaned expired pending request");
    }
  }
}

// 定期清理过期请求
if (typeof window !== "undefined") {
  setInterval(cleanupExpiredPendingRequests, 60 * 1000); // 每分钟清理一次
}

// 导出工具函数
export function createCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}:${args
    .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : String(arg)))
    .join(":")}`;
}
