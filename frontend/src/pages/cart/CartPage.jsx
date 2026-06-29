import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../../components/layout/PageContainer';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useSettingsStore from '../../store/settingsStore';
import { calculateShipping } from '../../utils/shipping';

// New Components
import CartHeader from '../../components/cart/CartHeader';
import ShippingProgress from '../../components/cart/ShippingProgress';
import CartItemCard from '../../components/cart/CartItemCard';
import CouponCard from '../../components/cart/CouponCard';
import OrderSummary from '../../components/cart/OrderSummary';
import RecommendedSlider from '../../components/cart/RecommendedSlider';
import UndoSnackbar from '../../components/cart/UndoSnackbar';

// SVGs and Icons
import { ShoppingBag } from 'lucide-react';
import Button from '../../components/ui/Button';

const CartPage = () => {
  const { cart, isLoading, updatingItemIds, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { publicConfig } = useSettingsStore();
  const navigate = useNavigate();

  // Local state for undo/removal
  const [pendingRemovalItem, setPendingRemovalItem] = useState(null);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);



  // Unauthenticated Empty State
  if (!isAuthenticated) {
    return (
      <PageContainer className="py-20 max-w-2xl text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-border-light p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-3xl font-medium text-text-primary mb-4">Your Shopping Cart</h2>
          <p className="text-lg text-text-muted mb-8 max-w-md mx-auto">
            Log in to view your cart, see saved items, and proceed to checkout securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/login', { state: { from: { pathname: '/cart' } } })} className="px-8 shadow-md">
              Log In
            </Button>
            <Button variant="outline" onClick={() => navigate('/register', { state: { from: { pathname: '/cart' } } })} className="px-8">
              Create Account
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const rawCartItems = cart?.items || [];
  
  const cartProductIds = useMemo(() => {
    return rawCartItems.map(i => i.productId);
  }, [rawCartItems]);
  
  // Exclude items that are fully missing their product or currently pending removal
  const cartItems = useMemo(() => {
    return rawCartItems.filter(item => 
      item.product && 
      (!pendingRemovalItem || pendingRemovalItem.id !== item.id)
    );
  }, [rawCartItems, pendingRemovalItem]);

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemPrice = item.product.finalPrice || item.product.price;
      return acc + (itemPrice * item.quantity);
    }, 0);
  }, [cartItems]);
  
  const discountAmount = (subtotal * couponDiscountPercent) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  
  const shippingInfo = calculateShipping(discountedSubtotal, publicConfig);
  const shipping = cartItems.length > 0 ? shippingInfo.fee : 0; 
  const total = discountedSubtotal + (shipping === -1 ? 0 : shipping);

  const hasUnavailableItems = cartItems.some(item => !item.product.active || item.product.stock === 0);

  // Handlers
  const handleRemoveClick = (productId) => {
    const itemToRemove = cartItems.find(item => item.productId === productId);
    if (!itemToRemove) return;
    
    // If there is already a pending item, commit it immediately before setting the new one
    if (pendingRemovalItem) {
      removeFromCart(pendingRemovalItem.productId);
    }
    
    setPendingRemovalItem(itemToRemove);
  };

  const handleConfirmRemoval = (item) => {
    if (pendingRemovalItem && pendingRemovalItem.id === item.id) {
      removeFromCart(item.productId);
      setPendingRemovalItem(null);
    }
  };

  const handleUndoRemoval = (item) => {
    if (pendingRemovalItem && pendingRemovalItem.id === item.id) {
      setPendingRemovalItem(null); // Just cancel it, it was never removed from backend
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to remove all items from your cart?')) {
      await clearCart();
      setPendingRemovalItem(null);
    }
  };

  // Empty State
  if (!isLoading && cartItems.length === 0 && !pendingRemovalItem) {
    return (
      <PageContainer className="py-12">
        <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-3xl border border-border shadow-sm mb-12">
          <div className="w-32 h-32 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-brand-300" strokeWidth={1} />
          </div>
          <h2 className="text-3xl font-extrabold text-text-primary mb-3">Your cart is empty.</h2>
          <p className="text-text-secondary mb-8 max-w-sm">
            Looks like you haven't added anything to your cart yet. Let's get you started!
          </p>
          <Button onClick={() => navigate('/products')} className="px-8 rounded-full text-base font-bold shadow-md">
            Continue Shopping
          </Button>
        </div>
        
        <RecommendedSlider currentCartItemIds={cartProductIds} />
      </PageContainer>
    );
  }

  // Loading Skeletons
  if (isLoading && cartItems.length === 0) {
    return (
      <PageContainer className="py-8 lg:py-12">
        <div className="h-10 w-64 bg-surface-background animate-pulse rounded mb-6"></div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-surface-background animate-pulse rounded-xl w-full"></div>
            ))}
          </div>
          <div className="w-full lg:w-[380px] shrink-0 h-96 bg-surface-background animate-pulse rounded-2xl"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12 bg-[#fafafa]">
      <CartHeader itemCount={cartItems.length} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        
        {/* Left Column: Items */}
        <div className="flex-1 min-w-0">
          <ShippingProgress subtotal={discountedSubtotal} threshold={shippingInfo.threshold} />

          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border bg-surface">
              <h2 className="text-lg font-bold text-text-primary">Cart Items</h2>
              <button 
                onClick={handleClearAll}
                className="text-sm font-medium text-text-muted hover:text-danger-600 transition-colors flex items-center gap-1.5"
              >
                Clear All
              </button>
            </div>

            <div className="divide-y divide-border">
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
          </div>
        </div>

        {/* Right Column: Summary & Coupon */}
        <div className="w-full lg:w-[380px] shrink-0">
          <CouponCard onApplyCoupon={(pct) => setCouponDiscountPercent(pct)} />
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

      <RecommendedSlider currentCartItemIds={cartProductIds} />
      
      <UndoSnackbar 
        item={pendingRemovalItem}
        onUndo={handleUndoRemoval}
        onConfirmRemoval={handleConfirmRemoval}
      />
    </PageContainer>
  );
};

export default CartPage;
