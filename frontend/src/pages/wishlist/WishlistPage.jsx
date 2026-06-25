import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductCard from '../../components/products/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { Heart } from 'lucide-react';

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
      <PageContainer className="py-20 max-w-2xl text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <Heart className="w-16 h-16 text-primary-500 mx-auto mb-6" />
          <h2 className="text-3xl font-medium text-neutral-900 mb-4">Save Your Favorites</h2>
          <p className="text-lg text-neutral-500 mb-8 max-w-md mx-auto">
            Create an account or log in to view your wishlist, save items for later, and get notified about price drops.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-md">
              Log In
            </Link>
            <Link to="/register" state={{ from: { pathname: '/wishlist' } }} className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 border border-primary-200 font-medium rounded-xl hover:bg-primary-50 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Filter out items where the product is completely missing (just in case cascade didn't run)
  const items = (wishlist?.items || []).filter(item => item.product);

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
