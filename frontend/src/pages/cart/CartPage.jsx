import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import QuantitySelector from '../../components/ecommerce/QuantitySelector';
import ImageFallback from '../../components/ui/ImageFallback';
import EmptyState from '../../components/ui/EmptyState';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { Trash2, ArrowRight, ShieldCheck, CreditCard, AlertTriangle } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const CartPage = () => {
  const { cart, isLoading, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  if (!isAuthenticated) {
    return (
      <PageContainer className="py-20 max-w-2xl text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-100 p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-medium text-neutral-900 mb-4">Your Shopping Cart</h2>
          <p className="text-lg text-neutral-500 mb-8 max-w-md mx-auto">
            Log in to view your cart, see saved items, and proceed to checkout securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" state={{ from: { pathname: '/cart' } }} className="inline-flex items-center justify-center px-8 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-md">
              Log In
            </Link>
            <Link to="/register" state={{ from: { pathname: '/cart' } }} className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-600 border border-primary-200 font-medium rounded-xl hover:bg-primary-50 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const cartItems = cart?.items || [];
  
  // Filter out items where the product is completely missing (just in case cascade didn't run)
  const validItems = cartItems.filter(item => item.product);
  
  const subtotal = validItems.reduce((acc, item) => {
    const itemPrice = item.product.finalPrice || item.product.price;
    return acc + (itemPrice * item.quantity);
  }, 0);
  
  const shipping = subtotal > 4999 ? 0 : 499; // Free shipping over ₹4999
  const total = subtotal + shipping;

  const hasUnavailableItems = validItems.some(item => !item.product.active || item.product.stock === 0);

  if (!isLoading && cartItems.length === 0) {
    return (
      <PageContainer className="py-20">
        <EmptyState 
          title="Your cart is empty"
          message="Looks like you haven't added anything to your cart yet."
          actionLabel="Start Shopping"
          onAction={() => navigate('/products')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12">
      <h1 className="text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight mb-8">
        Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Cart Items List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-6 border-b border-secondary-200 bg-secondary-50 text-sm font-bold text-text-secondary uppercase tracking-wider">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1 text-center"></div>
            </div>

            <div className="divide-y divide-secondary-100">
              {validItems.map((item) => {
                const product = item.product;
                const itemPrice = product.finalPrice || product.price;
                const isUnavailable = !product.active || product.stock === 0;
                
                return (
                <div key={item.id} className={`p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center group ${isUnavailable ? 'opacity-60 bg-secondary-50' : ''}`}>
                  
                  {/* Product Info */}
                  <div className="col-span-6 flex items-center gap-4 w-full">
                    <Link to={`/products/${item.productId}`} className="shrink-0 relative w-24 h-24 rounded-xl overflow-hidden bg-secondary-100">
                      <ImageFallback src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex flex-col">
                      <Link to={`/products/${item.productId}`} className="text-base font-bold text-text-primary hover:text-primary-600 transition-colors line-clamp-2">
                        {product.name}
                      </Link>
                      <span className="text-sm text-text-secondary mt-1">{formatPrice(itemPrice)}</span>
                      {isUnavailable && (
                        <span className="text-xs text-danger font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Out of Stock - This item is currently unavailable.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-3 w-full flex sm:justify-center mt-2 sm:mt-0">
                    <QuantitySelector 
                      quantity={item.quantity} 
                      setQuantity={(q) => updateQuantity(item.productId, q)} 
                      max={product.stock}
                    />
                  </div>

                  {/* Total Price */}
                  <div className="col-span-2 w-full flex justify-between sm:justify-end mt-2 sm:mt-0">
                    <span className="sm:hidden text-sm text-text-secondary font-medium">Total:</span>
                    <span className="text-lg font-extrabold text-text-primary">
                      {formatPrice(itemPrice * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Action */}
                  <div className="col-span-1 w-full sm:w-auto flex justify-end">
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="p-2 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-secondary-200 sticky top-24">
            <h2 className="text-xl font-bold text-text-primary mb-6">Order Summary</h2>
            
            <div className="space-y-4 text-text-secondary mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-text-primary">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="font-medium text-success-600">Free</span>
                ) : (
                  <span className="font-medium text-text-primary">{formatPrice(shipping)}</span>
                )}
              </div>
            </div>

            <div className="border-t border-secondary-200 pt-4 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-text-primary">Total</span>
                <span className="text-2xl font-extrabold text-text-primary">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-text-muted text-right">Includes taxes if applicable</p>
            </div>

            {hasUnavailableItems && (
              <div className="mb-4 p-3 bg-danger-light text-danger-dark rounded-lg text-sm flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Please remove unavailable items from your cart before proceeding.</span>
              </div>
            )}

            <Button 
              fullWidth 
              size="lg" 
              className="mb-4 group shadow-lg"
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailableItems}
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-text-muted justify-center">
                <ShieldCheck className="w-5 h-5 text-success-600" />
                Secure Checkout
              </div>
              <div className="flex items-center gap-3 text-sm text-text-muted justify-center">
                <CreditCard className="w-5 h-5 text-primary-500" />
                All major credit cards accepted
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default CartPage;
