import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const CartHeader = ({ itemCount }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {/* Left: Back link */}
      <Link
        to="/products"
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#1B2340] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        Continue Shopping
      </Link>

      {/* Center: Title */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2340] tracking-tight">
        Shopping Cart
      </h1>

      {/* Right: Item count badge */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600">
        <ShoppingCart className="w-4 h-4" />
        {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
      </div>
    </div>
  );
};

export default CartHeader;
