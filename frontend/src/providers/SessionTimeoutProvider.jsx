import React, { useEffect, useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import useSettingsStore from '../store/settingsStore';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const SessionTimeoutProvider = ({ children }) => {
  const { isAuthenticated, logout } = useAuthStore();
  const { publicConfig } = useSettingsStore();
  
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      return;
    }

    // Default to 24h if not specified
    const sessionTimeoutStr = publicConfig?.sessionTimeout || '24h';
    let timeoutMs = 24 * 60 * 60 * 1000;
    
    if (sessionTimeoutStr.endsWith('m')) timeoutMs = parseInt(sessionTimeoutStr) * 60 * 1000;
    else if (sessionTimeoutStr.endsWith('h')) timeoutMs = parseInt(sessionTimeoutStr) * 60 * 60 * 1000;
    else if (sessionTimeoutStr.endsWith('d')) timeoutMs = parseInt(sessionTimeoutStr) * 24 * 60 * 60 * 1000;

    const resetTimers = () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);

      if (showWarning) setShowWarning(false);

      // Show warning 1 minute before timeout (if timeout > 2m)
      const warningTime = timeoutMs > 120000 ? timeoutMs - 60000 : timeoutMs / 2;

      warningRef.current = setTimeout(() => {
        setShowWarning(true);
      }, warningTime);

      timeoutRef.current = setTimeout(() => {
        logout();
        setShowWarning(false);
      }, timeoutMs);
    };

    resetTimers();

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimers();

    activityEvents.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      activityEvents.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [isAuthenticated, publicConfig?.sessionTimeout, logout, showWarning]);

  return (
    <>
      {children}
      <Modal isOpen={showWarning} onClose={() => setShowWarning(false)} title="Session Expiring">
        <div className="p-4 font-normal">
          <p className="text-text-primary mb-4 font-normal">Your session will expire soon due to inactivity. Do you want to stay logged in?</p>
          <div className="flex justify-end gap-3 font-normal">
            <Button variant="outline" onClick={() => logout()}>Log Out</Button>
            <Button onClick={() => setShowWarning(false)}>Stay Logged In</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SessionTimeoutProvider;
