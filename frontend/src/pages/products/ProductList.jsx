import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import useProductStore from '../../store/productStore';
import { Filter, ChevronDown, Check } from 'lucide-react';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const { products, isLoading, error, fetchProducts, pagination, filters, setFilters, clearFilters, searchQuery } = useProductStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const saleParam = searchParams.get('sale');
    const sortParam = searchParams.get('sort');
    
    let initialFilters = { ...filters };
    let shouldUpdate = false;

    if (categoryParam && categoryParam !== filters.category) {
      initialFilters.category = categoryParam;
      shouldUpdate = true;
    }
    if (saleParam === 'true') {
      initialFilters.sale = true;
      initialFilters.sort = 'price_asc';
      shouldUpdate = true;
    }
    if (sortParam && sortParam !== filters.sort) {
      initialFilters.sort = sortParam;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setFilters(initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced fetch on search or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1);
    }, 400); // 400ms debounce
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters]);

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories = ['All', 'Living Room', 'Bedroom', 'Dining Room', 'Office', 'Lighting', 'Decor'];
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
              {filters.category !== 'All' && (
                <li aria-current="page">
                  <div className="flex items-center">
                    <span className="mx-2">/</span>
                    <span className="text-text-brand-600 font-medium">{filters.category}</span>
                  </div>
                </li>
              )}
            </ol>
          </nav>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-text-brand-600 tracking-tight mb-2">
            {filters.category === 'All' ? 'All Furniture' : filters.category}
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
        <div className={`w-full md:w-64 flex-shrink-0 space-y-8 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    filters.category === cat 
                      ? 'bg-brand-600 border-brand-600' 
                      : 'border-border group-hover:border-brand-600-400'
                  }`}>
                    {filters.category === cat && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${filters.category === cat ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                    {cat}
                  </span>
                  <input 
                    type="radio" 
                    name="category" 
                    className="sr-only"
                    checked={filters.category === cat}
                    onChange={() => setFilters({ category: cat })}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Rating</h3>
            <div className="space-y-2">
              {[4, 3, 2, 1].map(rating => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    filters.minRating == rating 
                      ? 'bg-brand-600 border-brand-600' 
                      : 'border-border group-hover:border-brand-600-400'
                  }`}>
                    {filters.minRating == rating && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm ${filters.minRating == rating ? 'font-semibold text-brand-700' : 'text-text-secondary group-hover:text-text-brand-600'}`}>
                    {rating} Stars & Up
                  </span>
                  <input 
                    type="radio" 
                    name="minRating" 
                    className="sr-only"
                    checked={filters.minRating == rating}
                    onChange={() => setFilters({ minRating: rating })}
                  />
                </label>
              ))}
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

          {/* Availability & Discount */}
          <div>
            <h3 className="text-lg font-bold text-text-brand-600 mb-4">Availability</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  filters.inStock 
                    ? 'bg-brand-600 border-brand-600' 
                    : 'border-border group-hover:border-brand-600-400'
                }`}>
                  {filters.inStock && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm text-text-secondary group-hover:text-text-brand-600">In Stock Only</span>
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={filters.inStock || false}
                  onChange={(e) => setFilters({ inStock: e.target.checked })}
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  filters.sale 
                    ? 'bg-brand-600 border-brand-600' 
                    : 'border-border group-hover:border-brand-600-400'
                }`}>
                  {filters.sale && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm text-text-secondary group-hover:text-text-brand-600">On Sale</span>
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={filters.sale || false}
                  onChange={(e) => setFilters({ sale: e.target.checked })}
                />
              </label>
            </div>
          </div>

          <button 
            onClick={clearFilters}
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
                onClick={clearFilters}
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
