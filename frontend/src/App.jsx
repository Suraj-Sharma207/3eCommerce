import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import SessionTimeoutProvider from './providers/SessionTimeoutProvider';
import useAuthStore from './store/authStore';
import useUserStore from './store/userStore';
import useSettingsStore from './store/settingsStore';
import { useBrandingStore } from './store/brandingStore';
import useCartStore from './store/cartStore';
import useWishlistStore from './store/wishlistStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { checkAuth, token, user } = useAuthStore();
  const { fetchProfile } = useUserStore();
  const { fetchPublicConfig } = useSettingsStore();
  const { branding, fetchBranding } = useBrandingStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    fetchPublicConfig();
    fetchBranding();
  }, [fetchPublicConfig, fetchBranding]);

  useEffect(() => {
    if (branding?.platformName) {
      document.title = branding.platformName;
    }
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding?.faviconUrl || branding?.logoUrl || '/vite.svg';
  }, [branding]);

  useEffect(() => {
    // If we have a token but haven't checked auth yet, check it on load
    if (token && !user) {
      checkAuth().then(() => {
        // Also sync the userStore for any legacy components that still rely on it
        fetchProfile();
      });
    }
  }, [token, user, checkAuth, fetchProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        duration: 4000,
        style: {
          background: '#111827',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '12px 20px',
        },
      }} />
      <SessionTimeoutProvider>
        <AppRoutes />
      </SessionTimeoutProvider>
    </Router>
  );
}

export default App;
