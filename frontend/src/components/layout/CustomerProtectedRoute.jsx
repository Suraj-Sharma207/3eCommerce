import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { PageSkeleton } from '../ui/SkeletonLoader';

const CustomerProtectedRoute = () => {
  const { user, isAuthenticated, hasCheckedAuth } = useAuthStore();
  const location = useLocation();

  if (!hasCheckedAuth) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export default CustomerProtectedRoute;
