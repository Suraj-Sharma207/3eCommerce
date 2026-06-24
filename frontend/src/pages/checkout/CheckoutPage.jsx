import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import useCartStore from '../../store/cartStore';
import useOrderStore from '../../store/orderStore';
import usePaymentStore from '../../store/paymentStore';
import { CheckCircle2, CreditCard, Truck } from 'lucide-react';

const steps = [
  { id: 1, name: 'Shipping', icon: Truck },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Review', icon: CheckCircle2 }
];

const CheckoutPage = () => {
  const { cart } = useCartStore();
  const { checkout, isLoading: isOrderLoading } = useOrderStore();
  const { processPayment, isLoading: isPaymentLoading } = usePaymentStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '', address: '', city: '', zip: '', country: ''
  });
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '', expiry: '', cvc: '', nameOnCard: ''
  });
  const [checkoutError, setCheckoutError] = useState(null);

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 299 ? 0 : 25;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!cartItems.length && currentStep === 1) {
      navigate('/cart');
    }
  }, [cartItems.length, currentStep, navigate]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    // 1. Create Order via Order API
    const order = await checkout();
    if (!order) {
      setCheckoutError('Failed to place order. Please try again.');
      return;
    }

    // 2. Process Payment via Payment API
    const paymentSuccess = await processPayment(order.id, paymentDetails);
    
    if (paymentSuccess) {
      navigate(`/order-success/${order.id}`);
    } else {
      setCheckoutError('Payment failed. Your order is pending payment.');
      // In a real app, redirect to an order details page with a "Retry Payment" button
      navigate(`/orders/${order.id}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form id="checkout-form" onSubmit={handleNextStep} className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Shipping Address</h2>
            <Input label="Full Name" required value={shippingDetails.fullName} onChange={e => setShippingDetails({...shippingDetails, fullName: e.target.value})} />
            <Input label="Street Address" required value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" required value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} />
              <Input label="ZIP / Postal Code" required value={shippingDetails.zip} onChange={e => setShippingDetails({...shippingDetails, zip: e.target.value})} />
            </div>
            <Input label="Country" required value={shippingDetails.country} onChange={e => setShippingDetails({...shippingDetails, country: e.target.value})} />
          </form>
        );
      case 2:
        return (
          <form id="checkout-form" onSubmit={handleNextStep} className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Payment Method</h2>
            {/* Mock Credit Card Form for Future Integration */}
            <div className="bg-secondary-50 p-6 rounded-xl border border-secondary-200 mb-6">
              <p className="text-sm text-text-secondary mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Credit Card (Mock Integration)
              </p>
              <div className="space-y-4">
                <Input label="Name on Card" required value={paymentDetails.nameOnCard} onChange={e => setPaymentDetails({...paymentDetails, nameOnCard: e.target.value})} />
                <Input label="Card Number" placeholder="**** **** **** ****" required value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry (MM/YY)" placeholder="MM/YY" required value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} />
                  <Input label="CVC" placeholder="123" required value={paymentDetails.cvc} onChange={e => setPaymentDetails({...paymentDetails, cvc: e.target.value})} />
                </div>
              </div>
            </div>
          </form>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Review Your Order</h2>
            
            <div className="bg-surface rounded-xl p-6 border border-secondary-200">
              <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary-100 pb-2">Shipping Details</h3>
              <p className="text-text-secondary">{shippingDetails.fullName}</p>
              <p className="text-text-secondary">{shippingDetails.address}, {shippingDetails.city} {shippingDetails.zip}</p>
              <p className="text-text-secondary">{shippingDetails.country}</p>
            </div>

            <div className="bg-surface rounded-xl p-6 border border-secondary-200">
              <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-secondary-100 pb-2">Payment Details</h3>
              <p className="text-text-secondary">Card ending in •••• {paymentDetails.cardNumber.slice(-4) || 'XXXX'}</p>
              <p className="text-text-secondary">Name: {paymentDetails.nameOnCard}</p>
            </div>
            
            {checkoutError && (
              <div className="bg-danger-light text-danger-dark p-4 rounded-lg text-sm font-medium">
                {checkoutError}
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <PageContainer className="py-8 lg:py-12 bg-background-default">
      
      {/* Progress Stepper */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary-200 -z-10 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-600 -z-10 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isCompleted ? 'bg-primary-600 text-white' : 
                  isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-white text-secondary-400 border-2 border-secondary-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-primary-700' : 'text-text-muted'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto">
        
        {/* Main Content Area */}
        <div className="flex-1">
          {renderStepContent()}
          
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-secondary-200">
            {currentStep > 1 ? (
              <button 
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="text-text-secondary font-semibold hover:text-text-primary"
              >
                Back
              </button>
            ) : <div></div>}
            
            {currentStep < 3 ? (
              <Button type="submit" form="checkout-form" size="lg" className="px-8 shadow-md">
                Continue to {steps[currentStep].name}
              </Button>
            ) : (
              <Button 
                onClick={handlePlaceOrder} 
                size="lg" 
                className="px-8 shadow-xl bg-accent-500 hover:bg-accent-600 text-white"
                disabled={isOrderLoading || isPaymentLoading}
              >
                {isOrderLoading || isPaymentLoading ? 'Processing...' : 'Place Order & Pay'}
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-secondary-200 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-4 pb-4 border-b border-secondary-100">Order Summary</h3>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative">
                    <img src={item.product.imageUrl || 'https://via.placeholder.com/150'} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-secondary-100" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-secondary-800 text-white text-xs font-bold flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-text-primary line-clamp-2">{item.product.name}</p>
                    <p className="text-text-secondary mt-1">${item.product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-text-secondary border-t border-secondary-100 pt-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-text-primary">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-secondary-200 pt-4">
              <span className="text-lg font-bold text-text-primary">Total</span>
              <span className="text-2xl font-extrabold text-text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CheckoutPage;
