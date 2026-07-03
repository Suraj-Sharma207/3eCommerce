import React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useCategoryStore from '../../store/categoryStore';
import CategoryItem from './CategoryItem';

const CategoryNavigation = ({ isVisible }) => {
  const { categories, isLoading } = useCategoryStore();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Determine active category based on URL
  const currentCategory = searchParams.get('category');
  const isProductsPage = location.pathname.startsWith('/products');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full bg-surface-background border-t border-border overflow-hidden hidden md:block font-normal"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-2 md:py-0 md:h-12 flex items-center font-normal">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row gap-2 sm:gap-4 md:gap-6 w-full items-center font-normal">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex-1 flex justify-center h-12 md:h-full items-center font-normal">
                    <div className="h-4 w-20 bg-border animate-pulse rounded font-normal" />
                  </div>
                ))}
              </div>
            ) : (
              <nav className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row gap-2 sm:gap-4 md:gap-6 w-full items-center justify-between font-normal">
                {categories.map((category) => (
                  <div key={category.id || category.name} className="flex-1 flex justify-center h-12 md:h-full min-w-0 font-normal">
                    <CategoryItem
                      category={category}
                      isActive={currentCategory === category.name || (!currentCategory && isProductsPage && category.name === 'All')}
                    />
                  </div>
                ))}
              </nav>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CategoryNavigation;
