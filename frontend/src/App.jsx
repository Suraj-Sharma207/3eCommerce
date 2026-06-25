import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';
import useUserStore from './store/userStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { isAuthenticated, token } = useAuthStore();
  const { fetchProfile, profile, hasLoadedInitial } = useUserStore();

  useEffect(() => {
    if (isAuthenticated && token && !profile && !hasLoadedInitial) {
      fetchProfile();
    }
  }, [isAuthenticated, token, profile, hasLoadedInitial, fetchProfile]);

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
      <AppRoutes />
    </Router>
  );
}

export default App;
