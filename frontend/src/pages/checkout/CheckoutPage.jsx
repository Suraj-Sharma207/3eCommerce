import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import useCartStore from '../../store/cartStore';
import useOrderStore from '../../store/orderStore';
import useAddressStore from '../../store/addressStore';
import { CheckCircle2, CreditCard, Truck, MapPin, Smartphone, Banknote, AlertCircle, QrCode, MonitorSmartphone } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import ImageFallback from '../../components/ui/ImageFallback';

const steps = [
  { id: 1, name: 'Shipping', icon: Truck },
  { id: 2, name: 'Payment', icon: CreditCard },
  { id: 3, name: 'Review', icon: CheckCircle2 }
];

const CheckoutPage = () => {
  const { cart, fetchCart } = useCartStore();
  const { checkout, isLoading: isOrderLoading, error: orderError } = useOrderStore();
  const { addresses, fetchAddresses, isLoading: isAddressesLoading } = useAddressStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddressId, setShippingAddressId] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'CREDIT_CARD', 'COD'
  const [paymentDetails, setPaymentDetails] = useState({
    upiProvider: 'GPAY', upiId: '', cardNumber: '', expiry: '', cvc: '', nameOnCard: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [checkoutError, setCheckoutError] = useState(null);
  const expiryRef = useRef(null);

  const getCardType = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d\d|7(?:[01]\d|20))/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'AmEx';
    // Basic check for RuPay
    if (/^(508[5-9]|6521[5-9]|652[2-9]|6530|6531[0-4]|60[6-8]|603|65[2-3])/.test(cleanNumber)) return 'RuPay';
    return null;
  };

  const cartItems = cart?.items || [];
  
  // Filter out completely missing products
  const validItems = cartItems.filter(item => item.product);

  const subtotal = validItems.reduce((acc, item) => {
    const itemPrice = item.product.finalPrice || item.product.price;
    return acc + (itemPrice * item.quantity);
  }, 0);
  const shipping = subtotal > 4999 ? 0 : 499;
  const total = subtotal + shipping;

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0) {
      const defaultShipping = addresses.find(a => a.isDefaultShipping) || addresses[0];
      if (!shippingAddressId) setShippingAddressId(defaultShipping.id);
    }
  }, [addresses, shippingAddressId]);

  useEffect(() => {
    if (!cartItems.length && currentStep === 1) {
      navigate('/cart');
    }
  }, [cartItems.length, currentStep, navigate]);

  const isValidLuhn = (number) => {
    let sum = 0;
    let isEven = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validatePaymentForm = () => {
    const errors = {};
    if (paymentMethod === 'UPI') {
      if (paymentDetails.upiProvider === 'OTHER') {
        if (!paymentDetails.upiId) errors.upiId = "UPI ID is required";
        else if (!/^[\w.-]+@[\w.-]+$/.test(paymentDetails.upiId)) errors.upiId = "Invalid UPI ID format";
      }
    } else if (paymentMethod === 'CREDIT_CARD') {
      if (!paymentDetails.nameOnCard || paymentDetails.nameOnCard.trim().length < 2) errors.nameOnCard = "Name on card is required";
      
      const cleanNumber = paymentDetails.cardNumber.replace(/\s/g, '');
      if (cleanNumber.length < 13 || cleanNumber.length > 19) errors.cardNumber = "Must be 13-19 digits";
      else if (!isValidLuhn(cleanNumber)) errors.cardNumber = "Invalid card number";
      
      if (!paymentDetails.expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.expiry)) errors.expiry = "Use MM/YY format";
      else {
        const [month, year] = paymentDetails.expiry.split('/');
        const expiryDate = new Date(`20${year}`, parseInt(month, 10) - 1);
        const today = new Date();
        today.setDate(1);
        today.setHours(0,0,0,0);
        if (expiryDate < today) errors.expiry = "Card has expired";
      }
      
      if (!paymentDetails.cvc || paymentDetails.cvc.length < 3) errors.cvc = "Invalid CVC";
    }
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (currentStep === 2) {
      validatePaymentForm();
    }
  }, [paymentMethod, paymentDetails, currentStep]);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (currentStep === 1 && !shippingAddressId) {
      setCheckoutError("Please select a shipping address.");
      return;
    }
    if (currentStep === 2) {
      const allTouched = { upiId: true, nameOnCard: true, cardNumber: true, expiry: true, cvc: true };
      setTouchedFields(allTouched);
      if (!validatePaymentForm()) {
        setCheckoutError("Please correct the errors in the payment form.");
        return;
      }
    }
    setCheckoutError(null);
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    
    // Create Order via API with real addresses and payment method
    const order = await checkout({
      shippingAddressId,
      billingAddressId: shippingAddressId,
      paymentMethod,
      paymentDetails
    });
    
    if (order) {
      // Refresh cart to reflect empty state
      fetchCart();
      navigate(`/order-success/${order.id}`);
    } else {
      // Because orderError might update on next tick, we use the store error if possible, 
      // or just wait for the state to update and display it.
      // But actually, orderStore's checkout catches and sets 'error'. So we can just use that.
      setCheckoutError('Failed to place order. Please review your cart and try again.');
    }
  };

  useEffect(() => {
    if (orderError) {
      setCheckoutError(orderError);
    }
  }, [orderError]);

  const getInputClassName = (name) => {
    if (!touchedFields[name]) return '';
    return paymentErrors[name] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
      : 'border-green-500 focus:border-green-500 focus:ring-green-200';
  };

  const renderAddressSelection = (type, selectedId, setSelection) => {
    if (isAddressesLoading && addresses.length === 0) return <LoadingSpinner />;
    
    if (addresses.length === 0) {
      return (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-orange-800">
          <p className="mb-2">You don't have any addresses saved.</p>
          <Button onClick={() => navigate('/addresses')} size="sm">Add Address</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {addresses.map(addr => (
          <label key={addr.id} className={`flex items-start p-4 border rounded-xl cursor-pointer transition-colors ${selectedId === addr.id ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-neutral-200 bg-white hover:border-primary-200'}`}>
            <input 
              type="radio" 
              name={`${type}Address`} 
              checked={selectedId === addr.id}
              onChange={() => setSelection(addr.id)}
              className="mt-1 w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
            />
            <div className="ml-3">
              <p className="font-medium">{addr.recipientName} <span className="text-xs ml-2 bg-neutral-200 px-2 py-0.5 rounded-full">{addr.label}</span></p>
              <p className="text-sm text-neutral-600 mt-1">{addr.street}</p>
              <p className="text-sm text-neutral-600">{addr.city}, {addr.state} {addr.zipCode}</p>
              <p className="text-sm text-neutral-600">{addr.country}</p>
            </div>
          </label>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form id="checkout-form" onSubmit={handleNextStep} className="space-y-8">
            {checkoutError && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{checkoutError}</div>}
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-medium text-neutral-900 flex items-center gap-2"><MapPin className="w-6 h-6"/> Shipping Address</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/addresses')}>Manage Addresses</Button>
              </div>
              {renderAddressSelection('shipping', shippingAddressId, setShippingAddressId)}
            </div>
          </form>
        );
      case 2:
        return (
          <form id="checkout-form" onSubmit={handleNextStep} className="space-y-6">
            <h2 className="text-2xl font-medium text-neutral-900 mb-6">Select Payment Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { id: 'UPI', name: 'UPI', icon: Smartphone },
                { id: 'CREDIT_CARD', name: 'Credit / Debit Card', icon: CreditCard },
                { id: 'COD', name: 'Cash on Delivery', icon: Banknote }
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <label key={method.id} className={`flex flex-col items-center justify-center p-6 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-sm' : 'border-neutral-200 bg-white hover:border-primary-200 text-neutral-600'}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={method.id}
                      checked={isSelected}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-primary-600' : 'text-neutral-400'}`} />
                    <span className="font-medium text-center">{method.name}</span>
                  </label>
                );
              })}
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-sm">
              {paymentMethod === 'UPI' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Select UPI App</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: 'GPAY', name: 'Google Pay', icon: MonitorSmartphone, color: 'text-blue-500' },
                      { id: 'PHONEPE', name: 'PhonePe', icon: MonitorSmartphone, color: 'text-purple-600' },
                      { id: 'PAYTM', name: 'Paytm', icon: MonitorSmartphone, color: 'text-blue-400' },
                      { id: 'BHIM', name: 'BHIM UPI', icon: MonitorSmartphone, color: 'text-orange-500' },
                      { id: 'OTHER', name: 'Other UPI ID', icon: Smartphone, color: 'text-neutral-500' },
                      { id: 'QR', name: 'Scan QR Code', icon: QrCode, color: 'text-neutral-800' }
                    ].map(provider => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          setPaymentDetails(prev => ({...prev, upiProvider: provider.id, upiId: ''}));
                          setTouchedFields(prev => ({...prev, upiId: false}));
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                          paymentDetails.upiProvider === provider.id
                            ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-sm'
                            : 'border-neutral-100 bg-white hover:border-primary-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <provider.icon className={`w-8 h-8 mb-2 ${paymentDetails.upiProvider === provider.id ? 'text-primary-600' : provider.color}`} />
                        <span className="text-sm font-medium text-center">{provider.name}</span>
                      </button>
                    ))}
                  </div>

                  {paymentDetails.upiProvider === 'OTHER' && (
                    <div className="relative mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
                      <Input 
                        label="Enter your UPI ID" 
                        placeholder="username@bank" 
                        value={paymentDetails.upiId} 
                        onBlur={() => setTouchedFields(prev => ({...prev, upiId: true}))}
                        onChange={e => setPaymentDetails(prev => ({...prev, upiId: e.target.value}))} 
                        className={getInputClassName('upiId')}
                      />
                      {touchedFields.upiId && paymentErrors.upiId && (
                        <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{paymentErrors.upiId}</p>
                      )}
                    </div>
                  )}

                  {paymentDetails.upiProvider === 'QR' && (
                    <div className="mt-4 p-6 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center bg-neutral-50 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-48 h-48 bg-white border border-neutral-200 rounded-lg p-2 shadow-sm flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-neutral-300" strokeWidth={1} />
                      </div>
                      <p className="text-sm text-neutral-500 mt-4 text-center">
                        Scan this QR code using any UPI app on your phone.<br/>
                        <span className="text-xs">(Gateway placeholder ready for future integration)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-neutral-900 mb-4">Enter Card Details</h3>
                  <div className="relative">
                    <Input 
                      label="Name on Card" 
                      placeholder="John Doe"
                      value={paymentDetails.nameOnCard} 
                      onBlur={() => setTouchedFields(prev => ({...prev, nameOnCard: true}))}
                      onChange={e => {
                        const val = e.target.value;
                        if (/^[A-Za-z\s]{0,80}$/.test(val)) {
                          setPaymentDetails(prev => ({ ...prev, nameOnCard: val }));
                        }
                      }} 
                      className={getInputClassName('nameOnCard')}
                    />
                    {touchedFields.nameOnCard && paymentErrors.nameOnCard && (
                      <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{paymentErrors.nameOnCard}</p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-neutral-700">Card Number <span className="text-red-500">*</span></label>
                      {paymentDetails.cardNumber && (
                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{getCardType(paymentDetails.cardNumber) || 'Card'}</span>
                      )}
                    </div>
                    <Input 
                      placeholder="0000 0000 0000 0000" 
                      value={paymentDetails.cardNumber} 
                      onBlur={() => setTouchedFields(prev => ({...prev, cardNumber: true}))}
                      onChange={e => {
                        const val = e.target.value.replace(/\s/g, '');
                        if (/^\d{0,19}$/.test(val)) {
                          const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
                          setPaymentDetails(prev => ({ ...prev, cardNumber: formatted }));
                          
                          // Auto focus to expiry
                          const cardType = getCardType(formatted);
                          const isAmex = cardType === 'AmEx';
                          const maxLength = isAmex ? 15 : 16;
                          if (val.length === maxLength) {
                            setTimeout(() => {
                              expiryRef.current?.focus();
                            }, 50);
                          }
                        }
                      }} 
                      className={getInputClassName('cardNumber')}
                    />
                    {touchedFields.cardNumber && paymentErrors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{paymentErrors.cardNumber}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Expiry (MM/YY) <span className="text-red-500">*</span></label>
                      <input 
                        ref={expiryRef}
                        type="text"
                        placeholder="MM/YY" 
                        value={paymentDetails.expiry} 
                        onBlur={() => setTouchedFields(prev => ({...prev, expiry: true}))}
                        onChange={e => {
                          let val = e.target.value.replace(/[^\d/]/g, '');
                          if (val.length === 2 && !val.includes('/') && paymentDetails.expiry.length !== 3) {
                            val += '/';
                          }
                          if (val.length <= 5) {
                            setPaymentDetails(prev => ({ ...prev, expiry: val }));
                          }
                        }} 
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${getInputClassName('expiry') || 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'}`}
                      />
                      {touchedFields.expiry && paymentErrors.expiry && (
                        <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{paymentErrors.expiry}</p>
                      )}
                    </div>
                    <div className="relative">
                      <Input 
                        label="CVC" 
                        placeholder="123" 
                        value={paymentDetails.cvc} 
                        onBlur={() => setTouchedFields(prev => ({...prev, cvc: true}))}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 4) {
                            setPaymentDetails(prev => ({ ...prev, cvc: val }));
                          }
                        }} 
                        className={getInputClassName('cvc')}
                      />
                      {touchedFields.cvc && paymentErrors.cvc && (
                        <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{paymentErrors.cvc}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'COD' && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">Cash on Delivery</h3>
                  <p className="text-neutral-500">You will pay for your order upon delivery.</p>
                </div>
              )}
            </div>
            
            {checkoutError && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{checkoutError}</div>}
          </form>
        );
      case 3:
        const shippingAddr = addresses.find(a => a.id === shippingAddressId);
        
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-neutral-900 mb-6">Review Your Order</h2>
            
            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
              <h3 className="text-lg font-medium text-neutral-900 mb-4 border-b border-neutral-100 pb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-neutral-400" /> Delivery Details
              </h3>
              {shippingAddr ? (
                <>
                  <p className="text-neutral-700 font-medium">{shippingAddr.recipientName}</p>
                  <p className="text-neutral-500">{shippingAddr.street}</p>
                  <p className="text-neutral-500">{shippingAddr.city}, {shippingAddr.state} {shippingAddr.zipCode}</p>
                  <p className="text-neutral-500">{shippingAddr.country}</p>
                </>
              ) : <p className="text-red-500">Missing Address</p>}
            </div>

            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
              <h3 className="text-lg font-medium text-neutral-900 mb-4 border-b border-neutral-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-neutral-400" /> Payment Details
              </h3>
              {paymentMethod === 'UPI' && (
                <p className="text-neutral-700">UPI ID: {paymentDetails.upiId}</p>
              )}
              {paymentMethod === 'CREDIT_CARD' && (
                <>
                  <p className="text-neutral-700 font-medium">{paymentDetails.nameOnCard}</p>
                  <p className="text-neutral-500">Card ending in •••• {paymentDetails.cardNumber.slice(-4) || 'XXXX'}</p>
                </>
              )}
              {paymentMethod === 'COD' && (
                <p className="text-neutral-700 font-medium">Cash on Delivery</p>
              )}
            </div>
            
            {checkoutError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium">
                {checkoutError}
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <PageContainer className="py-8 lg:py-12">
      
      {/* Progress Stepper */}
      <div className="max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 -z-10 rounded-full"></div>
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
                  isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-white text-neutral-400 border-2 border-neutral-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isCurrent || isCompleted ? 'text-primary-700' : 'text-neutral-400'}`}>
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
          
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-neutral-200">
            {currentStep > 1 ? (
              <button 
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="text-neutral-500 font-medium hover:text-neutral-900"
              >
                Back
              </button>
            ) : <div></div>}
            
            {currentStep < 3 ? (
              <Button 
                type="submit" 
                form="checkout-form" 
                size="lg" 
                className="px-8 shadow-md" 
                disabled={(currentStep === 1 && addresses.length === 0) || (currentStep === 2 && Object.keys(paymentErrors).length > 0)}
              >
                Continue to {steps[currentStep].name}
              </Button>
            ) : (
              <Button 
                onClick={handlePlaceOrder} 
                size="lg" 
                className="px-8 shadow-xl"
                isLoading={isOrderLoading}
              >
                Place Order & Pay
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 sticky top-24">
            <h3 className="text-lg font-medium text-neutral-900 mb-4 pb-4 border-b border-neutral-100">Order Summary</h3>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {validItems.map((item) => {
                const itemPrice = item.product.finalPrice || item.product.price;
                return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100">
                      <ImageFallback src={item.product.thumbnail} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-800 text-white text-xs font-bold flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-neutral-900 line-clamp-2">{item.product.name}</p>
                    <p className="text-neutral-500 mt-1">{formatPrice(itemPrice)}</p>
                  </div>
                </div>
              )})}
            </div>

            <div className="space-y-3 text-neutral-600 border-t border-neutral-100 pt-4 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-neutral-900">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-neutral-200 pt-4">
              <span className="text-lg font-medium text-neutral-900">Total</span>
              <span className="text-2xl font-bold text-neutral-900">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default CheckoutPage;
