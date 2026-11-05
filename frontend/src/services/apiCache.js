/**
 * Enterprise API Page Cache & Request Deduplication
 *
 * Provides:
 * 1. Request Deduplication: Merges multiple concurrent identical requests into one Promise.
 * 2. Frontend Cache: Caches GET requests with configurable TTL.
 * 3. Stale-While-Revalidate (SWR): Returns cached data instantly and refreshes in the background
 *    ONLY when the entry exceeds the staleness threshold — not on every cache hit.
 *    Updates state silently via registered store updaters to prevent UI flickering.
 * 4. Performance Diagnostics: Dev-only metrics for cache hit/miss ratio, request timing, and
 *    duplicate request prevention stats.
 */

// Memory Cache Storage
const cacheStore = new Map();
// Active Promises for request deduplication
const inFlightRequests = new Map();
// Store updaters registry to handle background SWR updates without circular imports
const storeUpdaters = [];

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const REVALIDATE_AFTER = 60 * 1000; // Only revalidate if >60s since last validation

// ── Performance Diagnostics (dev-only) ───────────────────────────────────────
const IS_DEV =
  typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

const diagnostics = {
  cacheHits: 0,
  cacheMisses: 0,
  duplicatesPrevented: 0,
  revalidationsTriggered: 0,
  revalidationsSkipped: 0,
  requestTimings: [], // { url, duration, source: 'cache'|'network'|'dedup' }
};

/**
 * Get current cache diagnostics (dev-only).
 */
export const getCacheDiagnostics = () => {
  const total = diagnostics.cacheHits + diagnostics.cacheMisses;
  return {
    ...diagnostics,
    hitRate:
      total > 0
        ? ((diagnostics.cacheHits / total) * 100).toFixed(1) + "%"
        : "0%",
    missRate:
      total > 0
        ? ((diagnostics.cacheMisses / total) * 100).toFixed(1) + "%"
        : "0%",
    cacheSize: cacheStore.size,
    inFlightCount: inFlightRequests.size,
    recentTimings: diagnostics.requestTimings.slice(-20),
  };
};

/**
 * Reset diagnostics counters.
 */
export const resetDiagnostics = () => {
  diagnostics.cacheHits = 0;
  diagnostics.cacheMisses = 0;
  diagnostics.duplicatesPrevented = 0;
  diagnostics.revalidationsTriggered = 0;
  diagnostics.revalidationsSkipped = 0;
  diagnostics.requestTimings = [];
};

const trackTiming = (url, duration, source) => {
  if (!IS_DEV) return;
  diagnostics.requestTimings.push({
    url,
    duration: Math.round(duration),
    source,
    timestamp: Date.now(),
  });
  // Keep only last 50 entries
  if (diagnostics.requestTimings.length > 50) {
    diagnostics.requestTimings = diagnostics.requestTimings.slice(-50);
  }
};

/**
 * Register a Zustand store updater for a specific URL pattern.
 * Avoids circular dependencies.
 *
 * @param {RegExp} pattern - Regex to match request URL (e.g. /^\/cart/)
 * @param {Function} updaterFn - Callback function receiving response data
 */
export const registerStoreUpdater = (pattern, updaterFn) => {
  storeUpdaters.push({ pattern, updaterFn });
};

/**
 * Generate a unique cache/deduplication key for a request.
 */
const getRequestKey = (config) => {
  const url = config.url || "";
  const method = (config.method || "get").toLowerCase();
  const params = config.params ? JSON.stringify(config.params) : "";
  const data = config.data ? JSON.stringify(config.data) : "";
  return `${method}:${url}:${params}:${data}`;
};

/**
 * Check if the request is cacheable.
 * We only cache GET requests that are not auth or checkout paths.
 */
const isCacheable = (config) => {
  if ((config.method || "get").toLowerCase() !== "get") return false;

  const url = config.url || "";
  const bypassPaths = [
    "/auth/me",
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/orders/checkout",
    "/payment",
  ];

  return !bypassPaths.some((path) => url.includes(path));
};

/**
 * Registry of dynamic state updaters to map API responses back to Zustand stores.
 * Uses dynamic imports to avoid circular dependencies.
 */
