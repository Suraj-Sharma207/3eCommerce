import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import Pagination from '../../components/ui/Pagination';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import useProductStore from '../../store/productStore';
import useCategoryStore from '../../store/categoryStore';
import { Filter, ChevronDown, Check } from 'lucide-react';

const ALL_RATINGS = [4, 3, 2, 1];

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    products, 
    isLoading, 
    error, 
    fetchProducts, 
    pagination,
    filters,
    setFilters, 
    clearFilters: clearStoreFilters, 
    searchQuery,
    setSearchQuery 
  } = useProductStore();
  const { categories: categoriesList, fetchCategories } = useCategoryStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Parse parameters from URL search parameters
  const categoryParam = searchParams.get('category');
  const ratingsParam = searchParams.get('ratings') || '';
  const availabilityParam = searchParams.get('availability') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page')) || 1;

  // Local inputs state for prices to allow debouncing
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Sync inputs with searchParams when changed (e.g. on clear all)
  useEffect(() => {
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Read selectedCategories: if categoryParam is null, all categories are selected.
  // If it's "", no categories are selected.
  const selectedCategories = useMemo(() => {
    if (categoryParam === null) {
      return categoriesList.map(c => c.name);
    }
    return categoryParam ? categoryParam.split(',') : [];
  }, [categoryParam, categoriesList]);

  const selectedRatings = useMemo(() => {
    return ratingsParam ? ratingsParam.split(',').map(Number) : [];
  }, [ratingsParam]);

  const selectedAvailability = useMemo(() => {
    return availabilityParam ? availabilityParam.split(',') : [];
  }, [availabilityParam]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Sync URL params to store filters and trigger fetch
  useEffect(() => {
    // Map URL values to backend filter format
    let backendCategory = 'All';
    if (categoryParam !== null) {
      backendCategory = categoryParam; // If it's "" (deselected all), it is empty string
    }

    const backendMinRating = selectedRatings.length > 0 
      ? Math.min(...selectedRatings) 
      : '';

    const backendInStock = selectedAvailability.includes('inStock');
    const backendSale = selectedAvailability.includes('sale');

    // Sync search input in store
    if (searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }

    setFilters({
      category: backendCategory,
      minRating: backendMinRating,
      inStock: backendInStock,
      sale: backendSale,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      sort: sortParam,
    });

    fetchProducts(pageParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryParam, minPriceParam, maxPriceParam, selectedRatings, selectedAvailability, sortParam, pageParam, searchParam]);

  // Debounced price range filters sync to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      let changed = false;

      if (minPriceInput !== minPriceParam) {
        if (minPriceInput) newParams.set('minPrice', minPriceInput);
        else newParams.delete('minPrice');
        changed = true;
      }

      if (maxPriceInput !== maxPriceParam) {
        if (maxPriceInput) newParams.set('maxPrice', maxPriceInput);
        else newParams.delete('maxPrice');
        changed = true;
      }

      if (changed) {
        newParams.set('page', '1'); // reset page to 1
        setSearchParams(newParams, { replace: true });
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [minPriceInput, maxPriceInput, minPriceParam, maxPriceParam, searchParams, setSearchParams]);

  // Debounced search sync to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      const urlSearch = searchParams.get('search') || '';
      if (searchQuery !== urlSearch) {
        if (searchQuery) newParams.set('search', searchQuery);
        else newParams.delete('search');
        newParams.set('page', '1'); // reset page to 1
        setSearchParams(newParams, { replace: true });
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchParams, setSearchParams]);

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryToggle = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (cat === 'All') {
      const isAllChecked = selectedCategories.length === categoriesList.length;
      if (isAllChecked) {
        newParams.set('category', '');
      } else {
        newParams.delete('category');
      }
    } else {
      let newCats = [...selectedCategories];
      if (newCats.includes(cat)) {
        newCats = newCats.filter(c => c !== cat);
      } else {
        newCats.push(cat);
      }

      if (newCats.length === categoriesList.length) {
        newParams.delete('category');
      } else {
        newParams.set('category', newCats.join(','));
      }
    }

    newParams.set('page', '1'); // reset page to 1
    setSearchParams(newParams);
  };

  const handleRatingToggle = (rating) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (rating === 'All') {
      newParams.delete('ratings');
    } else {
      let newRatings = [...selectedRatings];
      if (selectedRatings.length === 0) {
        newRatings = [4, 3, 2, 1].filter(r => r !== rating);
      } else {
        if (newRatings.includes(rating)) {
          newRatings = newRatings.filter(r => r !== rating);
        } else {
          newRatings.push(rating);
        }
      }

      if (newRatings.length === 4 || newRatings.length === 0) {
        newParams.delete('ratings');
      } else {
        newParams.set('ratings', newRatings.join(','));
      }
    }
    
    newParams.set('page', '1'); // reset page to 1
    setSearchParams(newParams);
  };

  const handleAvailabilityToggle = (value) => {
    const newParams = new URLSearchParams(searchParams);
    let newAvail = [...selectedAvailability];
    if (newAvail.includes(value)) {
      newAvail = newAvail.filter(v => v !== value);
    } else {
      newAvail.push(value);
    }
    
    if (newAvail.length > 0) {
      newParams.set('availability', newAvail.join(','));
    } else {
      newParams.delete('availability');
    }
    newParams.set('page', '1'); // reset page to 1
    setSearchParams(newParams);
  };

  const handleClearAllFilters = () => {
    clearStoreFilters(); // resets store's search, price, sort
    setSearchParams(new URLSearchParams()); // clears URL params
  };

  const handleSortChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', e.target.value);
    newParams.set('page', '1'); // reset page to 1
    setSearchParams(newParams);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'highest_rated', label: 'Highest Rated' },
    { value: 'discount', label: 'Largest Discount' },
  ];

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
              onChange={handleSortChange}
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
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.length === categoriesList.length
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-border group-hover:border-brand-600-400'
                  }`}>
                  {selectedCategories.length === categoriesList.length && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-sm ${selectedCategories.length === categoriesList.length ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                  All
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={selectedCategories.length === categoriesList.length}
                  onChange={() => handleCategoryToggle('All')}
                />
              </label>

              {categoriesList.map(catObj => {
                const cat = catObj.name;
                const isChecked = selectedCategories.includes(cat);
                return (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked
                        ? 'bg-brand-600 border-brand-600'
                        : 'border-border group-hover:border-brand-600-400'
                      }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`text-sm ${isChecked ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                      {cat} <span className="text-xs text-text-muted">({catObj.count})</span>
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
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Max (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="2000"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
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
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {products.map((product) => (
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
