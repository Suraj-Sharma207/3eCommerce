import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useProductStore from '../../store/productStore';
import ProductCard from '../products/ProductCard';

const RecommendedSlider = ({ currentCartItemIds = [] }) => {
  const { recommendedProducts, fetchRecommendedProducts, hasFetchedRecommended } = useProductStore();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasFetchedRecommended);

  useEffect(() => {
    const loadRecommended = async () => {
      setIsLoading(true);
      await fetchRecommendedProducts();
      setIsLoading(false);
    };
    if (!hasFetchedRecommended) {
      loadRecommended();
    } else {
      setIsLoading(false);
    }
  }, [fetchRecommendedProducts, hasFetchedRecommended]);

  useEffect(() => {
    if (!recommendedProducts || recommendedProducts.length === 0) return;
    
    const cartIdsSet = new Set(currentCartItemIds);
    const filtered = recommendedProducts.filter(p => !cartIdsSet.has(p.id));
    
    setProducts(filtered.slice(0, 8)); // Keep max 8
  }, [currentCartItemIds, recommendedProducts]);

  if (isLoading) {
    return (
      <div className="mt-16">
        <h2 className="text-xl font-bold mb-6">Customers also bought</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="min-w-[200px] sm:min-w-[240px] h-64 bg-surface-background animate-pulse rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6 text-text-primary">Customers also bought</h2>
      
      {/* Horizontal Slider */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product) => (
            <motion.div 
              key={product.id}
              className="min-w-[200px] sm:min-w-[240px] snap-start"
              whileHover={{ y: -4 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedSlider;
