// 缓存工具 - 性能优化
// {{CHENGQI:
// Action: [Added]; Timestamp: [2025-08-23 14:51:20]; Reason: 性能优化 - 添加缓存机制减少重复请求; Principle_Applied: 缓存优先原则;
// }}

import { appLogger } from '@/utils/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  
  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const timestamp = Date.now();
    this.cache.set(key, {
      data,
      timestamp,
      expiry: timestamp + ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    // Clean expired items first
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  // 获取缓存统计
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++;
      } else {
        valid++;
      }
    }

    return { total: this.cache.size, valid, expired };
  }
}

// 全局缓存实例
export const cocktailCache = new SimpleCache<unknown>();
export const imageCache = new SimpleCache<string>();
export const apiCache = new SimpleCache<unknown>();

// 缓存装饰器函数
export const withCache = <T, Args extends unknown[]>(
  cache: SimpleCache<T>,
  keyGenerator: (...args: Args) => string,
  ttl?: number
) => {
  return (fn: (...args: Args) => Promise<T>) => {
    return async (...args: Args): Promise<T> => {
      const key = keyGenerator(...args);
      
      // 尝试从缓存获取
      const cached = cache.get(key);
      if (cached !== null) {
        appLogger.debug(`Cache hit for key: ${key}`);
        return cached;
      }

      // 缓存未命中，执行原函数
      appLogger.debug(`Cache miss for key: ${key}`);
      try {
        const result = await fn(...args);
        cache.set(key, result, ttl);
        return result;
      } catch (error) {
        appLogger.error(`Function execution failed for key: ${key}`, error);
        throw error;
      }
    };
  };
};

// 本地存储缓存 - 持久化
export class PersistentCache<T> {
  constructor(private prefix: string) {}

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  set(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    };

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      appLogger.warn('Failed to save to localStorage', error);
    }
  }

  get(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      
      if (Date.now() > item.expiry) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }

      return item.data;
    } catch (error) {
      appLogger.warn('Failed to read from localStorage', error);
      return null;
    }
  }

  delete(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix + ':')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// 预定义的持久化缓存实例
export const persistentImageCache = new PersistentCache<string>('moodshaker-img');
export const persistentDataCache = new PersistentCache<unknown>('moodshaker-data');

// 性能监控
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++;
  },
  
  recordMiss() {
    this.misses++;
  },
  
  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  },
  
  reset() {
    this.hits = 0;
    this.misses = 0;
  },
  
  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      total: this.hits + this.misses,
    };
  },
};
