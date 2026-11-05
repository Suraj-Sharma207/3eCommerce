import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageContainer from "../../components/layout/PageContainer";
import useCartStore from "../../store/cartStore";
import useAuthStore from "../../store/authStore";
import useSettingsStore from "../../store/settingsStore";
import useConfirmStore from "../../store/confirmStore";
import { calculateShipping } from "../../utils/shipping";

import CartHeader from "../../components/cart/CartHeader";
import ShippingProgress from "../../components/cart/ShippingProgress";
import CartItemCard from "../../components/cart/CartItemCard";
import CouponCard from "../../components/cart/CouponCard";
import OrderSummary from "../../components/cart/OrderSummary";
import RecommendedSlider from "../../components/cart/RecommendedSlider";
import UndoSnackbar from "../../components/cart/UndoSnackbar";
import Button from "../../components/ui/Button";

import {
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Headphones,
  Trash2,
} from "lucide-react";

/* ── Benefits strip (4 cells, dividers between them) ─── */
const BENEFITS = [
  { icon: Truck, title: "Free Delivery", sub: "Orders above ₹999" },
  { icon: RotateCcw, title: "Easy Returns", sub: "Within 30 days" },
  { icon: ShieldCheck, title: "2-Year Warranty", sub: "On all products" },
  { icon: Headphones, title: "Dedicated Support", sub: "We're here to help" },
];

const BenefitsStrip = () => (
  <div className="mt-4 flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-x divide-slate-200">
    {BENEFITS.map(({ icon: Icon, title, sub }) => (
      <div
        key={title}
        className="flex-1 flex flex-col items-center text-center py-4 px-2 gap-2"
      >
        {/* Circular outline icon */}
        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white">
          <Icon
            className="text-[#1B2340]"
            style={{ width: 18, height: 18 }}
            strokeWidth={1.5}
          />
        </div>
        <div>
          <p className="text-xs text-slate-700">{title}</p>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            {sub}
          </p>
        </div>
      </div>
    ))}
  </div>
);

/* ── Loading skeleton ──────────────────────────────────── */
const CartSkeleton = () => (
  <PageContainer className="py-8 lg:py-12">
    <div className="h-9 bg-slate-200 rounded animate-pulse mb-8" />
    <div className="flex flex-col lg:flex-row gap-7">
      <div className="flex-1 space-y-4">
        <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
      <div className="w-full lg:w-[320px] shrink-0 space-y-4">
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  </PageContainer>
);

