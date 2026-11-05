import React from "react";
import { Link } from "react-router-dom";

export const ProductCardList = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-3 flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-[#D1D5DB] scrollbar-track-transparent snap-x snap-mandatory w-full max-w-full select-none">
      {products.map((prod) => (
        <div
          key={prod.id}
          className="flex-shrink-0 w-44 snap-start p-3 rounded-2xl bg-white border border-[#ECECEC] flex flex-col justify-between hover:border-[#C97C4D]/50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <div>
            {/* Product Image */}
            {prod.image_url ? (
              <div className="w-full h-28 rounded-xl overflow-hidden bg-white border border-[#ECECEC] mb-2.5">
                <img
                  src={prod.image_url}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-28 bg-white border border-[#ECECEC] rounded-xl mb-2.5 flex items-center justify-center text-xs text-[#9CA3AF]">
                No Image
              </div>
            )}

            {/* Product Details */}
            <h4
              className="text-[11px] font-bold text-[#0F172A] line-clamp-1 mb-0.5"
              title={prod.name}
            >
              {prod.name}
            </h4>
            <p className="text-[9px] text-[#6B7280] font-medium uppercase tracking-wider mb-2">
              {prod.category}
            </p>
          </div>

          <div className="flex items-center justify-between gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-[#0F172A]">
              ₹{prod.final_price?.toLocaleString()}
            </span>
            <Link
              to={`/products/${prod.slug || prod.id}`}
              className="text-[9px] font-bold px-3 py-1 rounded-lg bg-[#C97C4D] hover:bg-[#B5673D] text-white transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductCardList;
