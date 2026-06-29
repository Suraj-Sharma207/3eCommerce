import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

const CartHeader = ({ itemCount }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Link 
          to="/products" 
          className="flex items-center gap-2 text-text-secondary hover:text-brand-600 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
        <div className="hidden sm:block w-px h-6 bg-border"></div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
          Shopping Cart
        </h1>
      </div>
      
      <div className="flex items-center gap-2 bg-surface-background border border-border px-4 py-2 rounded-lg text-sm font-medium text-text-secondary w-fit">
        <ShoppingBag className="w-4 h-4" />
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};

export default CartHeader;
