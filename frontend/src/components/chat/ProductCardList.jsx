import React from 'react';
import { Link } from 'react-router-dom';

export const ProductCardList = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mt-3 flex overflow-x-auto gap-4 pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory w-full max-w-full select-none">
      {products.map((prod) => (
        <div 
          key={prod.id} 
          className="flex-shrink-0 w-44 snap-start p-3 rounded-2xl bg-slate-950/30 border border-slate-800/80 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <div>
            {/* Product Image */}
            {prod.image_url ? (
              <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-2.5">
                <img 
                  src={prod.image_url} 
                  alt={prod.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-28 bg-slate-900 border border-slate-800 rounded-xl mb-2.5 flex items-center justify-center text-xs text-slate-600">
                No Image
              </div>
            )}

            {/* Product Details */}
            <h4 className="text-[11px] font-semibold text-slate-100 line-clamp-1 mb-0.5" title={prod.name}>
              {prod.name}
            </h4>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">
              {prod.category}
            </p>
          </div>

          <div className="flex items-center justify-between gap-1.5 mt-1">
            <span className="text-[11px] font-bold text-slate-100">
              ₹{prod.final_price?.toLocaleString()}
            </span>
            <Link
              to={`/products/${prod.slug || prod.id}`}
              className="text-[9px] font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
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
