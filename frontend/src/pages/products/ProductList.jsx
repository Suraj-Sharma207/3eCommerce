import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import Pagination from '../../components/ui/Pagination';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import useProductStore from '../../store/productStore';
import { Filter, ChevronDown, Check } from 'lucide-react';

const ALL_CATEGORIES = ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Lighting', 'Decor'];
const ALL_RATINGS = [4, 3, 2, 1];

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, isLoading, error, fetchProducts, pagination, filters, setFilters, clearFilters: clearStoreFilters, searchQuery } = useProductStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Read local arrays from URL
  const selectedCategories = searchParams.get('categories') ? searchParams.get('categories').split(',') : [];
  const selectedRatings = searchParams.get('ratings') ? searchParams.get('ratings').split(',').map(Number) : [];
  const selectedAvailability = searchParams.get('availability') ? searchParams.get('availability').split(',') : [];

  // Setup initial store filters from URL only for things that still hit the backend (sort, price)
  useEffect(() => {
    const sortParam = searchParams.get('sort') || 'newest';
    const minPriceParam = searchParams.get('minPrice') || '';
    const maxPriceParam = searchParams.get('maxPrice') || '';

    let shouldUpdate = false;
    let initialFilters = { ...filters, sort: sortParam };

    if (sortParam !== filters.sort) shouldUpdate = true;
    if (minPriceParam !== filters.minPrice) {
      initialFilters.minPrice = minPriceParam;
      shouldUpdate = true;
    }
    if (maxPriceParam !== filters.maxPrice) {
      initialFilters.maxPrice = maxPriceParam;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setFilters(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync store changes (price, sort) to URL so they persist too
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    let changed = false;
    
    if (filters.sort && filters.sort !== 'newest') {
      if (newParams.get('sort') !== filters.sort) { newParams.set('sort', filters.sort); changed = true; }
    } else {
      if (newParams.has('sort')) { newParams.delete('sort'); changed = true; }
    }
    
    if (filters.minPrice) {
      if (newParams.get('minPrice') !== filters.minPrice.toString()) { newParams.set('minPrice', filters.minPrice); changed = true; }
    } else {
      if (newParams.has('minPrice')) { newParams.delete('minPrice'); changed = true; }
    }

    if (filters.maxPrice) {
      if (newParams.get('maxPrice') !== filters.maxPrice.toString()) { newParams.set('maxPrice', filters.maxPrice); changed = true; }
    } else {
      if (newParams.has('maxPrice')) { newParams.delete('maxPrice'); changed = true; }
    }

    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  }, [filters.sort, filters.minPrice, filters.maxPrice]);

  // Debounced fetch on search or STORE filters change (price, sort)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1);
    }, 400); // 400ms debounce
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.minPrice, filters.maxPrice, filters.sort]);

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateUrlParam = (key, values) => {
    const newParams = new URLSearchParams(searchParams);
    if (values && values.length > 0) {
      newParams.set(key, values.join(','));
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleCategoryToggle = (cat) => {
    if (cat === 'All') {
      updateUrlParam('categories', []);
      return;
    }
    
    let newCats = [...selectedCategories];
    // If "All" was active, clicking a category implies unchecking it
    if (selectedCategories.length === 0) {
      newCats = ALL_CATEGORIES.filter(c => c !== cat);
    } else {
      if (newCats.includes(cat)) {
        newCats = newCats.filter(c => c !== cat);
      } else {
        newCats.push(cat);
      }
    }

    // Auto-check All if everything is selected, or if nothing is selected
    if (newCats.length === ALL_CATEGORIES.length || newCats.length === 0) {
      newCats = [];
    }

    updateUrlParam('categories', newCats);
  };

  const handleRatingToggle = (rating) => {
    if (rating === 'All') {
      updateUrlParam('ratings', []);
      return;
    }

    let newRatings = [...selectedRatings];
    if (selectedRatings.length === 0) {
      newRatings = ALL_RATINGS.filter(r => r !== rating);
    } else {
      if (newRatings.includes(rating)) {
        newRatings = newRatings.filter(r => r !== rating);
      } else {
        newRatings.push(rating);
      }
    }

    if (newRatings.length === ALL_RATINGS.length || newRatings.length === 0) {
      newRatings = [];
    }

    updateUrlParam('ratings', newRatings);
  };

  const handleAvailabilityToggle = (value) => {
    let newAvail = [...selectedAvailability];
    if (newAvail.includes(value)) {
      newAvail = newAvail.filter(v => v !== value);
    } else {
      newAvail.push(value);
    }
    updateUrlParam('availability', newAvail);
  };

  const handleClearAllFilters = () => {
    clearStoreFilters(); // resets search, minPrice, maxPrice, sort
    setSearchParams(new URLSearchParams()); // clears URL params for local filters
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'discount', label: 'Largest Discount' },
  ];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      // Category (OR logic for array items)
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      
      // Rating (OR logic for array items)
      const matchesRating = selectedRatings.length === 0 || selectedRatings.some(r => product.rating >= r);
      
      // Availability (OR logic for array items)
      const inStockMatch = selectedAvailability.includes('inStock') && product.stock > 0;
      const saleMatch = selectedAvailability.includes('sale') && product.sale === true;
      const matchesAvailability = selectedAvailability.length === 0 || inStockMatch || saleMatch;

      return matchesCategory && matchesRating && matchesAvailability;
    });
  }, [products, selectedCategories, selectedRatings, selectedAvailability]);

  const startItem = pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0;
  const endItem = Math.min(startItem + pagination.itemsPerPage - 1, pagination.totalItems);

  return (
    <PageContainer className="py-8 lg:py-12">
      {/* Header & Sort */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-border gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex text-sm text-text-secondary mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <a href="/" className="hover:text-brand-600 transition-colors">Home</a>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <a href="/products" className="hover:text-brand-600 transition-colors">Products</a>
                </div>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-text-brand-600 tracking-tight mb-2">
            All Furniture
          </h1>
          <p className="text-text-secondary">
            Showing {startItem}–{endItem} of {pagination.totalItems} Products
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="md:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-text-brand-600 font-medium"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="relative group">
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value })}
              className="appearance-none bg-white border border-border text-text-brand-600 py-2 pl-4 pr-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer shadow-sm"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 flex-shrink-0 space-y-8 md:sticky md:top-28 h-fit ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Categories</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.length === 0
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-border group-hover:border-brand-600-400'
                  }`}>
                  {selectedCategories.length === 0 && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${selectedCategories.length === 0 ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                  All
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedCategories.length === 0}
                  onChange={() => handleCategoryToggle('All')}
                />
              </label>

              {ALL_CATEGORIES.map(cat => {
                const isChecked = selectedCategories.length === 0 || selectedCategories.includes(cat);
                return (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked
                        ? 'bg-brand-600 border-brand-600'
                        : 'border-border group-hover:border-brand-600-400'
                      }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm ${isChecked ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                      {cat}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Rating</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedRatings.length === 0
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-border group-hover:border-brand-600-400'
                  }`}>
                  {selectedRatings.length === 0 && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${selectedRatings.length === 0 ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                  All Ratings
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedRatings.length === 0}
                  onChange={() => handleRatingToggle('All')}
                />
              </label>

              {ALL_RATINGS.map(rating => {
                const isChecked = selectedRatings.length === 0 || selectedRatings.includes(rating);
                return (
                  <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked
                        ? 'bg-brand-600 border-brand-600'
                        : 'border-border group-hover:border-brand-600-400'
                      }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm ${isChecked ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                      {rating} Stars & Up
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => handleRatingToggle(rating)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Price Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Min (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="0"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters({ minPrice: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Max (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="2000"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters({ maxPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAvailability.includes('inStock')
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-border group-hover:border-brand-600-400'
                  }`}>
                  {selectedAvailability.includes('inStock') && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${selectedAvailability.includes('inStock') ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                  In Stock
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedAvailability.includes('inStock')}
                  onChange={() => handleAvailabilityToggle('inStock')}
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedAvailability.includes('sale')
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-border group-hover:border-brand-600-400'
                  }`}>
                  {selectedAvailability.includes('sale') && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${selectedAvailability.includes('sale') ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                  On Sale
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedAvailability.includes('sale')}
                  onChange={() => handleAvailabilityToggle('sale')}
                />
              </label>
            </div>
          </div>

          <button
            onClick={handleClearAllFilters}
            className="text-sm font-semibold text-text-secondary hover:text-danger-600 underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>

        {/* Main Product Grid */}
        <div className="flex-1">
          {error ? (
            <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-8">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-border text-center shadow-sm">
              <div className="w-16 h-16 bg-border-light rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-secondary-400" />
              </div>
              <h3 className="text-xl font-bold text-text-brand-600 mb-2">No products found</h3>
              <p className="text-text-secondary max-w-md mb-6">
                We couldn't find any products matching your current filters. Try adjusting your search or category.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default ProductList;
