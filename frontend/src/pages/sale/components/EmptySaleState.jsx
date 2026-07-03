import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptySaleState = () => {
  return (
    <div className="text-center py-24 bg-white rounded-2xl border border-border-light shadow-sm font-normal">
      <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6 font-normal">
        <ShoppingBag className="w-10 h-10 text-danger-500 font-normal" />
      </div>
      <h3 className="text-2xl font-bold text-text-primary mb-3">No Sale Items Found</h3>
      <p className="text-text-secondary max-w-md mx-auto mb-8 font-normal">
        We couldn't find any products matching your current sale filters. Try adjusting the discount level or check back later for new offers.
      </p>
      <Link 
        to="/products"
        className="inline-block bg-brand-600 text-white px-8 py-3 rounded-xl hover:bg-brand-700 transition-colors shadow-sm font-normal"
      >
        Shop All Products
      </Link>
    </div>
  );
};

export default EmptySaleState;
