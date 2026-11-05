import React from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const EmptySaleState = ({ onResetFilter }) => {
  return (
    <div className="text-center py-24 bg-white rounded-2xl border border-border-light shadow-sm px-4">
      <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag className="w-10 h-10 text-danger-500" />
      </div>
      <h3 className="text-2xl font-bold text-text-primary mb-3">
        No Sale Items Found
      </h3>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        We couldn't find any products matching your current sale filters. Try
        adjusting the discount level or check back later for new offers.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            className="bg-danger-600 text-white px-6 py-2.5 rounded-xl hover:bg-danger-700 font-semibold transition-colors shadow-sm"
          >
            Show All Sale Items
          </button>
        )}
        <Link
          to="/products"
          className="inline-block bg-white text-text-primary border border-border-light px-6 py-2.5 rounded-xl hover:bg-surface-background font-semibold transition-colors shadow-sm"
        >
          Shop All Products
        </Link>
      </div>
    </div>
  );
};

export default EmptySaleState;
