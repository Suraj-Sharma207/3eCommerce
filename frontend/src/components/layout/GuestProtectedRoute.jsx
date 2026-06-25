import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const GuestProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default GuestProtectedRoute;
