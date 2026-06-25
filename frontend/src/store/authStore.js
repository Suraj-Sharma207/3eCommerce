import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

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
          
          // Fetch profile after login
          import('./userStore').then(module => {
            module.default.getState().fetchProfile();
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Login failed', 
            isLoading: false 
          });
          return false;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password });
          const { user, token } = response.data.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          // Fetch profile after register
          import('./userStore').then(module => {
            module.default.getState().fetchProfile();
          });
          
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Registration failed', 
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
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
