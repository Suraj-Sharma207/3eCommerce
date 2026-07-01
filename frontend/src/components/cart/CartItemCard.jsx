import React from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Heart, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageFallback from '../ui/ImageFallback';
import QuantityStepper from '../ecommerce/QuantityStepper';
import { formatPrice } from '../../utils/currency';
import { getOptimizedUrl } from '../../utils/cloudinary';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';

const CartItemCard = ({ item, onUpdateQuantity, onRemove, isUpdating }) => {
  const { product, quantity } = item;
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const isUnavailable = !product.active || product.stock === 0;
  const isLowStock   = product.stock > 0 && product.stock <= 5;
  const itemPrice    = product.finalPrice || product.price;
  const subtotal     = itemPrice * quantity;
  const hasDiscount  = product.discountPercentage > 0;
  const isWishlisted = isInWishlist(product.id);

  const handleWishlist = () => {
    if (!isAuthenticated) return toast.error('Please login first');
    toggleWishlist(product.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      className={`flex items-center gap-4 px-5 py-5 border-b border-slate-100 last:border-b-0
        ${isUnavailable ? 'opacity-60' : ''}
        ${isUpdating  ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* ── Product Image ── */}
      <Link
        to={`/products/${product.slug || item.productId}`}
        className="w-[110px] h-[110px] shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 block"
      >
        <ImageFallback
          src={getOptimizedUrl(product.thumbnail, 'thumbnail')}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </Link>

      {/* ── Info (grows) ── */}
      <div className="flex-1 min-w-0">
        {/* Brand • Category */}
        <p className="text-xs text-slate-400 font-medium mb-1">
          {product.brand && <span className="uppercase tracking-wide">{product.brand}</span>}
          {product.brand && product.category && <span className="mx-1.5 text-slate-300">•</span>}
          {product.category && <span className="capitalize">{product.category.replace(/_/g, ' ')}</span>}
        </p>

        {/* Product name */}
        <Link
          to={`/products/${product.slug || item.productId}`}
          className="block text-sm font-bold text-[#1B2340] hover:underline underline-offset-2 line-clamp-2 leading-snug mb-1.5"
        >
          {product.name}
        </Link>

        {/* Stock badge */}
        {isUnavailable ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
            <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
            <AlertTriangle className="w-3.5 h-3.5" /> Only {product.stock} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
          </span>
        )}

        {/* Unit price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-sm font-bold text-[#1B2340]">{formatPrice(itemPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>

      {/* ── Controls (right-aligned) ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quantity Stepper */}
        <QuantityStepper
          quantity={quantity}
          setQuantity={(q) => onUpdateQuantity(item.productId, q)}
          min={1}
          max={product.stock}
          disabled={isUpdating || isUnavailable}
        />

        {/* Subtotal */}
        <span className="text-sm font-extrabold text-[#1B2340] w-20 text-right tabular-nums">
          {formatPrice(subtotal)}
        </span>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none
            ${isWishlisted ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}
        >
          <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} style={{ width: 18, height: 18 }} />
        </button>

        {/* Remove */}
        <button
          onClick={() => onRemove(item.productId)}
          aria-label="Remove item"
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
        >
          <X style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </motion.div>
  );
};

export default CartItemCard;
