import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Trash2, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useWishlistStore from '../../store/wishlistStore';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useConfirmStore from '../../store/confirmStore';
import { formatPrice } from '../../utils/currency';
import api from '../../services/api';
import toast from 'react-hot-toast';

const WishlistDrawer = () => {
  const { isWishlistOpen, closeWishlist, wishlist, hasFetched, fetchWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const confirm = useConfirmStore(state => state.confirm);
  const navigate = useNavigate();

  useEffect(() => {
    if (isWishlistOpen && isAuthenticated && !hasFetched) {
      fetchWishlist();
    }
  }, [isWishlistOpen, isAuthenticated, hasFetched, fetchWishlist]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isWishlistOpen) {
        closeWishlist();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isWishlistOpen, closeWishlist]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isWishlistOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isWishlistOpen]);

  const items = (wishlist?.items || []).filter(item => item.product);

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    const isConfirmed = await confirm({
      title: 'Clear Wishlist',
      description: 'Are you sure you want to remove all items from your wishlist? This action cannot be undone.',
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (isConfirmed) {
      const currentWishlist = useWishlistStore.getState().wishlist;
      const currentItems = [...(currentWishlist?.items || [])];
      
      try {
        // Optimistically clear the UI
        useWishlistStore.setState({ wishlist: { ...currentWishlist, items: [] } });
        
        // Sequentially toggle items to prevent race conditions & backend 500s
        for (const item of currentItems) {
          await api.post('/wishlist/toggle', { productId: item.productId });
        }
        
        // Refetch to ensure perfect sync after all toggles are done
        const finalResponse = await api.get('/wishlist');
        useWishlistStore.setState({ wishlist: finalResponse.data.data });
        
        toast.success('Wishlist cleared');
      } catch (error) {
        // Revert to original state if something fails halfway
        useWishlistStore.setState({ wishlist: currentWishlist });
        toast.error('Failed to clear wishlist fully');
      }
    }
  };

  const handleAddToCart = (product) => {
    if (product && product.id) {
      addToCart(product.id, 1, product.name);
      toast.success('Added to cart');
    } else {
      toast.error('Cannot add this item to cart');
    }
  };

  const handleProductClick = (productId) => {
    closeWishlist();
    navigate(`/products/${productId}`);
  };

  if (!isAuthenticated) {
    return (
      <AnimatePresence>
        {isWishlistOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end font-normal">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={closeWishlist}
              className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm font-normal"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full sm:w-[380px] md:w-[460px] bg-white shadow-2xl flex flex-col z-10 h-full font-normal"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-light font-normal">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-600 fill-brand-600 font-normal" />
                  My Wishlist
                </h2>
                <button onClick={closeWishlist} className="p-2 hover:bg-surface-hover rounded-full transition-colors font-normal">
                  <X className="w-5 h-5 text-text-secondary font-normal" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-normal">
                <Heart className="w-16 h-16 text-brand-200 mb-6 font-normal" />
                <h3 className="text-xl font-bold text-text-primary mb-2">Login Required</h3>
                <p className="text-text-secondary mb-8 font-normal">Please log in to view and manage your wishlist.</p>
                <button 
                  onClick={() => { closeWishlist(); navigate('/login', { state: { from: { pathname: window.location.pathname } } }); }}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
                >
                  Log In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end font-normal">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={closeWishlist}
            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm font-normal"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full sm:w-[380px] md:w-[460px] bg-white shadow-2xl flex flex-col z-10 h-full font-normal"
          >
            {/* Header */}
            <div className="flex flex-col border-b border-border-light shrink-0 font-normal">
              <div className="flex items-center justify-between p-6 pb-4 font-normal">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Heart className="w-5 h-5 text-brand-600 fill-brand-600 font-normal" />
                  My Wishlist <span className="text-text-muted text-sm font-medium">({items.length})</span>
                </h2>
                <button onClick={closeWishlist} className="p-2 hover:bg-surface-hover rounded-full transition-colors font-normal" aria-label="Close Wishlist">
                  <X className="w-5 h-5 text-text-secondary font-normal" />
                </button>
              </div>
              
              {items.length > 0 && (
                <div className="px-6 pb-4 flex justify-end font-normal">
                  <button 
                    onClick={handleClearAll}
                    className="text-sm text-danger-600 hover:text-danger-700 flex items-center gap-1.5 transition-colors font-normal"
                  >
                    <Trash2 className="w-4 h-4 font-normal" />
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 custom-scrollbar font-normal">
              {!hasFetched || !wishlist ? (
                <div className="space-y-4 animate-pulse font-normal">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border-light bg-white font-normal">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-200 shrink-0 font-normal"></div>
                      <div className="flex-1 flex flex-col justify-between font-normal">
                        <div>
                          <div className="h-5 bg-slate-200 rounded w-3/4 mb-2 font-normal"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/3 mb-4 font-normal"></div>
                          <div className="h-4 bg-slate-200 rounded w-1/4 font-normal"></div>
                        </div>
                        <div className="h-8 bg-slate-200 rounded w-full mt-3 font-normal"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center font-normal">
                  <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 font-normal">
                    <Heart className="w-10 h-10 text-brand-300 font-normal" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Your wishlist is empty</h3>
                  <p className="text-text-secondary mb-8 max-w-[250px] font-normal">
                    Save items you love and keep track of them here.
                  </p>
                  <button 
                    onClick={closeWishlist}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm font-normal"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4 font-normal">
                  {items.map((item) => {
                    const product = item?.product;
                    
                    // Skip entirely corrupted items (should not happen, but defensive)
                    if (!product || !product.id) return null;

                    const price = product.price || 0;
                    const compareAtPrice = product.compareAtPrice || 0;
                    const discount = compareAtPrice > price 
                      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
                      : 0;
                    const isOutOfStock = (product.stock || 0) <= 0;
                    
                    // Safely access images
                    const imageUrl = product.images?.[0]?.url || '/placeholder.jpg';
                    const productName = product.name || 'Loading...';
                    const productBrand = product.brand || ' ';

                    return (
                      <div key={item.productId || product.id} className="flex gap-4 p-4 rounded-2xl border border-border-light hover:border-brand-200 hover:shadow-md transition-all bg-white group font-normal">
                        
                        {/* Image */}
                        <div 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-background shrink-0 overflow-hidden cursor-pointer relative flex items-center justify-center font-normal"
                          onClick={() => handleProductClick(product.id)}
                        >
                          <img 
                            src={imageUrl} 
                            alt={productName} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 font-normal"
                          />
                          {discount > 0 && (
                            <div className="absolute top-1.5 left-1.5 bg-danger-500 text-white text-[10px] px-1.5 py-0.5 rounded font-normal">
                              -{discount}%
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0 font-normal">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1 font-normal">
                              <h4 
                                className="text-text-primary text-sm sm:text-base line-clamp-2 cursor-pointer hover:text-brand-600 transition-colors font-normal"
                                onClick={() => handleProductClick(product.id)}
                              >
                                {productName}
                              </h4>
                              <button 
                                onClick={() => handleRemove(product.id)}
                                className="p-1.5 text-text-muted hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors shrink-0"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4 font-normal" />
                              </button>
                            </div>
                            <p className="text-xs text-text-muted mb-2 font-medium">{productBrand}</p>
                            
                            <div className="flex items-center gap-2 flex-wrap font-normal">
                              <span className="text-text-primary font-normal">{formatPrice(price)}</span>
                              {compareAtPrice > price && (
                                <span className="text-xs text-text-muted line-through font-medium">
                                  {formatPrice(compareAtPrice)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between font-normal">
                            {isOutOfStock ? (
                              <span className="text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded-md font-normal">
                                Out of Stock
                              </span>
                            ) : (
                              <span className="text-xs text-success-700 bg-success-50 px-2 py-1 rounded-md font-normal">
                                In Stock
                              </span>
                            )}

                            <button 
                              onClick={() => handleAddToCart(product)}
                              disabled={isOutOfStock}
                              className={`p-2 rounded-xl flex items-center justify-center transition-all ${isOutOfStock ? 'bg-surface-background text-text-disabled cursor-not-allowed' : 'bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white'}`}
                              aria-label="Add to cart"
                            >
                              <ShoppingCart className="w-4 h-4 font-normal" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
