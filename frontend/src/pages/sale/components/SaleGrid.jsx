import React from "react";
import ProductCard from "../../../components/products/ProductCard";
import ProductGrid from "../../../components/products/ProductGrid";
import { ProductCardSkeleton } from "../../../components/ui/SkeletonLoader";

const SaleGrid = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <ProductGrid maxCols={4}>
        {[...Array(12)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </ProductGrid>
    );
  }

  return (
    <ProductGrid maxCols={4}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ProductGrid>
  );
};

export default SaleGrid;
