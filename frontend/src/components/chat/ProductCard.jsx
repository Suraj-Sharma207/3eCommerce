import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { name, brand, final_price, price, image_url, slug, in_stock } = product;
  const hasDiscount = final_price < price;

  return (
    <div className="flex bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-3 w-full">
      {image_url ? (
        <div className="w-24 h-24 flex-shrink-0 bg-gray-50 p-2">
          <img src={image_url} alt={name} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}
      
      <div className="p-3 flex flex-col justify-between flex-grow">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{name}</h4>
          <p className="text-xs text-gray-500">{brand}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">${final_price?.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">${price?.toFixed(2)}</span>
            )}
          </div>
          
          <Link
            to={`/product/${slug}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              in_stock 
                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' 
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
          >
            {in_stock ? 'View' : 'Out of Stock'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
