/**
 * 异步存储管理器 - 性能优化核心模块
 * 解决localStorage同步阻塞问题，提供批量操作和缓存机制
 *
 * 就像把"排队买票"升级为"网上订票"，让存储操作不再阻塞用户界面
 */

import { appLogger } from "@/utils/logger";

// 操作类型定义
interface StorageOperation {
  id: string;
  type: "get" | "set" | "remove" | "clear";
  key?: string;
  value?: unknown;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

// 缓存项结构
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

/**
 * 异步存储管理器类
 * 提供高性能的localStorage操作，避免阻塞主线程
 */
export class AsyncStorageManager {
  private operationQueue: StorageOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private cache = new Map<string, CacheItem<unknown>>();
  private readonly BATCH_DELAY = 4; // 减少到4ms，更快的响应
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private isProcessing = false;
  private maxBatchSize = 10; // 最大批处理大小

  constructor() {
    // 在浏览器环境中初始化
    if (typeof window !== "undefined") {
      this.initializeCache();
    }
  }

  /**
   * 初始化缓存，预加载常用数据
   */
  private initializeCache(): void {
    try {
      // 预加载常用的keys到缓存中
      const commonKeys = [
        "moodshaker-answers",
        "moodshaker-feedback",
        "moodshaker-base-spirits",
        "moodshaker-recommendation",
        "moodshaker-language",
      ];

      commonKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) {
          try {
            const parsed = JSON.parse(value);
            this.cache.set(key, {
              data: parsed,
              timestamp: Date.now(),
              expiry: Date.now() + this.CACHE_TTL,
            });
          } catch {
            // 如果不是JSON，直接存储字符串
            this.cache.set(key, {
              data: value,
              timestamp: Date.now(),
              expiry: Date.now() + this.CACHE_TTL,
            });
          }
        }
      });

