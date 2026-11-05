/**
 * Centralized Cookie Configuration
 *
 * SECURITY: Cookie security flags are determined by the actual request
 * context (HTTPS detection), not just NODE_ENV. This correctly handles
 * reverse proxies (Nginx, Cloudflare, ALB) that terminate TLS.
 */

/**
 * Detects if the current request is over HTTPS.
 * Handles both direct HTTPS and reverse proxy scenarios.
 * @param {import('express').Request} req
 * @returns {boolean}
 */
export const isSecureRequest = (req) => {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
};

export const getAuthCookieNames = (req) => {
  if (isSecureRequest(req)) {
    return {
      access: "__Host-access",
      refresh: "__Host-refresh",
      csrf: "__Host-csrf",
    };
  }
  return {
    access: "accessToken",
    refresh: "refreshToken",
    csrf: "csrfToken",
  };
};

/**
 * Returns standardized cookie options for auth cookies.
 * @param {import('express').Request} req - Express request object
 * @param {number} maxAge - Cookie max age in milliseconds
 * @returns {object} Cookie options
 */
export const getAuthCookieOptions = (req, maxAge) => {
  const secure = isSecureRequest(req);
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? "None" : "Lax");
  return {
    httpOnly: true,
    secure: sameSite === "None" ? true : secure,
    sameSite,
    path: "/",
    maxAge,
  };
};

/**
 * Returns cookie options for the CSRF token cookie.
 * SECURITY: Now HttpOnly = true to prevent client-side script access.
 * @param {import('express').Request} req
 * @returns {object} Cookie options
 */
export const getCsrfCookieOptions = (req) => {
  const secure = isSecureRequest(req);
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? "None" : "Lax");
  return {
    httpOnly: true,
    secure: sameSite === "None" ? true : secure,
    sameSite,
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  };
};

/**
 * Returns cookie options for clearing cookies.
 * Must use the same path/sameSite as when the cookie was set.
 * @param {import('express').Request} req
 * @returns {object} Cookie clear options
 */
export const getClearCookieOptions = (req) => {
  const secure = isSecureRequest(req);
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? "None" : "Lax");
  return {
    httpOnly: true,
    secure: sameSite === "None" ? true : secure,
    sameSite,
    path: "/",
  };
};
