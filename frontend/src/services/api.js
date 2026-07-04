import axios from 'axios';
import { handleCachedRequest, invalidateFrontendCachePattern } from './apiCache';

/**
 * Axios API Client
 * 
 * H-2: Removed the request interceptor that read JWT from localStorage.
 * Authentication is now handled exclusively via HttpOnly cookies sent
 * automatically by the browser (withCredentials: true).
 * 
 * H-3: Configured Axios CSRF support. Axios will automatically read the
 * XSRF-TOKEN cookie and send it as the X-XSRF-TOKEN header on
 * state-changing requests (POST/PUT/DELETE).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000, // 15s timeout prevents infinite hangs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth-related paths that must NEVER trigger automatic token refresh
const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// H-2: Request interceptor removed entirely.
// No more reading from localStorage or setting Authorization header.
// The browser sends HttpOnly cookies automatically via withCredentials: true.

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const config = response.config;
    const method = (config.method || '').toLowerCase();
    
    // Check if it is a successful write operation
    if (method === 'post' || method === 'put' || method === 'delete') {
      const url = config.url || '';

      if (url.includes('/products') || url.includes('/admin/products')) {
        invalidateFrontendCachePattern('/products');
        invalidateFrontendCachePattern('/home/all');
      }
      if (url.includes('/cart')) {
        invalidateFrontendCachePattern('/cart');
      }
      if (url.includes('/wishlist')) {
        invalidateFrontendCachePattern('/wishlist');
      }
      if (url.includes('/branding')) {
        invalidateFrontendCachePattern('/branding');
      }
      if (url.includes('/settings')) {
        invalidateFrontendCachePattern('/settings');
      }
      if (url.includes('/orders')) {
        invalidateFrontendCachePattern('/orders');
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // CRITICAL: Never attempt token refresh for auth endpoints — they must fail-fast
    // to the caller so the UI can show errors instead of hanging
    const isAuthRoute = originalRequest?.url &&
      AUTH_PATHS.some(path => originalRequest.url.includes(path));

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    // For non-auth routes: attempt silent token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        
        // H-2: Clear in-memory auth state via store instead of localStorage.
        // Cookies are cleared by the server on refresh failure.
        try {
          const { default: useAuthStore } = await import('../store/authStore');
          useAuthStore.setState({ 
            user: null, 
            isAuthenticated: false, 
            hasCheckedAuth: true 
          });
        } catch (storeError) {
          // Store import failed — still redirect to login
        }

        // Redirect to login only if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Cache-wrapped GET request handler for performance optimization
const originalGet = api.get;
api.get = function (url, config = {}) {
  // Check if X-Bypass-Cache header is present (from background SWR refresh)
  if (config.headers && config.headers['X-Bypass-Cache']) {
    const cleanHeaders = { ...config.headers };
    delete cleanHeaders['X-Bypass-Cache'];
    return originalGet.call(this, url, { ...config, headers: cleanHeaders });
  }

  // Route through the Frontend Page Cache / Request Deduplication / SWR layer
  return handleCachedRequest({ ...config, url, method: 'get' }, (cfg) => {
    return originalGet.call(this, cfg.url, {
      headers: cfg.headers,
      params: cfg.params,
      signal: cfg.signal
    });
  });
};

export default api;
