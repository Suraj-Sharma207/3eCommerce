/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 * 
 * Implements an enterprise approach using SameSite=Strict session cookies
 * coupled with strict Origin and Referer validation:
 * 
 * 1. SameSite=Strict: Browsers automatically prevent auth cookies from being
 *    sent on cross-site requests (e.g. cross-site links, forms, or fetch).
 * 2. Origin/Referer Validation: The server validates that the Origin/Referer header
 *    matches the configured FRONTEND_URL whitelist. This prevents CSRF attacks
 *    on older browsers or via subdomain takeover/same-site bypasses.
 */

// Safe methods (read-only) — no CSRF check needed
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF validation middleware.
 * Validates that request Origin/Referer matches authorized origins.
 */
export const csrfProtection = (req, res, next) => {
  // Skip safe methods — GET/HEAD/OPTIONS cannot change server state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Extract Origin or Referer
  const origin = req.headers.origin || req.headers.referer;
  
  if (!origin) {
    return res.status(403).json({
      success: false,
      message: 'CSRF Protection: Missing Origin or Referer header.',
    });
  }

  // Retrieve allowed frontend origins
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim().toLowerCase())
    : ['http://localhost:5173'];

  // Parse origin/referer
  let originUrl;
  try {
    originUrl = new URL(origin).origin.toLowerCase();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'CSRF Protection: Invalid Origin or Referer header format.',
    });
  }

  // Match against allowed origins
  const isMatch = allowedOrigins.some(allowed => {
    try {
      return new URL(allowed).origin.toLowerCase() === originUrl;
    } catch (_) {
      return allowed.toLowerCase() === originUrl;
    }
  });

  if (!isMatch) {
    console.warn(`[CSRF Warning] Blocked request from unauthorized origin: ${originUrl}`);
    return res.status(403).json({
      success: false,
      message: 'CSRF Protection: Forbidden origin.',
    });
  }

  next();
};

/**
 * Sets CSRF cookie (no-op).
 * Maintained for backward compatibility but is a no-op under the
 * SameSite=Strict + Origin/Referer validation architecture.
 */
export const setCsrfCookie = (req, res) => {
  // No-op
};