const updateStoreState = async (url, data) => {
  try {
    if (url.includes("/cart")) {
      const { default: useCartStore } = await import("../store/cartStore");
      if (useCartStore) useCartStore.setState({ cart: data.data || data });
    } else if (url.includes("/wishlist")) {
      const { default: useWishlistStore } =
        await import("../store/wishlistStore");
      if (useWishlistStore)
        useWishlistStore.setState({ wishlist: data.data || data });
    } else if (url.includes("/branding")) {
      const { useBrandingStore } = await import("../store/brandingStore");
      if (useBrandingStore)
        useBrandingStore.setState({ branding: data.data || data });
    } else if (url.includes("/settings/public")) {
      const { default: useSettingsStore } =
        await import("../store/settingsStore");
      if (useSettingsStore)
        useSettingsStore.setState({ publicConfig: data.data || data || {} });
    } else if (url.includes("/settings/")) {
      const { default: useSettingsStore } =
        await import("../store/settingsStore");
      if (useSettingsStore) {
        const domain = url.split("/").pop().split("?")[0];
        useSettingsStore.setState((state) => ({
          domains: {
            ...state.domains,
            [domain]: {
              data: data.data || data || {},
              isLoading: false,
              isSaving: false,
            },
          },
        }));
      }
    } else if (url.includes("/admin/products") || url.includes("/products")) {
      if (url.includes("/products/categories")) {
        const { default: useCategoryStore } =
          await import("../store/categoryStore");
        if (useCategoryStore)
          useCategoryStore.setState({ categories: data.data || data || [] });
      } else if (url.includes("/products/recommended")) {
        const { default: useProductStore } =
          await import("../store/productStore");
        if (useProductStore)
          useProductStore.setState({
            recommendedProducts: data.data?.products || data.products || [],
          });
      } else {
        const payload = data.data || data;
        if (payload && Array.isArray(payload.products)) {
          const { default: useProductStore } =
            await import("../store/productStore");
          if (useProductStore) {
            const currentPagination = useProductStore.getState().pagination;
            if (
              !currentPagination ||
              (payload.pagination &&
                payload.pagination.currentPage ===
                  currentPagination.currentPage &&
                payload.pagination.itemsPerPage ===
                  currentPagination.itemsPerPage)
            ) {
              useProductStore.setState({
                products: payload.products,
                pagination: payload.pagination || currentPagination,
                inventoryCounts:
                  payload.pagination?.inventoryCounts ||
                  useProductStore.getState().inventoryCounts,
              });
            }
          }
        }
      }
    } else if (url.includes("/admin/dashboard")) {
      const { default: useAdminStore } = await import("../store/adminStore");
      if (useAdminStore) {
        if (url.includes("/inventory-alerts")) {
          useAdminStore.setState({ inventoryAlerts: data.data || data });
        } else if (
          url.includes("/revenue") ||
          url.includes("/orders") ||
          url.includes("/customers") ||
          url.includes("/products") ||
          url.includes("/deliveries") ||
          url.includes("/cancellations")
        ) {
          const type = url.split("/").pop().split("?")[0];
          useAdminStore.setState((state) => ({
            detailedAnalytics: {
              ...state.detailedAnalytics,
              [type]: data.data || data,
            },
            detailedLoading: { ...state.detailedLoading, [type]: false },
          }));
        } else {
          useAdminStore.setState({ analytics: data.data || data });
        }
      }
    } else if (url.includes("/admin/orders")) {
      const { default: useAdminStore } = await import("../store/adminStore");
      const payload = data.data || data;
      if (useAdminStore && payload) {
        const currentPagination = useAdminStore.getState().ordersPagination;
        if (
          !currentPagination ||
          (payload.pagination &&
            payload.pagination.currentPage === currentPagination.currentPage &&
            payload.pagination.itemsPerPage === currentPagination.itemsPerPage)
        ) {
          useAdminStore.setState({
            orders: payload.orders || [],
            ordersPagination: payload.pagination || currentPagination,
          });
        }
      }
    } else if (url.includes("/orders")) {
      const { default: useOrderStore } = await import("../store/orderStore");
      if (useOrderStore)
        useOrderStore.setState({ orders: data.data || data || [] });
    } else if (url.includes("/admin/customers")) {
      const { default: useCustomerStore } =
        await import("../store/customerStore");
      const payload = data.data || data;
      if (useCustomerStore && payload) {
        const currentPagination = useCustomerStore.getState().pagination;
        if (
          !currentPagination ||
          (payload.pagination &&
            payload.pagination.currentPage === currentPagination.currentPage &&
            payload.pagination.itemsPerPage === currentPagination.itemsPerPage)
        ) {
          useCustomerStore.setState({
            customers: payload.customers || [],
            pagination: payload.pagination || currentPagination,
          });
        }
      }
    } else if (url.includes("/home/all")) {
      const { default: useProductStore } =
        await import("../store/productStore");
      const homeData = data.data || data || {};
      if (useProductStore) {
        useProductStore.setState({
          homeProducts: {
            featured: homeData.featuredCollection || homeData.featured || [],
            trending: homeData.trending || [],
            newArrivals: homeData.newArrivals || [],
            bestSellers: homeData.bestSellers || [],
            sale: homeData.specialOffers || homeData.sale || [],
          },
        });
      }
    }
  } catch (err) {
    console.error(
      "[APICache] Failed to dynamically update Zustand store:",
      err,
    );
  }
};

