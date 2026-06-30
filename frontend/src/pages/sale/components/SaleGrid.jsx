import React from 'react';
import ProductCard from '../../../components/products/ProductCard';
import { ProductCardSkeleton } from '../../../components/ui/SkeletonLoader';

const SaleGrid = ({ products, isLoading }) => {
  const gridClass =
    'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-5 gap-y-7';

  if (isLoading) {
    return (
      <div className={gridClass}>
        {[...Array(12)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default SaleGrid;
