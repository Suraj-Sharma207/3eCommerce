import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';

const WishlistPage = () => {
  const { wishlist, isLoading, fetchWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <PageContainer className="py-20">
        <EmptyState 
          title="Please log in"
          message="You need to be logged in to view your wishlist."
          actionLabel="Log In"
          actionLink="/login"
        />
      </PageContainer>
    );
  }

  const items = wishlist?.items || [];

  if (!isLoading && items.length === 0) {
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
      <h1 className="text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight mb-8">
        My Wishlist <span className="text-text-muted text-xl font-medium ml-2">({items.length})</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {items.map((item) => (
          <ProductCard key={item.productId} product={item.product} />
        ))}
      </div>
    </PageContainer>
  );
};

export default WishlistPage;
