import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Search, Heart, Menu, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useProductStore from '../../store/productStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import AccountDropdown from './AccountDropdown';
import ImageFallback from '../ui/ImageFallback';
import { formatPrice } from '../../utils/currency';

const Navbar = () => {
  const { searchQuery, setSearchQuery } = useProductStore();
  const { cart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { fetchWishlist } = useWishlistStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Search Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Debounced search for suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const { default: api } = await import('../../services/api');
        const response = await api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
          signal: abortControllerRef.current.signal
        });
        setSuggestions(response.data.data.suggestions);
        setIsSuggestionsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Search error:', error);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      const selected = suggestions[selectedIndex];
      navigate(`/products/${selected.slug || selected.id}`);
      setIsSuggestionsOpen(false);
      setSearchQuery('');
    } else if (searchQuery.trim()) {
      navigate('/products');
      setIsSuggestionsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!isSuggestionsOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleUserIconClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      setIsAccountDropdownOpen(prev => !prev);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-border-light transition-shadow duration-300 ${isScrolled ? 'shadow-md' : 'shadow-none'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center h-20">
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-secondary hover:text-brand-600 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center md:justify-start">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              className="text-3xl font-extrabold text-brand-600 tracking-tight flex items-center gap-2"
            >
              LuxeHome
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8 items-center font-medium text-text-secondary">
            <Link to="/products" className="hover:text-brand-600 transition-colors">Shop</Link>
            <Link to="/products?category=Collections" className="hover:text-brand-600 transition-colors">Collections</Link>
            <Link to="/products?category=Rooms" className="hover:text-brand-600 transition-colors">Rooms</Link>
            <Link to="/products?sale=true" className="text-danger-600 hover:text-danger-700 transition-colors">Sale</Link>
          </div>

          {/* Search Bar - Center/Right */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8" ref={searchContainerRef}>
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Search className="h-5 w-5 text-secondary-400 group-focus-within:text-brand-600 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSuggestionsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSuggestionsOpen(true);
                }}
                className="block w-full pl-11 pr-14 py-2.5 border border-border rounded-full bg-surface-background text-text-brand-600 placeholder-secondary-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent transition-all duration-300 relative z-10"
                placeholder="Search furniture..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-xs text-secondary-400 font-medium px-2 py-1 bg-white rounded border border-border shadow-sm">
                    Ctrl + K
                  </span>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {isSuggestionsOpen && (searchQuery.trim().length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border-light overflow-hidden z-50">
                  {suggestions.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Products
                      </div>
                      <ul>
                        {suggestions.map((item, index) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/products/${item.slug || item.id}`);
                                setIsSuggestionsOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                                index === selectedIndex ? 'bg-brand-50' : 'hover:bg-surface-background'
                              }`}
                            >
                              <div className="w-10 h-10 rounded bg-border-light flex-shrink-0 overflow-hidden">
                                <ImageFallback src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-text-brand-600 truncate">{item.name}</h4>
                                <p className="text-xs text-text-secondary truncate">{item.category}</p>
                              </div>
                              <div className="text-sm font-bold text-brand-600">
                                {formatPrice(item.finalPrice || item.price)}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t border-border-light p-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigate('/products');
                            setIsSuggestionsOpen(false);
                          }}
                          className="w-full py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1"
                        >
                          View all results <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-text-secondary text-sm">
                      No products found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-5 sm:space-x-7">
            
            {isAuthenticated ? (
              <>
                <Link to="/wishlist" className="hidden sm:block text-text-secondary hover:text-brand-600 transition-colors duration-200">
                  <Heart className="h-6 w-6" strokeWidth={1.5} />
                </Link>
                <div className="relative">
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleUserIconClick}
                    className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors duration-200 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold overflow-hidden border border-brand-200">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        (user?.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:block font-medium text-sm">
                      {user?.name?.split(' ')[0] || 'User'} <span className="text-xs ml-0.5 opacity-50">▼</span>
                    </span>
                  </button>
                  <AccountDropdown 
                    isOpen={isAccountDropdownOpen} 
                    onClose={() => setIsAccountDropdownOpen(false)} 
                  />
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-[14px] hover:bg-brand-700 transition-colors shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}

            <Link to="/cart" className="relative text-text-secondary hover:text-brand-600 transition-colors duration-200">
              <ShoppingCart className="h-6 w-6" strokeWidth={1.5} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border-light absolute w-full shadow-lg">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <form onSubmit={handleSearch} className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-secondary-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface-background"
                placeholder="Search furniture..."
              />
            </form>
            <Link to="/products" className="block px-3 py-3 text-base font-medium text-text-brand-600 hover:bg-surface-background rounded-lg">Shop</Link>
            <Link to="/products?category=Collections" className="block px-3 py-3 text-base font-medium text-text-brand-600 hover:bg-surface-background rounded-lg">Collections</Link>
            <Link to="/products?sale=true" className="block px-3 py-3 text-base font-medium text-danger-600 hover:bg-danger-600/10 rounded-lg">Sale</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
