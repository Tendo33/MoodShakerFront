// 缓存工具 - 性能优化

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SimpleCache<T> {
  private readonly maxEntries: number;
  private cache = new Map<string, CacheItem<T>>();

  constructor(maxEntries: number = 200) {
    this.maxEntries = maxEntries;
  }

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const timestamp = Date.now();
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      data,
      timestamp,
      expiry: timestamp + ttl,
    });

    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.cache.delete(oldestKey);
    }
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

    // LRU: refresh recency
    this.cache.delete(key);
    this.cache.set(key, item);

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
export const apiCache = new SimpleCache<unknown>(200);

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