      appLogger.info("AsyncStorageManager cache initialization completed");
    } catch {
      appLogger.error("Cache initialization failed");
    }
  }

  /**
   * 异步获取数据 - 主要优化方法
   * @param key 存储键名
   * @param defaultValue 默认值
   * @returns Promise<数据>
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    // 1. 先检查内存缓存
    const cached = this.getCachedItem<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 2. 如果缓存未命中，添加到异步队列
    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `get_${key}_${Date.now()}`,
        type: "get",
        key,
        resolve: (value) => {
          // 获取成功后更新缓存
          if (value !== null) {
            this.updateCache(key, value);
          }
          const resolvedValue =
            value !== null ? (value as T) : ((defaultValue ?? null) as T | null);
          resolve(resolvedValue);
        },
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * 异步设置数据
   * @param key 存储键名
   * @param value 要存储的数据
   * @returns Promise<void>
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    // 立即更新缓存，提供即时反馈
    this.updateCache(key, value);

    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `set_${key}_${Date.now()}`,
        type: "set",
        key,
        value,
        resolve: () => resolve(),
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * 异步删除数据
   * @param key 存储键名
   * @returns Promise<void>
   */
  async removeItem(key: string): Promise<void> {
    // 立即从缓存删除
    this.cache.delete(key);

    return new Promise((resolve, reject) => {
      const operation: StorageOperation = {
        id: `remove_${key}_${Date.now()}`,
        type: "remove",
        key,
        resolve: () => resolve(),
        reject,
      };

      this.addToQueue(operation);
    });
  }

  /**
   * 批量操作 - 性能优化重点
   * @param operations 操作列表
   * @returns Promise<结果数组>
   */
  async batchOperations(
    operations: Array<{
      type: "get" | "set" | "remove";
      key: string;
      value?: unknown;
      defaultValue?: unknown;
    }>,
  ): Promise<unknown[]> {
    const promises = operations.map((op) => {
      switch (op.type) {
        case "get":
          return this.getItem(op.key, op.defaultValue);
        case "set":
          return this.setItem(op.key, op.value);
        case "remove":
          return this.removeItem(op.key);
        default:
          return Promise.resolve(null);
      }
    });

    return Promise.all(promises);
  }

  /**
   * 从缓存获取数据
   */
  private getCachedItem<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    if (cached.expiry && Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 更新缓存
   */
  private updateCache<T>(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * 添加操作到队列
   */
  private addToQueue(operation: StorageOperation): void {
    this.operationQueue.push(operation);

    // 队列满了就尽快处理。
    //
    // 如果上一批仍在处理，这次 processBatch() 会因 isProcessing 直接返回；
    // 此时必须留下一个已安排的 timeout 作为兜底，否则这批操作无人调度。
    // processBatch 的 finally 也会补一次调度，两者是互相独立的保险。
    if (this.operationQueue.length >= this.maxBatchSize) {
      this.scheduleBatch();
      this.processBatch();
      return;
    }

    // 使用批量处理优化性能
    this.scheduleBatch();
  }

  /**
   * 处理批量操作 - 核心性能优化
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const operations = [...this.operationQueue];
    this.operationQueue = [];

    try {
      // 把实际执行推迟到浏览器空闲，避免在渲染帧里做同步 localStorage 写入。
      //
      // executeOperations 自己 settle 每个 operation 并内部捕获异常，但这里仍然
      // 包一层 try/catch：如果它意外抛出，抛出点在回调内部，await 等不到 resolve，
      // 于是 isProcessing 永远为 true，整个队列从此彻底卡死。
      const runOperations = () => {
        try {
          this.executeOperations(operations);
        } catch (error) {
          operations.forEach((op) =>
            op.reject(
              error instanceof Error ? error : new Error("批量操作失败"),
            ),
          );
        }
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        await new Promise<void>((resolve) => {
          window.requestIdleCallback(() => {
            runOperations();
            resolve();
          });
        });
      } else {
        // 降级到setTimeout
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            runOperations();
            resolve();
          }, 0);
        });
      }
    } catch {
      appLogger.error("Batch operation processing failed");
      // 执行失败时通知所有待处理的操作
      operations.forEach((op) => {
        op.reject(new Error("批量操作失败"));
      });
    } finally {
      this.isProcessing = false;

      // 处理这一批期间新入队的操作。
      //
      // 没有这一步会永久丢失操作：addToQueue 在队列满时会 clearTimeout 再调
      // processBatch()，而此刻如果上一批仍在处理，那次调用会因 isProcessing
      // 直接返回 —— 队列里有 10 个操作，batchTimeout 已是 null，再没有任何东西
      // 会调度它们，对应的 promise 永远不 resolve。
      //
      // 实测：连续 20 次 setItem 只有 10 个落盘，另外 10 个的 await 永久悬挂。
      // 页面上的表现是"保存"永远转圈，而不是报错。
      if (this.operationQueue.length > 0) {
        this.scheduleBatch();
      }
    }
  }

  /**
   * 安排一次批处理，覆盖此前尚未触发的那次。
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.batchTimeout = null;
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * 执行实际的localStorage操作
   */
  private executeOperations(operations: StorageOperation[]): void {
    operations.forEach((operation) => {
      try {
        switch (operation.type) {
          case "get": {
            const value = localStorage.getItem(operation.key!);
            if (value === null) {
              operation.resolve(null);
              break;
            }

            // 读取失败降级为 null，让 getItem 的 defaultValue 生效；写入失败才 reject。
            //
            // localStorage 是同源共享的：旧版本的应用、页面上的其他脚本、写到一半
            // 被打断的值，都会留下解析不了的内容。这是预期噪声，不是异常。
            // 之前这里让 JSON.parse 直接抛出，于是 useAsyncState 落进 catch 分支
            // 显示错误态，CocktailResultContext 的 `|| ""` 兜底也被跳过 —— 一个坏
            // 键就能让整块持久化状态变成报错，而它本该退回默认值。
            //
            // 坏值有意保留而不删除：读路径里做写入是另一类副作用，而且保留它便于
            // 排查。代价是这个键每次读都会再解析失败一次。
            try {
              operation.resolve(JSON.parse(value));
            } catch {
              appLogger.warn("Discarding unparseable localStorage value", {
                key: operation.key,
              });
              operation.resolve(null);
            }
            break;
          }

          case "set":
            localStorage.setItem(
              operation.key!,
              JSON.stringify(operation.value),
            );
            operation.resolve(undefined);
            break;

          case "remove":
            localStorage.removeItem(operation.key!);
            operation.resolve(undefined);
            break;

          default:
            operation.reject(new Error(`不支持的操作类型: ${operation.type}`));
        }
      } catch (error) {
        appLogger.error("localStorage operation failed");
        operation.reject(
          error instanceof Error
            ? error
            : new Error("Unknown localStorage operation error"),
        );
      }
    });
  }

}

// 全局单例实例
export const asyncStorage = new AsyncStorageManager();

export const removeStorageKeysAsync = async (keys: string[]): Promise<void> => {
  await Promise.all(keys.map((key) => asyncStorage.removeItem(key)));
};
