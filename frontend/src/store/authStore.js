import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { parseError } from '../utils/errorParser';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasCheckedAuth: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          
          set({ user, token, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ error: parseError(error, 'Login failed') });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password, phone });
          const { user, token } = response.data.data;
          
          set({ user, token, isAuthenticated: true });
          return true;
        } catch (error) {
          set({ error: parseError(error, 'Unable to create your account. Please try again later.') });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout failed:', error);
        }
        set({ user: null, token: null, isAuthenticated: false, hasCheckedAuth: false });
        
        // Clear all forms of token storage
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Clear all other stores using dynamic imports to avoid circular deps
        import('./userStore').then(module => module.default.getState().clearProfile());
        import('./cartStore').then(module => module.default.getState().resetCart());
        import('./wishlistStore').then(module => module.default.getState().clearWishlist());
      },

      checkAuth: async () => {
        if (get().hasCheckedAuth) return get().isAuthenticated;
        
        try {
          const response = await api.get('/auth/me');
          const user = response.data.data.user;
          set({ user, isAuthenticated: true, hasCheckedAuth: true });
          return true;
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false, hasCheckedAuth: true });
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
