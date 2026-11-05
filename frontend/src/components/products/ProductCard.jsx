import React from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import RatingDisplay from "../ecommerce/RatingDisplay";
import ImageFallback from "../ui/ImageFallback";
import Button from "../ui/Button";
import useCartStore from "../../store/cartStore";
import useWishlistStore from "../../store/wishlistStore";
import useAuthStore from "../../store/authStore";
import useSettingsStore from "../../store/settingsStore";
import { formatPrice } from "../../utils/currency";
import { getOptimizedUrl } from "../../utils/cloudinary";

const ProductCard = ({ product, previewMode = false }) => {
  if (!product) return null;

  const { addToCart, loadingProducts } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const { publicConfig } = useSettingsStore();

  const lowStockThreshold = publicConfig?.lowStockThreshold || 5;
  const isCartLoading = previewMode
    ? false
    : loadingProducts[product.id] || false;
  const isWishlisted = previewMode ? false : isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewMode) return;
    if (!isAuthenticated) return toast.error("Please login first");
    addToCart(product.id, 1, product);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (previewMode) return;
    if (!isAuthenticated) return toast.error("Please login first");
    try {
      await toggleWishlist(product.id);
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  const hasDiscount = product.discountPercentage > 0;

  return (
    <div className="group flex flex-col h-full bg-white rounded-[22px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 border border-border-light">
      {/* Image Area with Actions */}
      <div className="relative aspect-[4/3] bg-surface-background overflow-hidden rounded-t-[22px]">
        <Link
          to={`/products/${product.slug || product.id}`}
          className="block w-full h-full"
          onClick={(e) => previewMode && e.preventDefault()}
        >
          <ImageFallback
            src={getOptimizedUrl(product.thumbnail, "card")}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-750 ease-out"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && product.stock > 0 && product.active && (
            <span className="bg-[#D9383A] text-white text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
              {product.discountPercentage}% OFF
            </span>
          )}
          {product.newArrival &&
            product.stock > 0 &&
            product.active &&
            !hasDiscount && (
              <span className="bg-accent-500 text-white text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
                New
              </span>
            )}
          {product.stock <= lowStockThreshold &&
            product.stock > 0 &&
            product.active && (
              <span className="bg-warning text-white text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
                Low Stock
              </span>
            )}
          {(!product.active || product.stock === 0) && (
            <span className="bg-secondary-800 text-white text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-sm">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Action (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleToggleWishlist}
            className={`w-8 h-8 rounded-full bg-white shadow-sm hover:shadow-md flex items-center justify-center transition-all ${
              isWishlisted
                ? "text-danger-600 bg-white"
                : "text-text-secondary hover:text-danger-600 bg-white/90 hover:bg-white"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <div className="mb-1 flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-widest gap-1">
          <span className="opacity-70 truncate">
            {product.category || "Furniture"}
          </span>
          {product.brand && (
            <span className="opacity-50 truncate">{product.brand}</span>
          )}
        </div>

        <Link
          to={`/products/${product.slug || product.id}`}
          className="block mb-2 group-hover:text-brand-600 transition-colors"
          onClick={(e) => previewMode && e.preventDefault()}
        >
          <h3 className="text-sm font-bold text-text-brand-600 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <RatingDisplay
          rating={product.rating || 0}
          count={product.reviewCount || 0}
          className="mb-3"
        />

        <div className="mt-auto flex items-center justify-between gap-1 pt-3 border-t border-border-light flex-wrap xs:flex-nowrap">
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base text-text-brand-600 font-bold truncate">
              {formatPrice(product.finalPrice || product.price)}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-text-muted line-through font-medium leading-none mt-1 truncate">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="iconSm"
            onClick={handleAddToCart}
            className="rounded-full shadow-sm shrink-0 scale-90 sm:scale-100"
            isLoading={isCartLoading}
            disabled={!product.active || product.stock === 0}
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
