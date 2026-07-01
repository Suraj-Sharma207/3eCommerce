import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer';
import ProductGallery from '../../components/ecommerce/ProductGallery';
import RatingDisplay from '../../components/ecommerce/RatingDisplay';
import QuantityStepper from '../../components/ecommerce/QuantityStepper';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useProductStore from '../../store/productStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import useAuthStore from '../../store/authStore';
import { useBrandingStore } from '../../store/brandingStore';
import useSettingsStore from '../../store/settingsStore';
import ProductCard from '../../components/products/ProductCard';
import NotifyMeModal from '../../components/products/NotifyMeModal';
import {
  Heart, Truck, RotateCcw, ShieldCheck, ChevronRight,
  AlertTriangle, CheckCircle2, Wrench, CreditCard, Headphones,
  Package, Sparkles, Package2, Star, FileText
} from 'lucide-react';
import { formatPrice } from '../../utils/currency';

/* ──────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────── */
const getProductBadge = (p) => {
  if (!p) return null;
  if (!p.active || p.stock === 0) return null; // stock badge handles this
  if (p.stock > 0 && p.stock <= 5)           return { label: 'Low Stock',   cls: 'bg-amber-100 text-amber-700' };
  if (p.isBestSeller || p.bestSeller)         return { label: 'Bestseller',  cls: 'bg-emerald-100 text-emerald-700' };
  if (p.isTrending   || p.trending)           return { label: 'Trending',    cls: 'bg-violet-100 text-violet-700' };
  if (p.isNewArrival || p.newArrival)         return { label: 'New Arrival', cls: 'bg-blue-100 text-blue-700' };
  if (p.discountPercentage > 15)              return { label: `${p.discountPercentage}% OFF`, cls: 'bg-red-100 text-red-600' };
  return null;
};

/* ──────────────────────────────────────────────────────
   Page-level skeleton
────────────────────────────────────────────────────── */
const DetailSkeleton = () => (
  <PageContainer className="py-8 lg:py-12">
    <div className="h-4 w-56 bg-slate-200 rounded animate-pulse mb-8" />
    <div className="flex flex-col lg:flex-row gap-10 xl:gap-14">
      <div className="w-full lg:w-[48%] space-y-3 animate-pulse">
        <div className="aspect-square bg-slate-200 rounded-2xl" />
        <div className="flex gap-2">{[1,2,3].map(i=><div key={i} className="w-16 h-16 bg-slate-200 rounded-xl"/>)}</div>
      </div>
      <div className="flex-1 space-y-4 animate-pulse pt-2">
        <div className="h-5 w-24 bg-slate-200 rounded-full" />
        <div className="h-9 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-52 bg-slate-200 rounded" />
        <div className="h-8 w-40 bg-slate-200 rounded" />
        <div className="h-px bg-slate-200" />
        <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-4 bg-slate-200 rounded" style={{width:`${90-i*10}%`}} />)}</div>
        <div className="h-12 bg-slate-200 rounded-xl w-full" />
        <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-200 rounded-2xl"/>)}</div>
      </div>
    </div>
  </PageContainer>
);

/* ──────────────────────────────────────────────────────
   Tab Section (matches reference: 3-col layout inside)
────────────────────────────────────────────────────── */
const TABS = ['Description', 'Specifications', 'Shipping', 'Returns', 'Warranty', 'Care Instructions'];

const TabIcons = {
  Description:      FileText,
  Specifications:   Package2,
  Shipping:         Truck,
  Returns:          RotateCcw,
  Warranty:         ShieldCheck,
  'Care Instructions': Sparkles,
};

