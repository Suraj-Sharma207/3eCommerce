import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import AuthLayout from '../components/layout/AuthLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const HomePage = lazy(() => import('../pages/home/HomePage'));
const ProductList = lazy(() => import('../pages/products/ProductList'));
const ProductDetail = lazy(() => import('../pages/products/ProductDetail'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const CartPage = lazy(() => import('../pages/cart/CartPage'));
const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('../pages/checkout/OrderSuccessPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const OrdersPage = lazy(() => import('../pages/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage'));
const WishlistPage = lazy(() => import('../pages/wishlist/WishlistPage'));

const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('../pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('../pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('../pages/admin/AdminCustomers'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));
const AdminOffers = lazy(() => import('../pages/admin/AdminOffers'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));
const AdminHomepageSettings = lazy(() => import('../pages/admin/AdminHomepageSettings'));

const CustomerProtectedRoute = lazy(() => import('../components/layout/CustomerProtectedRoute'));
const GuestProtectedRoute = lazy(() => import('../components/layout/GuestProtectedRoute'));
const AddressBook = lazy(() => import('../pages/addresses/AddressBook'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));

const AppRoutes = () => {
  return (
    <div className="min-h-[100dvh] bg-background-default font-sans flex flex-col">
      <Suspense fallback={
        <div className="flex-1 flex justify-center items-center h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <Routes>
          {/* Public Storefront Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            
            {/* Customer Protected Routes */}
            <Route element={<CustomerProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/addresses" element={<AddressBook />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<HomePage />} />
          </Route>

          {/* Authentication Routes */}
          <Route element={<AuthLayout />}>
            <Route element={<GuestProtectedRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="categories" element={<div className="p-8">Categories feature coming soon.</div>} />
            <Route path="analytics" element={<div className="p-8">Analytics feature coming soon.</div>} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="homepage" element={<AdminHomepageSettings />} />
            <Route path="offers" element={<AdminOffers />} />
          </Route>

        </Routes>
      </Suspense>
    </div>
  );
};

export default AppRoutes;
