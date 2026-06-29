import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, AlertTriangle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageFallback from '../ui/ImageFallback';
import QuantityStepper from '../ecommerce/QuantityStepper';
import { formatPrice } from '../../utils/currency';
import { getOptimizedUrl } from '../../utils/cloudinary';

const CartItemCard = ({ 
  item, 
  onUpdateQuantity, 
  onRemove, 
  isUpdating,
  onMoveToWishlist
}) => {
  const { product, quantity } = item;
  const isUnavailable = !product.active || product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const itemPrice = product.finalPrice || product.price;
  const subtotal = itemPrice * quantity;
  const hasDiscount = product.discountPercentage > 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative flex flex-col sm:flex-row items-start sm:items-center p-5 gap-6 border-b border-border bg-white group ${isUnavailable ? 'opacity-60 bg-surface-background' : ''} ${isUpdating ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Product Image & Remove Button */}
      <div className="relative shrink-0">
        <button 
          onClick={() => onRemove(item.productId)}
          className="absolute -top-2 -left-2 z-10 bg-danger-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors shadow-sm"
          aria-label="Remove item"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <Link to={`/products/${item.productId}`} className="block w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-surface-background border border-border shrink-0">
          <ImageFallback src={getOptimizedUrl(product.thumbnail, 'thumbnail')} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.productId}`} className="text-base sm:text-lg font-bold text-text-primary hover:text-brand-600 transition-colors line-clamp-2">
          {product.name}
        </Link>
        
        <div className="flex items-center gap-2 mt-1 mb-2 text-sm text-text-muted">
          {product.brand && <span className="font-medium text-text-secondary">{product.brand}</span>}
          {product.brand && <span>•</span>}
          <span>{product.category?.replace(/_/g, ' ')}</span>
        </div>

        {/* Variant Badge (Mocked or based on product data if exists) */}
        {product.variant && (
          <div className="inline-block px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full mb-3">
            {product.variant}
          </div>
        )}

        <div className="flex items-end gap-3 mt-2">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-brand-600">{formatPrice(itemPrice)}</span>
            {quantity > 1 && <span className="text-xs text-text-muted">Each: {formatPrice(itemPrice)}</span>}
          </div>
          {hasDiscount && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-text-muted line-through">{formatPrice(product.price)}</span>
              <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Tag className="w-3 h-3" /> {product.discountPercentage}% OFF
              </span>
            </div>
          )}
        </div>

        {isUnavailable ? (
          <span className="text-xs text-danger-600 font-bold mt-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="text-xs text-warning-600 font-bold mt-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Only {product.stock} left in stock
          </span>
        ) : null}
      </div>

      {/* Controls: Quantity & Subtotal */}
      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 sm:gap-8 mt-4 sm:mt-0 border-t sm:border-0 border-border pt-4 sm:pt-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary sm:hidden">Quantity:</span>
          <QuantityStepper 
            quantity={quantity} 
            setQuantity={(q) => onUpdateQuantity(item.productId, q)} 
            min={1} 
            max={item.product.stock}
            disabled={isUpdating || isUnavailable}
            className="w-full sm:w-32"
          />
        </div>
        
        <div className="text-lg font-bold text-brand-600 min-w-[80px] text-right">
          {formatPrice(subtotal)}
        </div>

        <button 
          onClick={() => onMoveToWishlist?.(item.productId)}
          className="text-text-muted hover:text-brand-600 transition-colors p-2"
          aria-label="Move to wishlist"
          title="Move to Wishlist"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default CartItemCard;
