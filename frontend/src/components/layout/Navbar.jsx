import React, { useState } from 'react';
import { ShoppingCart, User, Search, Heart, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useProductStore from '../../store/productStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
  const { searchQuery, setSearchQuery } = useProductStore();
  const { cart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/products');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-secondary-100">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-secondary hover:text-primary-600 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center md:justify-start">
            <Link to="/" className="text-3xl font-extrabold text-primary-600 tracking-tight flex items-center gap-2">
              LuxeHome
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8 items-center font-medium text-text-secondary">
            <Link to="/products" className="hover:text-primary-600 transition-colors">Shop</Link>
            <Link to="/products?category=Collections" className="hover:text-primary-600 transition-colors">Collections</Link>
            <Link to="/products?category=Rooms" className="hover:text-primary-600 transition-colors">Rooms</Link>
            <Link to="/products?sale=true" className="text-danger hover:text-danger-dark transition-colors">Sale</Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-primary-600 font-bold hover:text-primary-700 transition-colors bg-primary-50 px-3 py-1 rounded-md">Admin Portal</Link>
            )}
          </div>

          {/* Search Bar - Center/Right */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-14 py-2.5 border border-secondary-200 rounded-full bg-secondary-50 text-text-primary placeholder-secondary-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                placeholder="Search furniture..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-secondary-400 font-medium px-2 py-1 bg-white rounded border border-secondary-200 shadow-sm">
                  Ctrl + K
                </span>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-5 sm:space-x-7">
            <Link to="/profile" className="text-text-secondary hover:text-primary-600 transition-colors duration-200">
              <User className="h-6 w-6" strokeWidth={1.5} />
            </Link>
            <Link to="/wishlist" className="hidden sm:block text-text-secondary hover:text-primary-600 transition-colors duration-200">
              <Heart className="h-6 w-6" strokeWidth={1.5} />
            </Link>
            <Link to="/cart" className="relative text-text-secondary hover:text-primary-600 transition-colors duration-200">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.5} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-secondary-100 absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <form onSubmit={handleSearch} className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-secondary-200 rounded-lg bg-secondary-50"
                placeholder="Search furniture..."
              />
            </form>
            <Link to="/products" className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-secondary-50 rounded-lg">Shop</Link>
            <Link to="/products?category=Collections" className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-secondary-50 rounded-lg">Collections</Link>
            <Link to="/products?sale=true" className="block px-3 py-3 text-base font-medium text-danger hover:bg-danger/10 rounded-lg">Sale</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
