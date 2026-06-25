import React, { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import HeroBanner from '../../components/ecommerce/HeroBanner';
import SectionHeader from '../../components/layout/SectionHeader';
import CategoryCard from '../../components/ecommerce/CategoryCard';
import ProductCard from '../../components/products/ProductCard';
import Button from '../../components/ui/Button';
import { ProductCardSkeleton } from '../../components/ui/SkeletonLoader';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const { default: api } = await import('../../services/api');
        const response = await api.get('/products/home');
        const data = response.data.data;
        
        setFeaturedProducts(data.featured || []);
        setTrendingProducts(data.trending || []);
        setNewArrivals(data.newArrivals || []);
        setBestSellers(data.bestSellers || []);
        setSaleProducts(data.sale || []);
      } catch (error) {
        console.error('Failed to fetch home products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { default: api } = await import('../../services/api');
        const response = await api.get('/products/categories');
        setCategories(response.data.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Living Room': 'Sofa',
      'Bedroom': 'Bed',
      'Dining': 'Utensils',
      'Office': 'Monitor',
      'Lighting': 'Lightbulb',
      'Decor': 'Star',
      'Outdoor': 'Sun'
    };
    return iconMap[categoryName] || 'Package';
  };

  const renderProductGrid = (items) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      );
    }
    if (!items || items.length === 0) {
      return <div className="text-center text-text-muted py-8">No products found in this section.</div>;
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
          actionLink="/products"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {isCategoriesLoading ? (
            [...Array(6)].map((_, i) => (
               <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col items-center justify-center animate-pulse">
                 <div className="w-16 h-16 bg-neutral-100 rounded-full mb-4"></div>
                 <div className="h-5 bg-neutral-100 rounded w-24 mb-2"></div>
                 <div className="h-4 bg-neutral-100 rounded w-16"></div>
               </div>
            ))
          ) : (
            categories.map((cat, idx) => (
              <CategoryCard 
                key={idx}
                title={cat.name}
                count={cat.count}
                iconName={getCategoryIcon(cat.name)}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
              />
            ))
          )}
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
      
      {/* Sale / Special Offers */}
      <PageContainer className="bg-danger/5 py-16 rounded-3xl">
        <SectionHeader 
          title="Special Offers" 
          subtitle="Grab them before they're gone"
          actionLabel="View Sale"
          actionLink="/products?sale=true"
        />
        {renderProductGrid(saleProducts)}
      </PageContainer>

      {/* New Arrivals */}
      <PageContainer>
        <SectionHeader 
          title="New Arrivals" 
          subtitle="The latest additions to our catalog"
          actionLabel="Shop new"
          actionLink="/products?newArrival=true"
        />
        {renderProductGrid(newArrivals)}
      </PageContainer>

      {/* Best Sellers */}
      <PageContainer className="bg-secondary-50/50 py-16 rounded-3xl">
        <SectionHeader 
          title="Best Sellers" 
          subtitle="Our most loved furniture"
          actionLabel="View all"
          actionLink="/products?bestSeller=true"
        />
        {renderProductGrid(bestSellers)}
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
