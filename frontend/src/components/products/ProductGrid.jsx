import React from 'react';

const ProductGrid = ({ children, className = '', maxCols = 5 }) => {
  const colClass = maxCols === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-5';
  
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${colClass} gap-x-5 gap-y-7 ${className}`}>
      {children}
    </div>
  );
};

export default ProductGrid;
