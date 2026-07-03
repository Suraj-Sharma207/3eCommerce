import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Search, Heart, Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useProductStore from '../../store/productStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import { useBrandingStore } from '../../store/brandingStore';
import useCategoryStore from '../../store/categoryStore';
import AccountDropdown from './AccountDropdown';
import ImageFallback from '../ui/ImageFallback';
import { formatPrice } from '../../utils/currency';
import { getOptimizedUrl } from '../../utils/cloudinary';
import useUIStore from '../../store/uiStore';
import CategoryNavigation from './CategoryNavigation';
import MegaMenu from '../navigation/MegaMenu';
import MobileCollectionsAccordion from '../navigation/MobileCollectionsAccordion';

const Navbar = () => {
    const { searchQuery, setSearchQuery } = useProductStore();
    const { cart, isLoading: isCartLoading } = useCartStore();
    const { user, isAuthenticated } = useAuthStore();
    const { fetchWishlist, wishlist, openWishlist } = useWishlistStore();
    const { branding } = useBrandingStore();
    const { categories } = useCategoryStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    
    // UI state for sticky category navigation
    const isCategorySticky = useUIStore(state => state.isCategorySticky);

    useEffect(() => {
        if (isAuthenticated) {
            // Wishlist fetching moved to App.jsx global initialization
        }
    }, [isAuthenticated]);

    // Categories are now loaded centrally from App.jsx

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
        <nav className={`fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-lg border-b border-border-light transition-shadow duration-300 ${isCategorySticky ? 'shadow-md' : 'shadow-none'}`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 font-normal">
                <div className={`flex justify-between items-center transition-all duration-300 ${isCategorySticky ? 'h-16' : 'h-20'}`}>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden font-normal">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-text-secondary hover:text-brand-600 focus:outline-none p-2"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6 font-normal" /> : <Menu className="h-6 w-6 font-normal" />}
                        </button>
                    </div>

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center md:justify-start font-normal">
                        <Link
                            to="/"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
                            className="text-3xl font-extrabold text-brand-600 tracking-tight flex items-center gap-2"
                        >
                            {branding?.logoUrl ? (
                                <img 
                                    src={branding.logoUrl} 
                                    alt={branding?.platformName} 
                                    className={`w-auto transition-all duration-300 ${isCategorySticky ? 'h-8' : 'h-10'}`} 
                                />
                            ) : (
                                branding?.platformName || 'Store'
                            )}
                        </Link>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex space-x-8 items-center text-text-secondary h-full font-normal">
                        <NavLink to="/products" className={({ isActive }) => `relative py-4 transition-colors ${isActive ? 'text-brand-900 font-bold' : 'hover:text-brand-600'}`}>Shop</NavLink>
                        <MegaMenu isOpen={isMegaMenuOpen} setIsOpen={setIsMegaMenuOpen} />
                        <NavLink to="/about" className={({ isActive }) => `relative py-4 transition-colors ${isActive ? 'text-brand-900 font-bold' : 'hover:text-brand-600'}`}>About</NavLink>
                        <NavLink to="/sale" className={({ isActive }) => `relative py-4 transition-colors ${isActive ? 'text-danger-700 font-bold' : 'text-danger-600 hover:text-danger-700'}`}>Sale</NavLink>
                    </div>

                    {/* Search Bar - Center/Right */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-8 font-normal" ref={searchContainerRef}>
                        <form onSubmit={handleSearch} className="relative w-full group font-normal">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10 font-normal">
                                <Search className="h-5 w-5 text-secondary-400 group-focus-within:text-brand-600 transition-colors font-normal" />
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
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10 font-normal">
                                {isSearching ? (
                                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin font-normal"></div>
                                ) : null}
                            </div>

                            {/* Suggestions Dropdown */}
                            {isSuggestionsOpen && (searchQuery.trim().length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-border-light overflow-hidden z-50 font-normal">
                                    {suggestions.length > 0 ? (
                                        <div className="py-2 font-normal">
                                            <div className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider font-medium">
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
                                                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${index === selectedIndex ? 'bg-brand-50' : 'hover:bg-surface-background'
                                                                }`}
                                                        >
                                                            <div className="w-10 h-10 rounded bg-border-light flex-shrink-0 overflow-hidden font-normal">
                                                                <ImageFallback src={getOptimizedUrl(item.thumbnail, 'thumbnail')} alt={item.name} className="w-full h-full object-cover font-normal" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 font-normal">
                                                                <h4 className="text-sm text-text-brand-600 truncate font-normal">{item.name}</h4>
                                                                <p className="text-xs text-text-secondary truncate font-normal">{item.category}</p>
                                                            </div>
                                                            <div className="text-sm text-brand-600 font-normal">
                                                                {formatPrice(item.finalPrice || item.price)}
                                                            </div>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="border-t border-border-light p-2 font-normal">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigate('/products');
                                                        setIsSuggestionsOpen(false);
                                                    }}
                                                    className="w-full py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1"
                                                >
                                                    View all results <ArrowRight className="w-4 h-4 font-normal" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-text-secondary text-sm font-normal">
                                            No products found for "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-5 sm:space-x-7 font-normal">

                        {isAuthenticated ? (
                            <>
                                <button 
                                    onClick={openWishlist} 
                                    className="hidden sm:block relative text-text-secondary hover:text-brand-600 transition-colors duration-200 focus:outline-none font-normal"
                                >
                                    {wishlist?.items?.length > 0 ? (
                                        <Heart className="h-6 w-6 text-danger-600 fill-danger-600 font-normal" strokeWidth={1.5} />
                                    ) : (
                                        <Heart className="h-6 w-6 font-normal" strokeWidth={1.5} />
                                    )}
                                </button>
                                <div className="relative font-normal">
                                    <button
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={handleUserIconClick}
                                        className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors duration-200 focus:outline-none"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center overflow-hidden border border-brand-200 font-normal">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover font-normal" />
                                            ) : (
                                                (user?.name || 'U').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="hidden sm:block text-sm font-normal">
                                            {user?.name?.split(' ')[0] || 'User'} <span className="text-xs ml-0.5 opacity-50 font-normal">▼</span>
                                        </span>
                                    </button>
                                    <AccountDropdown
                                        isOpen={isAccountDropdownOpen}
                                        onClose={() => setIsAccountDropdownOpen(false)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="hidden sm:flex items-center gap-4 font-normal">
                                <Link to="/login" className="text-sm text-text-secondary hover:text-brand-600 transition-colors font-normal">
                                    Sign In
                                </Link>
                                <Link to="/register" className="text-sm bg-brand-600 text-white px-4 py-2 rounded-[14px] hover:bg-brand-700 transition-colors shadow-sm font-normal">
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        <Link to="/cart" className="relative text-text-secondary hover:text-brand-600 transition-colors duration-200 font-normal">
                            <ShoppingCart className="h-6 w-6 font-normal" strokeWidth={1.5} />
                            {isAuthenticated && (
                                <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-brand-600 text-white text-[11px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm font-normal">
                                    {isCartLoading && !cart ? (
                                        <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin font-normal"></div>
                                    ) : (
                                        cartItemCount > 99 ? '99+' : cartItemCount
                                    )}
                                </div>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            <CategoryNavigation isVisible={isCategorySticky} />

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-border-light absolute w-full shadow-lg font-normal">
                    <div className="px-4 pt-2 pb-6 space-y-1 font-normal">
                        <form onSubmit={handleSearch} className="mb-6 relative font-normal">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-normal">
                                <Search className="h-5 w-5 text-secondary-400 font-normal" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-surface-background"
                                placeholder="Search furniture..."
                            />
                        </form>
                        <Link 
                            to="/products" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-surface-background rounded-lg"
                        >
                            Shop
                        </Link>
                        
                        <MobileCollectionsAccordion closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                        
                        <Link 
                            to="/about" 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-3 text-base font-medium text-text-primary hover:bg-surface-background rounded-lg"
                        >
                            About
                        </Link>

                        <div className="pt-2 mt-2 font-normal">
                            <Link 
                                to="/sale" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-3 text-base font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            >
                                Sale
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
