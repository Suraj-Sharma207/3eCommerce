import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useBrandingStore } from '../../store/brandingStore';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut, Tag, Menu, X, Layout } from 'lucide-react';

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { branding } = useBrandingStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Offers', path: '/admin/offers', icon: Tag },
    { name: 'Homepage Sections', path: '/admin/homepage', icon: Layout },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="h-[100dvh] bg-surface-background flex overflow-hidden">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-border flex flex-col flex-shrink-0 z-50
          transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-20 flex items-center justify-between px-8 border-b border-border-light flex-shrink-0">
          <NavLink to="/" className="text-2xl font-black tracking-tighter text-text-brand-600 flex items-center gap-2">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={branding?.platformName || 'Admin'} className="h-10 w-auto" />
            ) : (
              <span>{branding?.platformName || 'Luxe'}<span className="text-brand-600">Admin</span></span>
            )}
          </NavLink>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 rounded-xl text-text-secondary hover:bg-surface-background transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/admin/dashboard' && location.pathname === '/admin');
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all
                  ${isActive 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'text-text-secondary hover:bg-border-light hover:text-text-brand-600'}
                `}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-light">
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-full">
        <header className="h-20 flex-shrink-0 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-text-secondary hover:bg-surface-background transition-colors mr-1"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-text-brand-600">Admin Portal</h2>
          </div>
          
          <NavLink to="/admin/profile" className="flex items-center gap-4 hover:bg-surface-background p-2 rounded-xl transition-colors">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold overflow-hidden border border-brand-200">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0) || 'A'
              )}
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-bold text-text-brand-600">{user.name}</p>
              <p className="text-text-muted">{user.role}</p>
            </div>
          </NavLink>
        </header>
        
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overscroll-contain">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
