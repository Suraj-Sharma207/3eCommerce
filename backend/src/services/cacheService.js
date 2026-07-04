import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

// Configurable defaults
const DEFAULT_TTL = 300; // 5 minutes

// In-Memory Cache Fallback Class with automatic TTL expiration
class MemoryCache {
  constructor() {
    this.store = new Map();
    // Cache statistics instrumentation
    this.hits = 0;
    this.misses = 0;
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value;
  }

  async set(key, value, ttlSeconds = DEFAULT_TTL) {
    this.store.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  async del(key) {
    this.store.delete(key);
  }

  async keys(pattern) {
    // Converts glob pattern (e.g. products:*) to Regex
    const regexStr = '^' + pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async clear() {
    this.store.clear();
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : '0.00'
    };
  }
}

const memoryCache = new MemoryCache();
let redisHits = 0;
let redisMisses = 0;

/**
 * Initializes the Redis client connection.
 * Gracefully falls back to MemoryCache on failure or if REDIS_URL is not set.
 */
export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[Cache] REDIS_URL not defined in environment. Using high-performance memory cache.');
    return;
  }

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error('[Cache] Redis reconnect failed 5 times. Falling back permanently to memory cache.');
            isRedisConnected = false;
            return false; // Stop reconnecting
          }
          return Math.min(retries * 500, 2000); // Backoff
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis connection error:', err.message);
      isRedisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('[Cache] Connected to Redis successfully. Caching enabled.');
      isRedisConnected = true;
    });

    await redisClient.connect();
  } catch (error) {
    console.error('[Cache] Redis connection failed during init, using memory cache fallback:', error.message);
    isRedisConnected = false;
    redisClient = null;
  }
};

/**
 * Get value from cache.
 */
export const cacheGet = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const val = await redisClient.get(key);
      if (val) {
        redisHits++;
        return JSON.parse(val);
      }
      redisMisses++;
      return null;
    } catch (err) {
      console.error('[Cache] Redis get failed, reading from memory fallback:', err.message);
      return memoryCache.get(key);
    }
  }
  return memoryCache.get(key);
};

/**
 * Set value in cache with TTL.
 */
export const cacheSet = async (key, value, ttlSeconds = DEFAULT_TTL) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
      console.error('[Cache] Redis set failed, writing to memory fallback:', err.message);
      await memoryCache.set(key, value, ttlSeconds);
    }
  } else {
    await memoryCache.set(key, value, ttlSeconds);
  }
};

/**
 * Delete single key from cache.
 */
export const cacheDel = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error('[Cache] Redis del failed, deleting from memory fallback:', err.message);
      await memoryCache.del(key);
    }
  } else {
    await memoryCache.del(key);
  }
};

/**
 * Invalidates cache keys matching a glob pattern (e.g. "products:*").
 * Phase 7: Uses SCAN instead of KEYS to avoid blocking the Redis event loop.
 */
export const cacheInvalidateByPattern = async (pattern) => {
  console.log(`[Cache] Invalidating pattern: ${pattern}`);
  
  // 1. Invalidate Redis keys using SCAN (non-blocking)
  if (isRedisConnected && redisClient) {
    try {
      let cursor = 0;
      let totalDeleted = 0;
      do {
        // SCAN returns { cursor, keys } in the node-redis v4+ client
        const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = result.cursor;
        const keys = result.keys;
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== 0);
      
      if (totalDeleted > 0) {
        console.log(`[Cache] Invalidated ${totalDeleted} keys in Redis`);
      }
    } catch (err) {
      console.error('[Cache] Redis pattern invalidation failed:', err.message);
    }
  }

  // 2. Invalidate Memory keys
  try {
    const memKeys = await memoryCache.keys(pattern);
    if (memKeys.length > 0) {
      for (const k of memKeys) {
        await memoryCache.del(k);
      }
      console.log(`[Cache] Invalidated ${memKeys.length} keys in Memory fallback`);
    }
  } catch (err) {
    console.error('[Cache] Memory pattern invalidation failed:', err.message);
  }
};

/**
 * Returns diagnostic caching statistics for admin metrics.
 */
export const cacheStats = () => {
  const memStats = memoryCache.getStats();
  return {
    redis: {
      connected: isRedisConnected,
      hits: redisHits,
      misses: redisMisses,
      hitRate: redisHits + redisMisses > 0 ? (redisHits / (redisHits + redisMisses)).toFixed(2) : '0.00'
    },
    memory: memStats
  };
};

/**
 * Closes the Redis client connection.
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      isRedisConnected = false;
      console.log('[Cache] Redis connection closed gracefully.');
    } catch (err) {
      console.error('[Cache] Error closing Redis client:', err.message);
    }
  }
};