/**
 * Dispatch background updates to registered store updaters if data changed.
 */
const notifyStoreUpdaters = (url, data) => {
  for (const { pattern, updaterFn } of storeUpdaters) {
    if (pattern.test(url)) {
      try {
        updaterFn(data);
      } catch (err) {
        console.error(
          `[APICache] Failed to update store for pattern ${pattern}:`,
          err,
        );
      }
    }
  }
};

/**
 * Lightweight data change detection using response size + sampling.
 * Avoids full JSON.stringify on large payloads (e.g. products arrays).
 * Falls back to full comparison for small payloads only.
 */
const isDataChanged = (obj1, obj2) => {
  try {
    // Quick reference check
    if (obj1 === obj2) return false;
    if (obj1 == null || obj2 == null) return true;

    // For responses with a pagination object, compare total + page as a fast fingerprint
    const p1 = obj1?.data?.pagination || obj1?.pagination;
    const p2 = obj2?.data?.pagination || obj2?.pagination;
    if (p1 && p2) {
      if (p1.totalItems !== p2.totalItems || p1.currentPage !== p2.currentPage)
        return true;
    }

    // For arrays (e.g. product lists), compare length + first/last item IDs
    const a1 = obj1?.data?.products || obj1?.products;
    const a2 = obj2?.data?.products || obj2?.products;
    if (Array.isArray(a1) && Array.isArray(a2)) {
      if (a1.length !== a2.length) return true;
      if (a1.length > 0 && a2.length > 0) {
        if (
          a1[0]?.id !== a2[0]?.id ||
          a1[a1.length - 1]?.id !== a2[a2.length - 1]?.id
        )
          return true;
        // Sample a middle element for extra confidence
        const mid = Math.floor(a1.length / 2);
        if (
          a1[mid]?.id !== a2[mid]?.id ||
          a1[mid]?.updatedAt !== a2[mid]?.updatedAt
        )
          return true;
      }
      return false; // Length, first, last, mid all match — consider unchanged
    }

    // For small payloads, use full stringify (fast enough for <10KB)
    const s1 = JSON.stringify(obj1);
    const s2 = JSON.stringify(obj2);
    return s1 !== s2;
  } catch {
    return true;
  }
};

/**
 * Handles Request Deduplication
 * If an identical request is already running, returns the same Promise.
 */
