import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-secondary-200 flex flex-col fixed inset-y-0 z-10">
        <div className="h-20 flex items-center px-8 border-b border-secondary-100">
          <span className="text-2xl font-black tracking-tighter text-text-primary">
            Luxe<span className="text-primary-600">Admin</span>
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
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary'}
                `}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-secondary-100">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-danger hover:bg-danger-light transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-w-0 flex flex-col">
        <header className="h-20 bg-white border-b border-secondary-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-text-primary">Admin Portal</h2>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="text-sm">
              <p className="font-bold text-text-primary">{user.name}</p>
              <p className="text-text-muted">{user.role}</p>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
