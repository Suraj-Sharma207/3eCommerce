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
  <PageContainer className="py-8 lg:py-12 font-normal">
    <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse mb-8 font-normal"></div>
    <ProductGrid>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 animate-pulse font-normal">
          <div className="bg-neutral-200 w-full aspect-[4/5] rounded-2xl font-normal"></div>
          <div className="space-y-2 font-normal">
            <div className="h-4 bg-neutral-200 rounded w-3/4 font-normal"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2 font-normal"></div>
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
      <PageContainer className="py-20 max-w-2xl text-center font-normal">
        <div className="bg-white rounded-3xl shadow-xl border border-border-light p-12 relative overflow-hidden font-normal">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600 font-normal"></div>
          <Heart className="w-16 h-16 text-brand-600 mx-auto mb-6 font-normal" />
          <h2 className="text-3xl text-text-primary mb-4 font-bold">Save Your Favorites</h2>
          <p className="text-lg text-text-muted mb-8 max-w-md mx-auto font-medium">
            Create an account or log in to view your wishlist, save items for later, and get notified about price drops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center font-normal">
            <Link to="/login" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-md font-normal">
              Log In
            </Link>
            <Link to="/register" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-50 transition-colors font-normal">
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
      <PageContainer className="py-20 font-normal">
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
    <PageContainer className="py-8 lg:py-12 font-normal">
      <h1 className="text-3xl lg:text-4xl text-text-brand-600 tracking-tight mb-8 font-bold">
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
