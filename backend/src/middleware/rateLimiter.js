import rateLimit from 'express-rate-limit';

// Standard rate limit handler with lightweight logging
const handler = (req, res, next, options) => {
  console.warn(`[RATE LIMIT] ${options.statusCode} - IP: ${req.ip} | User: ${req.user?.id || 'unauth'} | Route: ${req.originalUrl}`);
  res.status(options.statusCode).send(options.message);
};

// Skip OPTIONS requests (browser preflight)
const skip = (req) => req.method === 'OPTIONS';

// 1. Global Limiter (Customer actions like Cart, Wishlist, Checkout)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});

// 2. Auth Limiter (Strict protection for login, register, reset password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});

// 3. Admin Limiter (High allowance for dashboard, CRUD operations)
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});

// 4. Read APIs (High limit for public GET routes like products, categories, homepage)
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});
