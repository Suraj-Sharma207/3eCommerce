import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import QuantitySelector from '../../components/ecommerce/QuantitySelector';
import ImageFallback from '../../components/ui/ImageFallback';
import EmptyState from '../../components/ui/EmptyState';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { Trash2, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';

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
      <PageContainer className="py-20">
        <EmptyState 
          title="Please log in"
          message="You need to be logged in to view your cart."
          actionLabel="Log In"
          onAction={() => navigate('/login', { state: { from: { pathname: '/cart' } } })}
        />
      </PageContainer>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 299 ? 0 : 25; // Free shipping over $299
  const total = subtotal + shipping;

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
              {cartItems.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center group">
                  
                  {/* Product Info */}
                  <div className="col-span-6 flex items-center gap-4 w-full">
                    <Link to={`/products/${item.productId}`} className="shrink-0 relative w-24 h-24 rounded-xl overflow-hidden bg-secondary-100">
                      <ImageFallback src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex flex-col">
                      <Link to={`/products/${item.productId}`} className="text-base font-bold text-text-primary hover:text-primary-600 transition-colors line-clamp-2">
                        {item.product.name}
                      </Link>
                      <span className="text-sm text-text-secondary mt-1">${item.product.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-3 w-full flex sm:justify-center mt-2 sm:mt-0">
                    <QuantitySelector 
                      quantity={item.quantity} 
                      setQuantity={(q) => updateQuantity(item.productId, q)} 
                      max={item.product.stock}
                    />
                  </div>

                  {/* Total Price */}
                  <div className="col-span-2 w-full flex justify-between sm:justify-end mt-2 sm:mt-0">
                    <span className="sm:hidden text-sm text-text-secondary font-medium">Total:</span>
                    <span className="text-lg font-extrabold text-text-primary">
                      ${(item.product.price * item.quantity).toFixed(2)}
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
              ))}
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
                <span className="font-medium text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="font-medium text-success-600">Free</span>
                ) : (
                  <span className="font-medium text-text-primary">${shipping.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="border-t border-secondary-200 pt-4 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-text-primary">Total</span>
                <span className="text-2xl font-extrabold text-text-primary">${total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-text-muted text-right">Includes taxes if applicable</p>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              className="mb-4 group shadow-lg"
              onClick={() => navigate('/checkout')}
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
