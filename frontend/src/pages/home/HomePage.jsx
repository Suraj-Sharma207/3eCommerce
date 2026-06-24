import React, { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import HeroBanner from '../../components/ecommerce/HeroBanner';
import SectionHeader from '../../components/layout/SectionHeader';
import CategoryCard from '../../components/ecommerce/CategoryCard';
import ProductCard from '../../components/products/ProductCard';
import Button from '../../components/ui/Button';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';
import useProductStore from '../../store/productStore';

const HomePage = () => {
  const { products, isLoading, fetchProducts } = useProductStore();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);

  useEffect(() => {
    // We would normally have distinct API endpoints for these, but for now we simulate
    // different sections using the main products query by just fetching a batch and slicing it.
    const loadHomeData = async () => {
      await fetchProducts(1);
    };
    loadHomeData();
  }, [fetchProducts]);

  useEffect(() => {
    if (products.length > 0) {
      setFeaturedProducts(products.slice(0, 4));
      setTrendingProducts(products.slice(2, 6)); // Simulate different list
      setNewArrivals(products.slice(0, 4).reverse()); // Simulate different list
    }
  }, [products]);

  const categories = [
    { title: 'Living Room', count: 124, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80', to: '/products?category=Living+Room' },
    { title: 'Bedroom', count: 86, image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&q=80', to: '/products?category=Bedroom' },
    { title: 'Dining Room', count: 64, image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=500&q=80', to: '/products?category=Dining+Room' },
    { title: 'Office', count: 48, image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80', to: '/products?category=Office' },
    { title: 'Lighting', count: 72, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80', to: '/products?category=Lighting' },
    { title: 'Decor', count: 96, image: 'https://images.unsplash.com/photo-1613203009765-a8c4ce8c7f96?w=500&q=80', to: '/products?category=Decor' },
  ];

  const renderProductGrid = (items) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-24 pb-20">
      <HeroBanner />

      {/* Shop by Category */}
      <PageContainer>
        <SectionHeader 
          title="Shop by Category" 
          subtitle="Explore our wide range of furniture categories"
          actionLabel="View all"
          actionLink="/categories"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, idx) => (
            <CategoryCard 
              key={idx}
              title={cat.title}
              count={cat.count}
              imageUrl={cat.image}
              to={cat.to}
            />
          ))}
        </div>
      </PageContainer>

      {/* Featured Collection */}
      <PageContainer className="bg-secondary-50/50 py-16 rounded-3xl">
        <SectionHeader 
          title="Featured Collection" 
          subtitle="Handpicked favorites for you"
          actionLabel="View all"
          actionLink="/products?featured=true"
        />
        {renderProductGrid(featuredProducts)}
      </PageContainer>

      {/* Trending Now */}
      <PageContainer>
        <SectionHeader 
          title="Trending Now" 
          subtitle="What's popular this season"
          actionLabel="View all"
          actionLink="/products?trending=true"
        />
        {renderProductGrid(trendingProducts)}
      </PageContainer>

      {/* New Arrivals */}
      <PageContainer className="bg-secondary-50/50 py-16 rounded-3xl">
        <SectionHeader 
          title="New Arrivals" 
          subtitle="The latest additions to our catalog"
          actionLabel="Shop new"
          actionLink="/products?sort=newest"
        />
        {renderProductGrid(newArrivals)}
      </PageContainer>

      {/* Newsletter Section */}
      <PageContainer>
        <div className="bg-primary-900 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary-800 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-primary-800 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Join Our Newsletter</h2>
            <p className="text-primary-100 text-lg mb-8">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-6 py-4 rounded-full text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <Button type="submit" size="lg" className="rounded-full px-8 shadow-lg bg-accent-500 hover:bg-accent-600 focus:ring-accent-500">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default HomePage;
