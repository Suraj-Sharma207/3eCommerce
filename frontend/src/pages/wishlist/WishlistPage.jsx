import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import ProductGrid from '../../components/products/ProductGrid';
import EmptyState from '../../components/ui/EmptyState';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { Heart } from 'lucide-react';

const WishlistSkeleton = () => (
  <PageContainer className="py-8 lg:py-12">
    <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse mb-8"></div>
    <ProductGrid>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 animate-pulse">
          <div className="bg-neutral-200 w-full aspect-[4/5] rounded-2xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </ProductGrid>
  </PageContainer>
);

const WishlistPage = () => {
  const { wishlist, hasFetched, fetchWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <PageContainer className="py-20 max-w-2xl text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-border-light p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <Heart className="w-16 h-16 text-brand-600 mx-auto mb-6" />
          <h2 className="text-3xl font-medium text-text-primary mb-4">Save Your Favorites</h2>
          <p className="text-lg text-text-muted mb-8 max-w-md mx-auto">
            Create an account or log in to view your wishlist, save items for later, and get notified about price drops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-md">
              Log In
            </Link>
            <Link to="/register" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand-600 border border-brand-200 font-medium rounded-xl hover:bg-brand-50 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Filter out items where the product is completely missing (just in case cascade didn't run)
  const items = (wishlist?.items || []).filter(item => item.product);

  if (!hasFetched) {
    return <WishlistSkeleton />;
  }

  if (items.length === 0) {
    return (
      <PageContainer className="py-20">
        <EmptyState
          title="Your wishlist is empty"
          message="Save your favorite items here to review them later."
          actionLabel="Explore Products"
          actionLink="/products"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12">
      <h1 className="text-3xl lg:text-4xl font-extrabold text-text-brand-600 tracking-tight mb-8">
        My Wishlist <span className="text-text-muted text-xl font-medium ml-2">({items.length})</span>
      </h1>

      <ProductGrid>
        {items.map((item) => (
          <ProductCard key={item.productId} product={item.product} />
        ))}
      </ProductGrid>
    </PageContainer>
  );
};

export default WishlistPage;
