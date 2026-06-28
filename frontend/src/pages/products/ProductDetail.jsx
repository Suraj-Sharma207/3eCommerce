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
import { useBrandingStore } from '../../store/brandingStore';
import ImageFallback from '../../components/ui/ImageFallback';
import ProductCard from '../../components/products/ProductCard';
import NotifyMeModal from '../../components/products/NotifyMeModal';
import { Heart, Truck, RotateCcw, ShieldCheck, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const ProductDetail = () => {
  const { id } = useParams();
  const { product, isLoading, error, fetchProductById } = useProductStore();
  const { addToCart, loadingProducts } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { branding } = useBrandingStore();
  
  const isCartLoading = product ? (loadingProducts[product.id] || false) : false;
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    if (!isAuthenticated) return alert('Please login first');
    addToCart(product.id, quantity, product.name);
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

  useEffect(() => {
    const checkSubscription = async () => {
      if (isAuthenticated && product && (!product.active || product.stock === 0)) {
        try {
          const { default: api } = await import('../../services/api');
          const res = await api.get(`/products/${product.id}/notify/status`);
          setIsSubscribed(res.data.data.isSubscribed);
        } catch (err) {
          // Silent fail for non-critical status check
        }
      }
    };
    checkSubscription();
  }, [product, isAuthenticated]);

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

  const rating = product.rating || 0;
  const reviewsCount = product.reviewCount || 0;
  
  const images = product.galleryImages?.length > 0
    ? [product.thumbnail, ...product.galleryImages].filter(Boolean)
    : [product.thumbnail].filter(Boolean);

  return (
    <PageContainer className="py-8 lg:py-12">
      
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm font-medium text-text-muted mb-8">
        <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link to={`/products?category=${product.category}`} className="hover:text-brand-600 transition-colors">{product.category || 'Furniture'}</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-text-brand-600 truncate">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-12 xl:gap-20 mb-20">
        
        {/* Left: Gallery */}
        <div className="w-full lg:w-[55%]">
          <ProductGallery images={images} />
        </div>

        {/* Right: Product Info */}
        <div className="w-full lg:w-[45%] flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-brand-600 tracking-tight mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-text-brand-600">
                {formatPrice(product.finalPrice || product.price)}
              </span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="text-lg text-text-muted line-through font-medium">
                    {formatPrice(product.price)}
                  </span>
                  <span className="bg-danger-50 text-danger-700 border border-danger-200 text-xs font-bold px-2 py-1 rounded">
                    {product.discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="w-1 h-1 rounded-full bg-secondary-300"></div>
            <RatingDisplay rating={rating} count={reviewsCount} />
          </div>

          <p className="text-lg text-text-secondary mb-8 leading-relaxed">
            {product.description}
          </p>

          {(!product.active || product.stock === 0) ? (
            <div className="space-y-6 mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger-50 text-danger-700 rounded-full mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Out of Stock</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {isSubscribed ? (
                  <div className="flex-1 w-full">
                    <Button 
                      size="lg" 
                      className="w-full shadow-md bg-success-600 hover:bg-success-700 text-white border-none cursor-default opacity-90"
                      disabled
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        You're Notified
                      </span>
                    </Button>
                    <p className="text-sm text-text-secondary text-center mt-3">
                      We'll notify you by email when this product is back in stock.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <Button 
                      size="lg" 
                      className="w-full shadow-md"
                      onClick={() => setIsNotifyModalOpen(true)}
                    >
                      Notify Me When Available
                    </Button>
                  </div>
                )}
                <button 
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 shrink-0 rounded-lg border border-border flex items-center justify-center transition-colors shadow-sm bg-surface ${
                    isWishlisted ? 'text-danger-600 border-danger-600 bg-danger-50' : 'text-text-secondary hover:text-danger-600 hover:border-danger-600 hover:bg-danger-50'
                  }`}
                  aria-label="Add to wishlist"
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              <NotifyMeModal 
                isOpen={isNotifyModalOpen}
                onClose={() => setIsNotifyModalOpen(false)}
                productId={product.id}
                productName={product.name}
                onSuccess={() => setIsSubscribed(true)}
              />
            </div>
          ) : (
            <div className="space-y-6 mb-10">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:w-auto">
                  <h3 className="text-sm font-bold text-text-brand-600 uppercase tracking-wider mb-3">Quantity</h3>
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
                    onClick={handleAddToCart}
                    isLoading={isCartLoading}
                  >
                    Add to Cart
                  </Button>
                  <button 
                    onClick={handleToggleWishlist}
                    className={`w-14 h-14 shrink-0 rounded-lg border border-border flex items-center justify-center transition-colors shadow-sm bg-surface ${
                      isWishlisted ? 'text-danger-600 border-danger-600 bg-danger-50' : 'text-text-secondary hover:text-danger-600 hover:border-danger-600 hover:bg-danger-50'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-border">
            <div className="flex items-center gap-3 text-text-secondary">
              <Truck className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">Free Delivery over {formatPrice(4999)}</span>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <RotateCcw className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">30-Day Returns</span>
            </div>
            <div className="flex items-center gap-3 text-text-secondary">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium">2-Year Warranty</span>
            </div>
          </div>

        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-20">
        <div className="flex border-b border-border gap-8 overflow-x-auto hide-scrollbar whitespace-nowrap">
          {['description', 'specifications', 'shipping', 'returns', 'warranty', 'care instructions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-base font-bold capitalize transition-colors relative flex-shrink-0 ${
                activeTab === tab ? 'text-brand-600' : 'text-text-secondary hover:text-text-brand-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></span>
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
              <div className="flex justify-between py-3 border-b border-border-light">
                <span className="font-medium text-text-brand-600">Materials</span>
                <span>Premium Fabric, Solid Wood Frame</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border-light">
                <span className="font-medium text-text-brand-600">Brand</span>
                <span>{product.brand || branding?.platformName || 'LuxeHome'}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border-light">
                <span className="font-medium text-text-brand-600">SKU</span>
                <span>{product.sku}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border-light">
                <span className="font-medium text-text-brand-600">Assembly</span>
                <span>Minimal assembly required</span>
              </div>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg leading-relaxed"><strong className="text-text-brand-600">Free Standard Delivery:</strong> 5-7 business days.</p>
              <p className="text-lg leading-relaxed"><strong className="text-text-brand-600">White Glove Delivery ({formatPrice(1499)}):</strong> Room of choice placement, assembly, and packaging removal.</p>
            </div>
          )}
          {activeTab === 'returns' && (
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg leading-relaxed"><strong className="text-text-brand-600">Return Policy:</strong> You can return most items for a refund or store credit within 30 days of delivery. Return shipping costs apply, and the item must be in its original condition and packaging to be accepted.</p>
            </div>
          )}
          {activeTab === 'warranty' && (
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg leading-relaxed"><strong className="text-text-brand-600">2-Year Limited Warranty:</strong> Covers manufacturing defects in materials and workmanship under normal use. Does not cover normal wear and tear, or accidental damage.</p>
            </div>
          )}
          {activeTab === 'care instructions' && (
            <div className="space-y-4 text-text-secondary">
              <p className="text-lg leading-relaxed"><strong className="text-text-brand-600">Care:</strong> Dust regularly with a soft, dry cloth. Avoid direct sunlight to prevent fading. Wipe up spills immediately with a damp cloth.</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts productId={product.id} />

    </PageContainer>
  );
};

const RelatedProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const { default: api } = await import('../../services/api');
        const response = await api.get(`/products/${productId}/related?limit=4`);
        setProducts(response.data.data.products);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelated();
  }, [productId]);

  if (isLoading || products.length === 0) return null;

  return (
    <div className="border-t border-border pt-16 mt-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-brand-600">You Might Also Like</h2>
          <p className="text-text-secondary mt-1">Recommended products in the same category</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;
