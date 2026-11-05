import { create } from "zustand";
import api from "../services/api";
import { parseError } from "../utils/errorParser";

let checkAuthPromise = null;

// H-2: Proactively clean up legacy auth-storage from users' browsers.
// This ensures that old JWTs left behind before we removed the persist middleware
// are securely deleted from localStorage/sessionStorage.
try {
  localStorage.removeItem("auth-storage");
  sessionStorage.removeItem("auth-storage");
} catch (e) {
  // Ignore errors in environments where storage isn't available
}

/**
 * Authentication Store
 *
 * H-2: Authentication state is stored ONLY in memory (no localStorage/sessionStorage).
 * Zustand persist middleware has been removed entirely.
 *
 * Auth flow:
 * - Login/Register: Server sets HttpOnly cookies, store holds user object in memory
 * - Page refresh: checkAuth() calls GET /auth/me (cookie sent automatically by browser)
 * - Logout: Server clears cookies, store resets in-memory state
 * - Token refresh: Handled automatically by api.js interceptor via cookies
 */
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hasCheckedAuth: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      // H-1: Server no longer returns token in body — only user data
      const { user } = response.data.data;

      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      set({ error: parseError(error, "Login failed") });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (name, email, password, phone) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        phone,
      });
      // H-1: Server no longer returns token in body — only user data
      const { user } = response.data.data;

      set({ user, isAuthenticated: true });
      return true;
    } catch (error) {
      set({
        error: parseError(
          error,
          "Unable to create your account. Please try again later.",
        ),
      });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Logout should always succeed client-side even if server call fails
      console.error("Logout API call failed:", error?.message);
    }
    // H-2: Clear only in-memory state — no localStorage/sessionStorage to clean up.
    // Server has already cleared the HttpOnly cookies.
    set({ user: null, isAuthenticated: false, hasCheckedAuth: false });

    // Clear all other stores using dynamic imports to avoid circular deps
    import("./userStore").then((module) =>
      module.default.getState().clearProfile(),
    );
    import("./cartStore").then((module) =>
      module.default.getState().resetCart(),
    );
    import("./wishlistStore").then((module) =>
      module.default.getState().clearWishlist(),
    );
  },

  /**
   * Verify authentication on page load/refresh.
   * This is now the SOLE mechanism for restoring auth state after a page refresh.
   * The browser automatically sends the HttpOnly accessToken cookie.
   */
  checkAuth: async () => {
    if (get().hasCheckedAuth) return get().isAuthenticated;
    if (checkAuthPromise) return checkAuthPromise;

    checkAuthPromise = (async () => {
      try {
        const response = await api.get("/auth/session");
        const { authenticated, user } = response.data.data;
        if (authenticated && user) {
          set({ user, isAuthenticated: true, hasCheckedAuth: true });
          return true;
        } else {
          set({ user: null, isAuthenticated: false, hasCheckedAuth: true });
          return false;
        }
      } catch (error) {
        set({ user: null, isAuthenticated: false, hasCheckedAuth: true });
        return false;
      } finally {
        checkAuthPromise = null;
      }
    })();

    return checkAuthPromise;
  },

  clearError: () => set({ error: null }),

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return (
        response.data?.message ||
        "If your email is registered, a password reset link has been sent."
      );
    } catch (error) {
      set({ error: parseError(error, "Password reset request failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });
      return (
        response.data?.message || "Your password has been successfully reset."
      );
    } catch (error) {
      set({ error: parseError(error, "Password reset failed") });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;
