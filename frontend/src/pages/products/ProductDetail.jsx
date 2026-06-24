import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import ProductGallery from '../../components/ecommerce/ProductGallery';
import RatingDisplay from '../../components/ecommerce/RatingDisplay';
import QuantitySelector from '../../components/ecommerce/QuantitySelector';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import useProductStore from '../../store/productStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import ImageFallback from '../../components/ui/ImageFallback';
import { Heart, Truck, RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const { product, isLoading, error, fetchProductById } = useProductStore();
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!isAuthenticated) return alert('Please login first');
    addToCart(product.id, quantity);
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) return alert('Please login first');
    toggleWishlist(product.id);
  };

  useEffect(() => {
    if (id) {
      fetchProductById(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, fetchProductById]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <PageContainer className="py-20">
        <EmptyState 
          title="Product not found"
          message={error || "We couldn't find the product you're looking for."}
          actionLabel="Back to Shop"
          onAction={() => window.history.back()}
        />
      </PageContainer>
    );
  }

  // Mocking rating for now
  const rating = 4.8;
  const reviewsCount = 120;
  
  // Create an array of mock images since the DB only has one imageUrl right now
  const images = product.imageUrl 
    ? [product.imageUrl, 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80']
    : [];

  return (
    <PageContainer className="py-8 lg:py-12">
      
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm font-medium text-text-muted mb-8">
        <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600 transition-colors">{product.category || 'Furniture'}</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-text-primary truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 xl:gap-20 mb-20">
        
        {/* Left: Gallery */}
        <div className="w-full lg:w-[55%]">
          <ProductGallery images={images} />
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-[45%] flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl font-extrabold text-text-primary">${product.price.toFixed(2)}</span>
            <div className="w-1 h-1 rounded-full bg-secondary-300"></div>
            <RatingDisplay rating={rating} count={reviewsCount} />
          </div>

          <p className="text-lg text-text-secondary mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-6 mb-10">
            {/* Color Selector (Mock) */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Color</h3>
              <div className="flex gap-3">
                <button className="w-8 h-8 rounded-full bg-secondary-200 ring-2 ring-offset-2 ring-primary-600 focus:outline-none" aria-label="Light Grey"></button>
                <button className="w-8 h-8 rounded-full bg-text-primary ring-2 ring-offset-2 ring-transparent hover:ring-secondary-300 focus:outline-none" aria-label="Charcoal"></button>
                <button className="w-8 h-8 rounded-full bg-accent-500 ring-2 ring-offset-2 ring-transparent hover:ring-secondary-300 focus:outline-none" aria-label="Wood"></button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="w-full sm:w-auto">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">Quantity</h3>
                <QuantitySelector 
                  quantity={quantity} 
                  setQuantity={setQuantity} 
                  max={product.stock}
                  className="w-full sm:w-auto"
                />
              </div>
              
              <div className="flex-1 w-full flex gap-4">
                <Button 
                  size="lg" 
                  className="flex-1 shadow-lg hover:shadow-xl hover:-translate-y-0.5" 
                  disabled={product.stock === 0}
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
                <button 
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 shrink-0 rounded-lg border border-secondary-200 flex items-center justify-center transition-colors shadow-sm bg-surface ${
                    isWishlisted ? 'text-danger border-danger bg-danger-light' : 'text-text-secondary hover:text-danger hover:border-danger hover:bg-danger-light'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-secondary-200">
            <div className="flex items-center gap-3 text-text-secondary">
              <Truck className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Free Delivery over $299</span>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <RotateCcw className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">2-Year Warranty</span>
            </div>
          </div>

        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-20">
        <div className="flex border-b border-secondary-200 gap-8">
          {['description', 'specifications', 'shipping'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-base font-bold capitalize transition-colors relative ${
                activeTab === tab ? 'text-primary-600' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
        <div className="py-8 max-w-4xl">
          {activeTab === 'description' && (
            <div className="prose prose-secondary max-w-none text-text-secondary">
              <p className="text-lg leading-relaxed">{product.description}</p>
              <p className="mt-4 text-lg leading-relaxed">Designed with premium materials, this piece brings both comfort and elegance to your space. Perfect for modern living, it stands the test of time.</p>
            </div>
          )}
          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-text-secondary">
              <div className="flex justify-between py-3 border-b border-secondary-100">
                <span className="font-medium text-text-primary">Materials</span>
                <span>Premium Fabric, Solid Wood Frame</span>
              </div>
              <div className="flex justify-between py-3 border-b border-secondary-100">
                <span className="font-medium text-text-primary">Dimensions</span>
                <span>84" W x 38" D x 34" H</span>
              </div>
              <div className="flex justify-between py-3 border-b border-secondary-100">
                <span className="font-medium text-text-primary">Weight</span>
                <span>120 lbs</span>
              </div>
              <div className="flex justify-between py-3 border-b border-secondary-100">
                <span className="font-medium text-text-primary">Assembly</span>
                <span>Minimal assembly required</span>
              </div>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg leading-relaxed"><strong className="text-text-primary">Free Standard Delivery:</strong> 5-7 business days.</p>
              <p className="text-lg leading-relaxed"><strong className="text-text-primary">White Glove Delivery ($149):</strong> Room of choice placement, assembly, and packaging removal.</p>
              <p className="text-lg leading-relaxed mt-6"><strong className="text-text-primary">Return Policy:</strong> You can return most items for a refund or store credit within 30 days of delivery. Return shipping costs apply, and the item must be in its original condition and packaging to be accepted.</p>
            </div>
          )}
        </div>
      </div>

    </PageContainer>
  );
};

export default ProductDetail;
