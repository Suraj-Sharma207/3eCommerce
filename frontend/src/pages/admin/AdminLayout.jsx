import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col fixed inset-y-0 z-10">
        <div className="h-20 flex items-center px-8 border-b border-border-light">
          <span className="text-2xl font-black tracking-tighter text-text-brand-600">
            Luxe<span className="text-brand-600">Admin</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => `
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
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0 flex flex-col">
        <header className="h-20 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-text-brand-600">Admin Portal</h2>
          <NavLink to="/admin/profile" className="flex items-center gap-4 hover:bg-surface-background p-2 rounded-xl transition-colors">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold overflow-hidden border border-brand-200">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="text-sm">
              <p className="font-bold text-text-brand-600">{user.name}</p>
              <p className="text-text-muted">{user.role}</p>
            </div>
          </NavLink>
        </header>
        
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
