import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye, ShoppingCart } from 'lucide-react';
import RatingDisplay from '../ecommerce/RatingDisplay';
import ImageFallback from '../ui/ImageFallback';
import Button from '../ui/Button';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { formatPrice } from '../../utils/currency';
import { getOptimizedUrl } from '../../utils/cloudinary';

const ProductCard = ({ product, previewMode = false }) => {
  if (!product) return null;

  const { addToCart, loadingProducts } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { publicConfig } = useSettingsStore();
  
  const lowStockThreshold = publicConfig?.lowStockThreshold || 5;
  const isCartLoading = previewMode ? false : (loadingProducts[product.id] || false);
  const isWishlisted = previewMode ? false : isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewMode) return;
    if (!isAuthenticated) return alert('Please login first');
    addToCart(product.id, 1, product.name);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewMode) return;
    if (!isAuthenticated) return alert('Please login first');
    toggleWishlist(product.id);
  };

  const hasDiscount = product.discountPercentage > 0;

  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-soft transition-all duration-300 border border-border-light">
      
      {/* Image Area with Actions */}
      <div className="relative aspect-square bg-surface-background overflow-hidden">
        <Link to={`/products/${product.slug || product.id}`} className="block w-full h-full" onClick={(e) => previewMode && e.preventDefault()}>
          <ImageFallback 
            src={getOptimizedUrl(product.thumbnail, 'card')} 
            alt={product.name} 
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.stock <= lowStockThreshold && product.stock > 0 && product.active && (
            <span className="bg-warning text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Low Stock</span>
          )}
          {(!product.active || product.stock === 0) && (
            <span className="bg-secondary-800 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Sold Out</span>
          )}
          {hasDiscount && product.stock > 0 && product.active && (
            <span className="bg-danger-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">{product.discountPercentage}% OFF</span>
          )}
          {product.newArrival && product.stock > 0 && product.active && !hasDiscount && (
            <span className="bg-accent-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">New</span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={handleToggleWishlist}
            className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-colors ${
              isWishlisted ? 'text-danger-600 hover:bg-danger-50' : 'text-text-secondary hover:text-danger-600 hover:bg-danger-50'
            }`} 
            aria-label="Add to wishlist"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button 
            className="w-10 h-10 rounded-full bg-white text-text-secondary hover:text-brand-600 hover:bg-brand-50 shadow-md flex items-center justify-center transition-colors" 
            aria-label="Quick view"
            onClick={(e) => { if (previewMode) { e.preventDefault(); e.stopPropagation(); } }}
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-1 flex justify-between items-center text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span>{product.category || 'Furniture'}</span>
          {product.brand && <span className="opacity-70">{product.brand}</span>}
        </div>
        
        <Link to={`/products/${product.slug || product.id}`} className="block mb-2 group-hover:text-brand-600 transition-colors" onClick={(e) => previewMode && e.preventDefault()}>
          <h3 className="text-lg font-bold text-text-brand-600 line-clamp-1">{product.name}</h3>
        </Link>
        
        <RatingDisplay rating={product.rating || 0} count={product.reviewCount || 0} className="mb-4" />
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border-light">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-text-brand-600">
              {formatPrice(product.finalPrice || product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-text-muted line-through font-medium">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Button 
            variant="primary"
            size="iconSm"
            onClick={handleAddToCart}
            className="rounded-full"
            isLoading={isCartLoading}
            disabled={!product.active || product.stock === 0}
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
