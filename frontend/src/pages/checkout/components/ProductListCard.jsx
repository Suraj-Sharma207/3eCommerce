import React from 'react';
import { formatPrice } from '../../../utils/currency';

const ProductListCard = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-300 mb-8">
      <h2 className="text-xl font-bold text-text-brand-700 mb-6">Ordered Products</h2>
      
      <div className="space-y-6">
        {items.map((item, index) => {
          const product = item.product || {};
          const imageSrc = product.thumbnail || product.galleryImages?.[0] || 'https://via.placeholder.com/80';
          
          return (
            <div key={item.id || index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center py-4 border-b border-gray-100 last:border-0 last:pb-0">
              {/* Product Image */}
              <div className="shrink-0 w-[80px] h-[80px] bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <img 
                  src={imageSrc} 
                  alt={product.name || 'Product'} 
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Product Details (Desktop: Middle, Mobile: Below Image) */}
              <div className="flex-1 min-w-0 w-full">
                <h3 className="text-sm font-bold text-text-brand-700 truncate mb-1">
                  {product.name || 'Unknown Product'}
                </h3>
                {product.category && (
                  <p className="text-xs text-text-muted mb-2">{product.category}</p>
                )}
                
                {/* Mobile Price & Qty Row */}
                <div className="flex sm:hidden justify-between items-center mt-2">
                  <span className="text-sm font-medium text-text-muted">Qty: {item.quantity}</span>
                  <span className="text-sm font-bold text-text-brand-700">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>

              {/* Desktop Price & Qty Row */}
              <div className="hidden sm:flex items-center gap-8 text-right min-w-[120px] justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-text-muted mb-1">Qty</span>
                  <span className="text-sm font-bold text-text-brand-700">{item.quantity}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-text-muted mb-1">Total</span>
                  <span className="text-sm font-bold text-text-brand-700">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductListCard;
