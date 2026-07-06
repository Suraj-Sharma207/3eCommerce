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
import useCategoryStore from './store/categoryStore';
import ConfirmDialog from './components/ui/ConfirmDialog';
import ToastProvider from './components/ui/ToastProvider';
import WishlistDrawer from './components/wishlist/WishlistDrawer';
import { CookieProvider } from './components/cookies/CookieProvider';
import ChatWidget from './components/chat/ChatWidget';

function App() {
  const { checkAuth, token, user, hasCheckedAuth } = useAuthStore();
  const { fetchProfile } = useUserStore();
  const { fetchPublicConfig } = useSettingsStore();
  const { branding, fetchBranding } = useBrandingStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const { fetchCategories } = useCategoryStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // ── Centralized Category Loading ───────────────────────────────────────────
  // Categories are loaded once here at startup. All child components (Navbar,
  // CategoryNavigation, ProductList, HomePage) consume from the store without
  // triggering their own fetch calls.
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Non-critical startup requests (deferred after first paint) ─────────────
  // Branding (title/favicon) and settings (currency symbol) are not required
  // before first paint. Defer them so the React tree can mount and the critical
  // products fetch doesn't compete for Neon connection pool slots.
  useEffect(() => {
    // Use requestIdleCallback where available, fallback to setTimeout(0)
    const schedule = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb) => setTimeout(cb, 0);

    const idleId = schedule(() => {
      fetchPublicConfig();
      fetchBranding();
    });

    return () => {
      if (typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
    };
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
    link.href = branding?.faviconUrl || '/favicon.ico?v=3';
  }, [branding]);

  useEffect(() => {
    // We now rely on HttpOnly cookies, so we don't check for 'token' in state anymore.
    // Try to verify auth on mount to see if the server recognizes our cookie.
    if (!hasCheckedAuth) {
      checkAuth().then((isLoggedIn) => {
        if (isLoggedIn) {
          // Sync the userStore for any legacy components that still rely on it
          fetchProfile();
        }
      });
    }
  }, [hasCheckedAuth, checkAuth, fetchProfile]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  return (
    <Router>
      <ToastProvider />
      <ConfirmDialog />
      <WishlistDrawer />
      <ChatWidget />
      <CookieProvider>
        <SessionTimeoutProvider>
          <AppRoutes />
        </SessionTimeoutProvider>
      </CookieProvider>
    </Router>
  );
}

export default App;
