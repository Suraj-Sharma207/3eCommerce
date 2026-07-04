import React, { useEffect, useState, useRef, useCallback } from'react';
import PageContainer from'../../components/layout/PageContainer';
import HeroBanner from'../../components/ecommerce/HeroBanner';
import HomeSection from'../../components/layout/HomeSection';
import CategoryCard from'../../components/ecommerce/CategoryCard';
import ProductCard from'../../components/products/ProductCard';
import ProductGrid from'../../components/products/ProductGrid';
import Button from'../../components/ui/Button';
import { ProductCardSkeleton } from'../../components/ui/SkeletonLoader';
import useUIStore from'../../store/uiStore';
import useIntersectionObserver from'../../hooks/useIntersectionObserver';
import useProductStore from'../../store/productStore';
import useCategoryStore from'../../store/categoryStore';

const HomePage = () => {
 const { homeProducts, fetchHomeProducts, hasFetchedHome } = useProductStore();
 const { categories, isLoading: isCategoriesLoading } = useCategoryStore();
 const [isLoading, setIsLoading] = useState(!hasFetchedHome);

 // IntersectionObserver for Sticky Navbar
 const sentinelRef = useRef(null);
 const setCategorySticky = useUIStore(state => state.setCategorySticky);

 const handleIntersection = useCallback((entry) => {
 // When sentinel scrolls past the 64px mark (navbar height), it stops intersecting.
 if (!entry.isIntersecting && entry.boundingClientRect.top <= 64) {
 setCategorySticky(true);
 } else {
 setCategorySticky(false);
 }
 }, [setCategorySticky]);

 useIntersectionObserver(sentinelRef, handleIntersection, {
 rootMargin:'-64px 0px 0px 0px',
 threshold: 0,
 });

 // Ensure sticky state is reset when unmounting HomePage
 useEffect(() => {
 return () => setCategorySticky(false);
 }, [setCategorySticky]);

 useEffect(() => {
 const loadHomeData = async () => {
 setIsLoading(true);
 await fetchHomeProducts();
 setIsLoading(false);
 };
 if (!hasFetchedHome) {
 loadHomeData();
 } else {
 setIsLoading(false);
 }
 }, [fetchHomeProducts, hasFetchedHome]);

 // Categories are now loaded centrally from App.jsx

 const renderProductGrid = (items) => {
 if (isLoading) {
 return (
 <ProductGrid maxCols={4}>
 {[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}
 </ProductGrid>
 );
 }
 if (!items || items.length === 0) {
 return <div className="text-center text-text-muted py-8 font-medium">No products found in this section.</div>;
 }
 return (
 <ProductGrid maxCols={4}>
 {items.map(product => (
 <ProductCard key={product.id} product={product} />
 ))}
 </ProductGrid>
 );
 };

 return (
 <div className="flex flex-col pb-20">
 <HeroBanner />

 {/* Sentinel for Navbar */}
 <div className="relative">
 <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-[1px] pointer-events-none -mt-8" aria-hidden="true" />
 </div>

 {/* Categories Section */}
 <HomeSection
 title="Shop by Category"
 subtitle="Find exactly what you need"
 hasBackground={true}
 actionButton={<Button variant="outline" href="/products">All Categories</Button>}
 >
 {isCategoriesLoading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-6">
 {[...Array(6)].map((_, i) => (
 <div key={i} className="aspect-square bg-surface-background rounded-2xl animate-pulse" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-6">
 {categories.slice(0, 6).map((category, index) => (
 <CategoryCard
 key={category.id || index}
 title={category.name}
 count={category.productCount || 0}
 iconName={category.icon}
 to={`/products?category=${encodeURIComponent(category.name)}`}
 />
 ))}
 </div>
 )}
 </HomeSection>

 {/* Featured Products */}
 <HomeSection
 title="Featured Collection"
 subtitle="Handpicked premium pieces"
 actionButton={<Button variant="outline" href="/products">View Collection</Button>}
 >
 {renderProductGrid(homeProducts.featured)}
 </HomeSection>

 {/* Trending Now */}
 <HomeSection
 title="Trending Now"
 subtitle="Most loved by our customers"
 actionButton={<Button variant="outline" href="/products?sort=popular">View All</Button>}
 >
 {renderProductGrid(homeProducts.trending)}
 </HomeSection>

 {/* New Arrivals */}
 <HomeSection
 title="New Arrivals"
 subtitle="The latest additions to our store"
 hasBackground={true}
 actionButton={<Button variant="outline" href="/products?sort=newest">Discover More</Button>}
 >
 {renderProductGrid(homeProducts.newArrivals)}
 </HomeSection>

 {/* Sale / Special Offers */}
 <HomeSection
 title="Special Offers"
 subtitle="Grab them before they're gone"
 actionButton={<Button variant="outline" href="/products?sale=true">View Sale</Button>}
 >
 {renderProductGrid(homeProducts.sale)}
 </HomeSection>

 {/* Best Sellers */}
 <HomeSection
 title="Best Sellers"
 subtitle="Our most loved furniture"
 hasBackground={true}
 actionButton={<Button variant="outline" href="/products?bestSeller=true">View all</Button>}
 >
 {renderProductGrid(homeProducts.bestSellers)}
 </HomeSection>

 {/* Newsletter Section */}
 <HomeSection>
 <div className="bg-brand-900 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
 <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-brand-800 rounded-full blur-3xl opacity-50"></div>
 <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-brand-800 rounded-full blur-3xl opacity-50"></div>

 <div className="relative z-10 max-w-2xl mx-auto">
 <h2 className="text-3xl sm:text-4xl mb-4 font-bold">Join Our Newsletter</h2>
 <p className="text-brand-100 text-lg mb-8">
 Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
 </p>
 <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
 <input
 type="email"
 placeholder="Enter your email"
 className="flex-1 px-6 py-4 rounded-full text-text-brand-600 focus:outline-none focus:ring-2 focus:ring-primary-400"
 required
 />
 <Button type="submit" size="lg" className="rounded-full px-8 shadow-lg bg-accent-500 hover:bg-accent-600 focus:ring-accent-500">
 Subscribe
 </Button>
 </form>
 </div>
 </div>
 </HomeSection>
 </div>
 );
};

export default HomePage;
