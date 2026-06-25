import React, { useRef, useEffect, startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { User, Package, Heart, MapPin, LogOut } from 'lucide-react';

const AccountDropdown = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();
  const { profile } = useUserStore();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    startTransition(() => {
      navigate(path);
    });
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-64 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border-light overflow-hidden z-50 transform origin-top-right transition-all duration-200 ease-out"
    >
      <div className="p-4 bg-surface-background/50 border-b border-border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold flex-shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(profile?.name)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              Hello, {profile?.name}
            </p>
            <p className="text-xs text-text-muted truncate">
              {profile?.email}
            </p>
          </div>
        </div>
      </div>
      
      <div className="py-2">
        <button 
          onClick={() => handleNavigate('/profile')}
          className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-background hover:text-brand-600 transition-colors"
        >
          <User className="w-4 h-4 mr-3 text-text-muted" />
          My Profile
        </button>
        <button 
          onClick={() => handleNavigate('/orders')}
          className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-background hover:text-brand-600 transition-colors"
        >
          <Package className="w-4 h-4 mr-3 text-text-muted" />
          My Orders
        </button>
        <button 
          onClick={() => handleNavigate('/wishlist')}
          className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-background hover:text-brand-600 transition-colors"
        >
          <Heart className="w-4 h-4 mr-3 text-text-muted" />
          Wishlist
        </button>
        <button 
          onClick={() => handleNavigate('/addresses')}
          className="w-full flex items-center px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-background hover:text-brand-600 transition-colors"
        >
          <MapPin className="w-4 h-4 mr-3 text-text-muted" />
          Saved Addresses
        </button>
      </div>
      
      <div className="border-t border-border-light py-2">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3 text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountDropdown;
