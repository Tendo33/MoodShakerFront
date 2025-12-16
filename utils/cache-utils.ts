// 缓存工具 - 性能优化

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
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

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

// API 缓存实例
export const apiCache = new SimpleCache<unknown>();

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