export const deduplicateRequest = (config, requestHandler) => {
  const key = getRequestKey(config);

  if (inFlightRequests.has(key)) {
    if (IS_DEV) {
      diagnostics.duplicatesPrevented++;
      console.log(`[APICache] Deduplicating concurrent request: ${config.url}`);
    }
    return inFlightRequests.get(key);
  }

  const startTime = performance.now();
  const promise = requestHandler(config)
    .then((response) => {
      trackTiming(config.url, performance.now() - startTime, "network");
      return response;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
};

/**
 * Handles Frontend Page Caching & Stale-While-Revalidate (SWR)
 *
 * Cache entries now include:
 *   - createdAt: when the entry was first cached
 *   - lastValidatedAt: when the entry was last revalidated
 *   - expiresAt: when the entry expires (createdAt + TTL)
 *   - value: the cached response data
 *   - response: the response metadata (status, headers, etc.)
 *
 * Background revalidation only fires when:
 *   (now - lastValidatedAt) > REVALIDATE_AFTER
 */
export const handleCachedRequest = async (config, requestHandler) => {
  // If request is not cacheable, bypass cache completely
  if (!isCacheable(config)) {
    return deduplicateRequest(config, requestHandler);
  }

  const key = getRequestKey(config);
  const now = Date.now();
  const cachedEntry = cacheStore.get(key);

  // If we have valid cache data, use Stale-While-Revalidate (SWR)
  if (cachedEntry && now < cachedEntry.expiresAt) {
    diagnostics.cacheHits++;
    trackTiming(config.url, 0, "cache");

    // Only trigger background revalidation if entry is stale enough
    const timeSinceLastValidation = now - cachedEntry.lastValidatedAt;
    if (timeSinceLastValidation > REVALIDATE_AFTER) {
      diagnostics.revalidationsTriggered++;
      if (IS_DEV) {
        console.log(
          `[APICache] Cache Hit + SWR Revalidate (stale ${Math.round(timeSinceLastValidation / 1000)}s): ${config.url}`,
        );
      }

      // Mark as recently validated to prevent duplicate background fetches
      cachedEntry.lastValidatedAt = now;

      // Trigger background validation (bypass cache)
      (async () => {
        try {
          const freshResponse = await requestHandler({
            ...config,
            headers: { ...config.headers, "X-Bypass-Cache": "true" },
          });

          const freshData = freshResponse.data;

          // If the server data has changed compared to cache, update UI silently
          if (isDataChanged(cachedEntry.value, freshData)) {
            if (IS_DEV) {
              console.log(
                `[APICache] Background refresh detected data change for: ${config.url}. Updating UI silently.`,
              );
            }
            cacheStore.set(key, {
              value: freshData,
              createdAt: cachedEntry.createdAt,
              lastValidatedAt: Date.now(),
              expiresAt: Date.now() + DEFAULT_TTL,
              response: {
                status: freshResponse.status,
                statusText: freshResponse.statusText,
                headers: freshResponse.headers,
                config: freshResponse.config,
              },
            });
            notifyStoreUpdaters(config.url, freshData);
            await updateStoreState(config.url, freshData);
          }
        } catch (err) {
          if (IS_DEV) {
            console.warn(
              `[APICache] Background revalidation failed for: ${config.url}`,
              err.message,
            );
          }
        }
      })();
    } else {
      diagnostics.revalidationsSkipped++;
      if (IS_DEV) {
        console.log(
          `[APICache] Cache Hit (fresh, skip revalidate): ${config.url}`,
        );
      }
    }

    // Instantly return the cached response
    return {
      ...cachedEntry.response,
      data: cachedEntry.value,
      headers: { ...cachedEntry.response.headers, "x-cache-hit": "true" },
    };
  }

  // Cache Miss: Run request, cache the result, and return it
  diagnostics.cacheMisses++;
  if (IS_DEV) {
    console.log(`[APICache] Cache Miss: ${config.url}`);
  }
  const response = await deduplicateRequest(config, requestHandler);

  const entryNow = Date.now();
  cacheStore.set(key, {
    value: response.data,
    createdAt: entryNow,
    lastValidatedAt: entryNow,
    expiresAt: entryNow + DEFAULT_TTL,
    response: {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config,
    },
  });

  return response;
};

/**
 * Manually invalidate specific cache key or matching pattern.
 */
export const invalidateFrontendCachePattern = (pattern) => {
  const keys = Array.from(cacheStore.keys());
  for (const key of keys) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
      if (IS_DEV) {
        console.log(`[APICache] Invalidated frontend cache key: ${key}`);
      }
    }
  }
};

/**
 * Clear the entire frontend cache.
 */
export const clearFrontendCache = () => {
  cacheStore.clear();
  if (IS_DEV) {
    console.log("[APICache] Frontend cache cleared.");
  }
};

// Automatic cleanup of expired entries every 30 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cacheStore.entries()) {
      if (now >= entry.expiresAt) {
        cacheStore.delete(key);
      }
    }
  }, 30000);
}
