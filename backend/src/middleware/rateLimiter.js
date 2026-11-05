/**
 * Rate Limiting Middleware
 *
 * Phase 6: Uses Redis-backed store when REDIS_URL is available,
 * with graceful fallback to in-memory MemoryStore.
 *
 * Separate limiters for different route categories with
 * appropriate rate limits for each.
 */
import rateLimit from "express-rate-limit";

/**
 * Creates a Redis store for rate limiting if Redis is available.
 * Falls back to the default MemoryStore otherwise.
 *
 * Note: rate-limit-redis is loaded dynamically to avoid a hard
 * dependency — if the package is not installed, MemoryStore is used.
 */
let RedisRateLimitStore = null;
let redisStoreClient = null;

async function getRedisStore(prefix) {
  // If Redis URL isn't configured, skip
  if (!process.env.REDIS_URL) return undefined;

  try {
    if (!RedisRateLimitStore) {
      const module = await import("rate-limit-redis");
      RedisRateLimitStore = module.default || module.RedisStore;
    }
    if (!redisStoreClient) {
      const { createClient } = await import("redis");
      redisStoreClient = createClient({ url: process.env.REDIS_URL });
      redisStoreClient.on("error", (err) => {
        console.error("[RateLimit] Redis store error:", err.message);
      });
      await redisStoreClient.connect();
      console.log("[RateLimit] Connected to Redis for rate limiting.");
    }
    return new RedisRateLimitStore({
      sendCommand: (...args) => redisStoreClient.sendCommand(args),
      prefix: `rl:${prefix}:`,
    });
  } catch (err) {
    console.warn(
      `[RateLimit] Redis store unavailable (${err.message}). Using in-memory fallback.`,
    );
    return undefined; // Falls back to MemoryStore
  }
}

// Standard rate limit handler with lightweight logging
// Phase 10: Logs only IP and route — no tokens, cookies, or auth headers
const handler = (req, res, next, options) => {
  console.warn(
    `[RATE LIMIT] ${options.statusCode} - IP: ${req.ip} | User: ${req.user?.id || "unauth"} | Route: ${req.originalUrl}`,
  );
  res.status(options.statusCode).send(options.message);
};

// Skip OPTIONS requests (browser preflight)
const skip = (req) => req.method === "OPTIONS";

/**
 * Creates a rate limiter with optional Redis backing.
 * The store is resolved asynchronously on first request.
 */
function createLimiter(config) {
  // L-3 FIX: Use a promise to deduplicate concurrent store resolution
  let storePromise = null;

  const limiter = rateLimit({
    ...config,
    // Store will be resolved on first use
    store: undefined,
    skip,
    handler,
  });

  // Wrap the limiter to lazily resolve the Redis store
  return async (req, res, next) => {
    if (!storePromise) {
      storePromise = getRedisStore(config._prefix || "default")
        .then((store) => {
          if (store) {
            // Recreate limiter with Redis store
            const redisLimiter = rateLimit({
              ...config,
              store,
              skip,
              handler,
            });
            Object.assign(limiter, redisLimiter);
          }
          return store;
        })
        .catch(() => null); // Silently fall back to MemoryStore
    }
    // Await the promise to ensure consistent store for all concurrent requests
    await storePromise;
    return limiter(req, res, next);
  };
}

// 1. Global Limiter (Customer actions like Cart, Wishlist, Checkout)
export const globalLimiter = createLimiter({
  _prefix: "global",
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// 2. Auth Limiter (Strict protection for login, register, reset password)
export const authLimiter = createLimiter({
  _prefix: "auth",
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// 3. Admin Limiter (High allowance for dashboard, CRUD operations)
export const adminLimiter = createLimiter({
  _prefix: "admin",
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// 4. Read APIs (High limit for public GET routes like products, categories, homepage)
export const readLimiter = createLimiter({
  _prefix: "read",
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// 5. Upload Limiter (Strict limit for file upload endpoints)
export const uploadLimiter = createLimiter({
  _prefix: "upload",
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