const TabSection = ({ product, publicConfig, relatedProducts, relatedLoading }) => {
  const [activeTab, setActiveTab] = useState('Description');

  const specs = [
    product.brand       && ['Brand',       product.brand],
    product.material    && ['Material',    product.material],
    product.finish      && ['Frame Finish',product.finish],
    product.shape       && ['Shape',       product.shape],
    product.mountType   && ['Mount Type',  product.mountType],
    product.dimensions  && ['Dimensions',  product.dimensions],
    product.weight      && ['Weight',      product.weight],
    product.color       && ['Color',       product.color],
    product.sku         && ['SKU',         product.sku],
    product.category    && ['Category',    product.category],
  ].filter(Boolean);

  const highlights = product.features?.length > 0
    ? product.features
    : [
        'Premium materials ensuring lasting quality',
        'Designed to complement any modern interior',
        'Engineered for everyday comfort & durability',
        'Easy to install with included hardware',
      ];

  const freeShipping = publicConfig?.shipping?.freeShippingThreshold;

  return (
    <div className="border-t border-slate-200">
      {/* Tab bar */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = TabIcons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-5 py-4 text-sm font-semibold whitespace-nowrap shrink-0 relative transition-colors focus:outline-none
                ${activeTab === tab ? 'text-[#1B2340]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1B2340] rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content area — 3 column layout matching reference */}
      <div className="py-8">
        {activeTab === 'Description' && (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1.4fr] gap-8 xl:gap-12">
            {/* Left: Description + bullets */}
            <div className="space-y-5">
              <p className="text-slate-600 leading-relaxed text-sm">{product.description}</p>
              <ul className="space-y-2.5 mt-4">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-600">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Middle: Key specs table */}
            <div>
              {specs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {specs.map(([label, value]) => (
                    <div key={label} className="flex justify-between py-3">
                      <span className="text-sm text-slate-500 font-medium">{label}</span>
                      <span className="text-sm text-slate-800 font-medium text-right ml-4">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No specifications available.</p>
              )}
            </div>

            {/* Right: You may also like */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-4">You may also like</h3>
              {relatedLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
              ) : relatedProducts.length === 0 ? null : (
                <div className="space-y-3">
                  {relatedProducts.slice(0, 3).map(p => (
                    <Link key={p.id} to={`/products/${p.slug || p.id}`} className="flex gap-3 group">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-xs font-semibold text-slate-700 truncate leading-snug group-hover:text-[#1B2340] transition-colors">{p.name}</p>
                        <p className="text-xs font-bold text-[#1B2340] mt-1">{formatPrice(p.finalPrice || p.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Specifications' && (
          <div className="max-w-2xl border border-slate-100 rounded-2xl overflow-hidden">
            {specs.length > 0 ? specs.map(([label, value], i) => (
              <div key={label} className={`flex items-center justify-between px-6 py-4 ${i%2===0?'bg-white':'bg-slate-50'}`}>
                <span className="text-sm font-semibold text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            )) : (
              <div className="px-6 py-8 text-slate-400 text-sm text-center">No specifications available for this product.</div>
            )}
          </div>
        )}

        {activeTab === 'Shipping' && (
          <div className="max-w-2xl space-y-4">
            {[
              { icon: Truck,   title: 'Free Standard Delivery', body: `${freeShipping ? `Complimentary on orders over ${formatPrice(freeShipping)}.` : 'Complimentary on qualifying orders.'} Estimated 5–7 business days.` },
              { icon: Package, title: `White Glove Delivery — ${formatPrice(1499)}`, body: 'Room-of-choice placement, full assembly, and packaging removal.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1B2340]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Returns' && (
          <div className="max-w-2xl">
            <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5 text-[#1B2340]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">30-Day Return Policy</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Return most items within 30 days of delivery for a full refund or store credit. Items must be in original condition and packaging. Return shipping charges apply.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Warranty' && (
          <div className="max-w-2xl">
            <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#1B2340]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">2-Year Limited Warranty</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">Covers manufacturing defects under normal use. Does not cover normal wear and tear or accidental damage. Contact support to initiate a claim.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Care Instructions' && (
          <div className="max-w-2xl">
            <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#1B2340]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Care & Maintenance</p>
                <ul className="text-sm text-slate-500 mt-2 space-y-1.5 leading-relaxed">
                  <li>• Dust regularly with a soft, dry cloth.</li>
                  <li>• Avoid direct sunlight to prevent fading or warping.</li>
                  <li>• Wipe spills immediately with a damp cloth.</li>
                  <li>• Do not use abrasive cleaners or harsh chemicals.</li>
                  <li>• Use furniture pads to protect floors from scratches.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────
   Main Component
────────────────────────────────────────────────────── */
const ProductDetail = () => {
  const { id } = useParams();
  const { product, isLoading, error, fetchProductById } = useProductStore();
  const { addToCart, loadingProducts } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { branding } = useBrandingStore();
  const { publicConfig } = useSettingsStore();

  const isCartLoading = product ? (loadingProducts[product.id] || false) : false;
  const [quantity, setQuantity] = useState(1);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  const isWishlisted = product ? isInWishlist(product.id) : false;
  const isOutOfStock = product && (!product.active || product.stock === 0);

  const handleAddToCart = () => {
    if (!isAuthenticated) return toast.error('Please login first');
    addToCart(product.id, quantity, product.name);
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) return toast.error('Please login first');
    toggleWishlist(product.id);
  };

  useEffect(() => {
    if (id) {
      fetchProductById(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, fetchProductById]);

  // Fetch related products once product loads
  useEffect(() => {
    if (!product?.id) return;
    const fetchRelated = async () => {
      setRelatedLoading(true);
      try {
        const { default: api } = await import('../../services/api');
        const res = await api.get(`/products/${product.id}/related?limit=5`);
        setRelatedProducts(res.data.data.products || []);
      } catch { setRelatedProducts([]); }
      finally { setRelatedLoading(false); }
    };
    fetchRelated();
  }, [product?.id]);

  useEffect(() => {
    const check = async () => {
      if (isAuthenticated && product && isOutOfStock) {
        try {
          const { default: api } = await import('../../services/api');
          const res = await api.get(`/products/${product.id}/notify/status`);
          setIsSubscribed(res.data.data.isSubscribed);
        } catch { /* silent */ }
      }
    };
    check();
  }, [product, isAuthenticated, isOutOfStock]);

  if (isLoading) return <DetailSkeleton />;

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

  const images = product.galleryImages?.length > 0
    ? [product.thumbnail, ...product.galleryImages].filter(Boolean)
    : [product.thumbnail].filter(Boolean);

  const badge = getProductBadge(product);
  const isInStock = product.active && product.stock > 0;
  const savings = product.discountPercentage > 0 ? (product.price - (product.finalPrice || product.price)) : 0;
  const freeShipping = publicConfig?.shipping?.freeShippingThreshold;

  return (
    <div className="min-h-screen bg-white">
      <PageContainer className="py-6 lg:py-10">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-8 flex-wrap">
          <Link to="/" className="hover:text-[#1B2340] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category}`} className="hover:text-[#1B2340] transition-colors capitalize">{product.category || 'Furniture'}</Link>
          <ChevronRight className="w-3 h-3" />
          {product.subcategory && <>
            <Link to={`/products?category=${product.subcategory}`} className="hover:text-[#1B2340] transition-colors capitalize">{product.subcategory}</Link>
            <ChevronRight className="w-3 h-3" />
          </>}
          <span className="text-slate-600 truncate max-w-[220px]">{product.name}</span>
        </nav>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-14 mb-12">

          {/* Left: Gallery (48%) */}
          <div className="w-full lg:w-[48%] shrink-0">
            <ProductGallery images={images} />
          </div>

          {/* Right: Product Info — sticky on desktop */}
          <div className="flex-1">
            <div className="lg:sticky lg:top-24">

              {/* Product badge */}
              {badge && (
                <div className="mb-3">
                  <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              )}

              {/* Product name */}
              <h1 className="text-3xl sm:text-[2.1rem] font-extrabold text-[#1B2340] leading-tight tracking-tight mb-3">
                {product.name}
              </h1>

              {/* Rating + SKU */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-5">
                <RatingDisplay rating={product.rating || 0} count={product.reviewCount || 0} />
                {product.sku && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span>SKU: <span className="font-mono text-slate-500">{product.sku}</span></span>
                  </>
                )}
              </div>

              {/* Price row + In Stock badge */}
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#1B2340]">
                    {formatPrice(product.finalPrice || product.price)}
                  </span>
                  {product.discountPercentage > 0 && (
                    <span className="text-lg text-slate-400 line-through font-medium">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
                {isInStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Savings + GST note */}
              {savings > 0 && (
                <p className="text-xs text-emerald-600 font-semibold mb-1">
                  You save {formatPrice(savings)} on this order
                </p>
              )}
              <p className="text-xs text-slate-400 mb-1">Inclusive of all taxes (GST)</p>
              {(product.finalPrice || product.price) >= 3000 && (
                <p className="text-xs text-[#1B2340] font-semibold mb-4">
                  ✦ EMI from {formatPrice(Math.round((product.finalPrice || product.price) / 12))}/month available
                </p>
              )}

              {/* Divider */}
              <div className="h-px bg-slate-200 my-5" />

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-5 max-w-md">
                {product.description}
              </p>

              {/* Divider */}
              <div className="h-px bg-slate-200 my-5" />

              {/* Purchase area */}
              {isOutOfStock ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      {isSubscribed ? (
                        <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 border-none cursor-default" disabled>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          You're Notified
                        </Button>
                      ) : (
                        <Button size="lg" className="w-full" onClick={() => setIsNotifyModalOpen(true)}>
                          Notify Me When Available
                        </Button>
                      )}
                    </div>
                    <button
                      onClick={handleToggleWishlist}
                      aria-label="Wishlist"
                      className={`w-14 h-14 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200 focus:outline-none
                        ${isWishlisted ? 'border-red-400 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-400 hover:border-red-300 hover:text-red-400 hover:bg-red-50'}`}
                    >
                      <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  {isSubscribed && (
                    <p className="text-xs text-slate-400">We'll notify you by email when this product is back in stock.</p>
                  )}
                  <NotifyMeModal
                    isOpen={isNotifyModalOpen}
                    onClose={() => setIsNotifyModalOpen(false)}
                    productId={product.id}
                    productName={product.name}
                    onSuccess={() => setIsSubscribed(true)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quantity label */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Quantity</p>
                    <div className="flex items-center gap-3">
                      <QuantityStepper quantity={quantity} setQuantity={setQuantity} min={1} max={product.stock} />
                      <Button
                        size="lg"
                        onClick={handleAddToCart}
                        isLoading={isCartLoading}
                        className="flex-1 bg-[#1B2340] hover:bg-[#252f50] border-none text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-bold"
                      >
                        Add to Cart
                      </Button>
                      <button
                        onClick={handleToggleWishlist}
                        aria-label="Wishlist"
                        className={`w-14 h-14 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all duration-200 focus:outline-none
                          ${isWishlisted ? 'border-red-400 bg-red-50 text-red-500' : 'border-slate-200 bg-white text-slate-400 hover:border-red-300 hover:text-red-400 hover:bg-red-50'}`}
                      >
                        <Heart className={`w-5 h-5 transition-transform duration-200 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Benefits strip ── */}
              <div className="flex items-stretch mt-6 border border-slate-200 rounded-2xl overflow-hidden divide-x divide-slate-200 bg-slate-50">
                {[
                  { icon: Truck,       title: 'Free Delivery',  sub: freeShipping ? `Over ${formatPrice(freeShipping)}` : 'On qualifying orders' },
                  { icon: RotateCcw,   title: '30-Day Returns', sub: 'No questions asked' },
                  { icon: ShieldCheck, title: '2-Year Warranty',sub: 'On all products' },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex-1 flex flex-col items-center text-center gap-2 py-4 px-2">
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#1B2340]" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight">{title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── Tabs Section ── */}
        <TabSection
          product={product}
          publicConfig={publicConfig}
          branding={branding}
          relatedProducts={relatedProducts}
          relatedLoading={relatedLoading}
        />

        {/* ── Bottom trust bar ── */}
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: CreditCard,   title: 'Secure Checkout',    sub: '100% protected payments' },
              { icon: Star,         title: 'Premium Quality',     sub: 'Crafted to last' },
              { icon: Wrench,       title: 'Easy Installation',   sub: 'Mounting kit included' },
              { icon: Headphones,   title: 'Customer Support',    sub: 'We\'re here to help' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1B2340]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </PageContainer>
    </div>
  );
};

export default ProductDetail;
