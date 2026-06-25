import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import { parseError } from '../utils/errorParser';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: parseError(error, 'Login failed'), 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password, phone });
          const { user, token } = response.data.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: parseError(error, 'Unable to create your account. Please try again later.'), 
            isLoading: false 
          });
          return false;
        }
      },

      logout: () => {
        localStorage.clear();
        sessionStorage.clear();
        set({ user: null, token: null, isAuthenticated: false });
        
        // Clear all other stores using dynamic imports to avoid circular deps
        import('./userStore').then(module => module.default.getState().clearProfile());
        import('./cartStore').then(module => module.default.getState().clearCart());
        import('./wishlistStore').then(module => module.default.getState().clearWishlist());
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }

        try {
          const response = await api.get('/auth/me');
          const user = response.data.data.user;
          set({ user, isAuthenticated: true });
          return true;
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
