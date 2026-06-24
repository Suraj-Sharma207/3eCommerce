import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ title, count, imageUrl, to }) => {
  return (
    <Link to={to} className="group block">
      <div className="relative rounded-2xl overflow-hidden bg-secondary-100 aspect-square mb-4">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary-600 transition-colors">{title}</h3>
        {count !== undefined && (
          <p className="text-sm text-text-secondary mt-1">{count} items</p>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
