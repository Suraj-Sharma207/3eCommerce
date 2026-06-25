import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import useAuthStore from './store/authStore';
import useUserStore from './store/userStore';

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
      <AppRoutes />
    </Router>
  );
}

export default App;