/* ── Main ──────────────────────────────────────────────── */
const CartPage = () => {
  const {
    cart,
    isLoading,
    updatingItemIds,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { publicConfig } = useSettingsStore();
  const { confirm } = useConfirmStore();
  const navigate = useNavigate();

  const [pendingRemovalItem, setPendingRemovalItem] = useState(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  /* Unauthenticated */
  if (!isAuthenticated) {
    return (
      <PageContainer className="py-20 max-w-xl text-center">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1B2340] to-[#3a4a80]" />
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag
              className="w-10 h-10 text-[#1B2340]"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="text-2xl text-[#1B2340] mb-3 font-bold">
            Your Shopping Cart
          </h2>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed text-sm">
            Log in to view your cart and checkout securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() =>
                navigate("/login", { state: { from: { pathname: "/cart" } } })
              }
              className="px-8 bg-[#1B2340] hover:bg-[#252f52] border-none rounded-xl"
            >
              Log In
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate("/register", {
                  state: { from: { pathname: "/cart" } },
                })
              }
              className="px-8 border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Create Account
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const rawCartItems = cart?.items || [];
  const cartProductIds = useMemo(
    () => rawCartItems.map((i) => i.productId),
    [rawCartItems],
  );
  const cartItems = useMemo(
    () =>
      rawCartItems.filter(
        (item) =>
          item.product &&
          (!pendingRemovalItem || pendingRemovalItem.id !== item.id),
      ),
    [rawCartItems, pendingRemovalItem],
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) =>
          acc + (item.product.finalPrice || item.product.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const discountAmount = (subtotal * couponDiscountPercent) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const shippingInfo = calculateShipping(discountedSubtotal, publicConfig);
  const shipping = cartItems.length > 0 ? shippingInfo.fee : 0;
  const total = discountedSubtotal + (shipping === -1 ? 0 : shipping);
  const hasUnavailableItems = cartItems.some(
    (item) => !item.product.active || item.product.stock === 0,
  );

  const handleRemoveClick = (productId) => {
    const itemToRemove = cartItems.find((item) => item.productId === productId);
    if (!itemToRemove) return;
    if (pendingRemovalItem) removeFromCart(pendingRemovalItem.productId);
    setPendingRemovalItem(itemToRemove);
  };
  const handleConfirmRemoval = (item) => {
    if (pendingRemovalItem?.id === item.id) {
      removeFromCart(item.productId);
      setPendingRemovalItem(null);
    }
  };
  const handleUndoRemoval = (item) => {
    if (pendingRemovalItem?.id === item.id) setPendingRemovalItem(null);
  };
  const handleClearAll = async () => {
    const isConfirmed = await confirm({
      title: "Clear Cart",
      description: "Are you sure you want to remove all items from your cart?",
      variant: "danger",
      confirmText: "Clear Cart",
    });
    if (isConfirmed) {
      await clearCart();
      setPendingRemovalItem(null);
    }
  };

  /* Loading */
  if (isLoading && cartItems.length === 0) return <CartSkeleton />;

  /* Empty */
  if (!isLoading && cartItems.length === 0 && !pendingRemovalItem) {
    return (
      <PageContainer className="py-12">
        <div className="flex flex-col items-center text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm mb-10">
          <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-14 h-14 text-slate-300" strokeWidth={1} />
          </div>
          <h2 className="text-3xl text-[#1B2340] mb-3 font-bold">
            Your cart is empty
          </h2>
          <p className="text-slate-500 mb-8 max-w-sm text-sm leading-relaxed">
            Looks like you haven't added anything yet. Explore our collection!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/products")}
              className="px-8 bg-[#1B2340] hover:bg-[#252f52] border-none rounded-xl font-bold shadow-md"
            >
              Start Shopping
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/collections")}
              className="px-8 border-slate-200 hover:bg-slate-50 rounded-xl font-bold"
            >
              Browse Collections
            </Button>
          </div>
        </div>
        <RecommendedSlider currentCartItemIds={cartProductIds} />
      </PageContainer>
    );
  }

  /* Main cart */
  return (
    <div className="min-h-screen bg-white">
      <PageContainer className="py-8 lg:py-10">
        <CartHeader itemCount={cartItems.length} />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ── Left column (~68%) ── */}
          <div className="flex-1 min-w-0">
            {/* Shipping progress */}
            <ShippingProgress
              subtotal={discountedSubtotal}
              threshold={shippingInfo.threshold}
            />

            {/* Cart Items card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-800">
                  Cart Items ({cartItems.length})
                </h2>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors focus:outline-none"
                >
                  Clear All
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Items */}
              <AnimatePresence initial={false}>
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    isUpdating={updatingItemIds?.has(item.productId)}
                    onUpdateQuantity={updateQuantity}
                    onRemove={handleRemoveClick}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Benefits strip */}
            <BenefitsStrip />
          </div>

          {/* ── Right column (~32%) ── */}
          <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0">
            <CouponCard
              onApplyCoupon={(pct) => setCouponDiscountPercent(pct)}
            />
            <OrderSummary
              itemCount={cartItems.length}
              subtotal={subtotal}
              shipping={shipping}
              discount={discountAmount}
              total={total}
              hasUnavailableItems={hasUnavailableItems}
            />
          </div>
        </div>

        {/* Recommended */}
        <RecommendedSlider currentCartItemIds={cartProductIds} />

        <UndoSnackbar
          item={pendingRemovalItem}
          onUndo={handleUndoRemoval}
          onConfirmRemoval={handleConfirmRemoval}
        />
      </PageContainer>
    </div>
  );
};

export default CartPage;
