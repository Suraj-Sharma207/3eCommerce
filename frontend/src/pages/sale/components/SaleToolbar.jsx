import React from "react";
import { SlidersHorizontal } from "lucide-react";

const SaleToolbar = ({ totalProducts, sortParam, handleSortChange }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-5 py-3.5 rounded-2xl border border-border-light shadow-sm mb-6 gap-3">
      {/* Count */}
      <div className="flex items-center gap-2 text-text-secondary">
        <SlidersHorizontal className="w-4 h-4 text-text-muted font-medium" />
        <span className="text-sm">
          Showing <span className="font-semibold text-text-primary">{totalProducts}</span> sale products
        </span>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-muted whitespace-nowrap">
          Sort by:
        </span>
        <div className="relative">
          <select
            value={sortParam}
            onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none bg-surface-background border border-border-light text-text-primary text-sm rounded-xl focus:ring-2 focus:ring-danger-400 focus:border-danger-400 pl-4 pr-9 py-2 font-semibold cursor-pointer transition-colors hover:border-danger-300"
          >
            <option value="newest">New Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="discount_desc">Biggest Discount</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-text-muted font-medium">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleToolbar;
