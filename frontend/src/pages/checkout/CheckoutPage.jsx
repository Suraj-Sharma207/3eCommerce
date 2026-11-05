import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import useCartStore from "../../store/cartStore";
import useOrderStore from "../../store/orderStore";
import useAddressStore from "../../store/addressStore";
import {
  CheckCircle2,
  CreditCard,
  Truck,
  MapPin,
  Smartphone,
  Banknote,
  AlertCircle,
  QrCode,
  MonitorSmartphone,
  Lock,
  ShieldCheck,
  RefreshCcw,
  Shield,
  Headphones,
  Edit2,
  MoreVertical,
  Plus,
  Edit,
  Medal,
  ArrowRight,
  Zap,
  Info,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { formatPrice } from "../../utils/currency";
import ImageFallback from "../../components/ui/ImageFallback";
import { getOptimizedUrl } from "../../utils/cloudinary";
import useSettingsStore from "../../store/settingsStore";
import { calculateShipping } from "../../utils/shipping";

const steps = [
  { id: 1, name: "SHIPPING", icon: Truck },
  { id: 2, name: "PAYMENT", icon: CreditCard },
  { id: 3, name: "REVIEW", icon: CheckCircle2 },
];

const CheckoutPage = () => {
  const { cart, fetchCart, resetCart } = useCartStore();
  const {
    checkout,
    isLoading: isOrderLoading,
    error: orderError,
  } = useOrderStore();
  const {
    addresses,
    fetchAddresses,
    isLoading: isAddressesLoading,
  } = useAddressStore();
  const { publicConfig } = useSettingsStore();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [deliveryOption, setDeliveryOption] = useState("standard");

  const [paymentMethod, setPaymentMethod] = useState("UPI"); //'UPI','CREDIT_CARD','COD'
  const [paymentDetails, setPaymentDetails] = useState({
    upiProvider: "GPAY",
    upiId: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [checkoutError, setCheckoutError] = useState(null);
  const expiryRef = useRef(null);

  const getCardType = (number) => {
    const cleanNumber = number.replace(/\D/g, "");
    if (/^4/.test(cleanNumber)) return "Visa";
    if (
      /^5[1-5]/.test(cleanNumber) ||
      /^2(?:2(?:2[1-9]|[3-9]\d)|[3-6]\d\d|7(?:[01]\d|20))/.test(cleanNumber)
    )
      return "Mastercard";
    if (/^3[47]/.test(cleanNumber)) return "AmEx";
    if (
      /^(508[5-9]|6521[5-9]|652[2-9]|6530|6531[0-4]|60[6-8]|603|65[2-3])/.test(
        cleanNumber,
      )
    )
      return "RuPay";
    return null;
  };

  const cartItems = cart?.items || [];
  const validItems = cartItems.filter((item) => item.product);

  const subtotal = validItems.reduce((acc, item) => {
    const itemPrice = item.product.finalPrice || item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  const shippingInfo = calculateShipping(subtotal, publicConfig);
  let shipping = validItems.length > 0 ? shippingInfo.fee : 0;

  if (deliveryOption === "express") {
    shipping = 149;
  } else if (shippingInfo.fee === -1) {
    shipping = 0; // Default to 0 for display
  }

  const total = subtotal + shipping;
  const isFreeShipping =
    deliveryOption === "standard" && shippingInfo.fee === 0;
  const savedAmount = isFreeShipping ? 99 : 0; // Mock saved amount for free shipping as per design
  const rewardPoints = Math.floor(total * 0.01);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    if (addresses.length > 0) {
      const defaultShipping =
        addresses.find((a) => a.isDefaultShipping) || addresses[0];
      if (!shippingAddressId) setShippingAddressId(defaultShipping.id);
    }
  }, [addresses, shippingAddressId]);

  useEffect(() => {
    if (!cartItems.length && currentStep === 1) {
      navigate("/cart");
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
    if (paymentMethod === "UPI") {
      if (paymentDetails.upiProvider === "OTHER") {
        if (!paymentDetails.upiId) errors.upiId = "UPI ID is required.";
        else if (!/^[\w.-]+@[\w.-]+$/.test(paymentDetails.upiId))
          errors.upiId = "Invalid UPI ID format.";
      }
    } else if (paymentMethod === "CREDIT_CARD") {
      if (
        !paymentDetails.nameOnCard ||
        paymentDetails.nameOnCard.trim().length < 2
      )
        errors.nameOnCard = "Name on card is required.";

      const cleanNumber = paymentDetails.cardNumber.replace(/\s/g, "");
      if (cleanNumber.length < 13 || cleanNumber.length > 19)
        errors.cardNumber = "Must be 13-19 digits.";
      else if (!isValidLuhn(cleanNumber))
        errors.cardNumber = "Invalid card number.";

      if (
        !paymentDetails.expiry ||
        !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.expiry)
      )
        errors.expiry = "Use MM/YY format.";
      else {
        const [month, year] = paymentDetails.expiry.split("/");
        const expiryDate = new Date(`20${year}`, parseInt(month, 10) - 1);
        const today = new Date();
        today.setDate(1);
        today.setHours(0, 0, 0, 0);
        if (expiryDate < today) errors.expiry = "Card has expired.";
      }

      if (!paymentDetails.cvc || paymentDetails.cvc.length < 3)
        errors.cvc = "Invalid CVC.";
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
      const allTouched = {
        upiId: true,
        nameOnCard: true,
        cardNumber: true,
        expiry: true,
        cvc: true,
      };
      setTouchedFields(allTouched);
      if (!validatePaymentForm()) {
        setCheckoutError("Please correct the errors in the payment form.");
        return;
      }
    }
    setCheckoutError(null);
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePlaceOrder = async () => {
    setCheckoutError(null);
    const order = await checkout({
      shippingAddressId,
      billingAddressId: shippingAddressId,
      paymentMethod,
      paymentDetails,
      deliveryMethod: deliveryOption,
    });

    if (order) {
      resetCart();
      fetchCart();
      navigate(`/order-success/${order.id}`);
    } else {
      setCheckoutError(
        "Failed to place order. Please review your cart and try again.",
      );
    }
  };

  useEffect(() => {
    if (orderError) {
      setCheckoutError(orderError);
    }
  }, [orderError]);

  const getInputClassName = (name) => {
    if (!touchedFields[name]) return "";
    return paymentErrors[name]
      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
      : "border-green-500 focus:border-green-500 focus:ring-green-200";
  };

  // ── Render Helpers ──

  const renderStepper = () => (
    <div className="max-w-3xl mx-auto mt-6 mb-8 relative">
      {/* The connecting line */}
      <div className="absolute left-[15%] right-[15%] top-8 -translate-y-1/2 h-px bg-slate-300 z-0" />

      <div className="flex justify-between items-start relative z-10">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex flex-col items-center px-6">
              {/* Large Icon Circle */}
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 shadow-sm relative z-10
 ${isCompleted || isCurrent ? "bg-[#1B2340] text-white ring-8 ring-[#fafafa]" : "bg-white border-2 border-slate-200 text-slate-400 ring-8 ring-[#fafafa]"}`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>

              {/* Text */}
              <span
                className={`text-[13px] font-bold tracking-wider mb-2 ${isCurrent || isCompleted ? "text-[#1B2340]" : "text-slate-400"}`}
              >
                {step.name}
              </span>

              {/* Small Number Circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold
 ${isCurrent || isCompleted ? "bg-[#1B2340] text-white" : "bg-slate-300 text-white"}`}
              >
                {step.id}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form id="checkout-form" onSubmit={handleNextStep}>
            {checkoutError && (
              <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm mb-6">
                {checkoutError}
              </div>
            )}

            {/* Shipping Address Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1B2340] flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Shipping Address
                </h2>
                <button
                  type="button"
                  onClick={() => navigate("/addresses")}
                  className="text-sm font-bold text-slate-600 border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors"
                >
                  Manage Addresses
                </button>
              </div>

              {isAddressesLoading && addresses.length === 0 ? (
                <LoadingSpinner />
              ) : addresses.length === 0 ? (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-orange-800">
                  <p className="mb-2">You don't have any addresses saved.</p>
                  <Button onClick={() => navigate("/addresses")} size="sm">
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      onClick={() => setShippingAddressId(addr.id)}
                      className={`flex items-start p-7 border rounded-2xl cursor-pointer transition-all ${shippingAddressId === addr.id ? "border-[#1B2340] bg-white ring-1 ring-[#1B2340]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <div className="flex items-center h-5 mr-3 mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingAddressId === addr.id ? "border-blue-600" : "border-slate-300"}`}
                        >
                          {shippingAddressId === addr.id && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-[#1B2340]">{addr.recipientName}</p>
                          <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                            {addr.label}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-500">
                            {addr.street}, {addr.city}, {addr.state}{" "}
                            {addr.zipCode}, {addr.country}
                          </p>
                          <p className="text-sm text-slate-500">
                            {addr.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 self-center">
                        <button
                          type="button"
                          onClick={() => navigate("/addresses")}
                          className="hover:text-[#1B2340] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={() => navigate("/addresses")}
                    className="w-full flex items-center justify-center gap-2 py-4 border border-slate-200 border-dashed rounded-2xl text-sm font-bold text-[#1B2340] hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add New Address
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Options Section */}
            <div>
              <h2 className="text-lg font-bold text-[#1B2340] flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5" /> Delivery Options
              </h2>

              <div className="space-y-4">
                {/* Standard */}
                <label
                  className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-all ${deliveryOption === "standard" ? "border-blue-600 bg-white ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="standard"
                    checked={deliveryOption === "standard"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${deliveryOption === "standard" ? "border-blue-600" : "border-slate-300"}`}
                    >
                      {deliveryOption === "standard" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-[#1B2340] text-sm">
                          Standard Delivery
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          3 – 5 Business Days
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-600">FREE</p>
                    <p className="text-xs text-slate-400 line-through">
                      ₹99.00
                    </p>
                  </div>
                </label>

                {/* Express */}
                <label
                  className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-all ${deliveryOption === "express" ? "border-blue-600 bg-white ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="express"
                    checked={deliveryOption === "express"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${deliveryOption === "express" ? "border-blue-600" : "border-slate-300"}`}
                    >
                      {deliveryOption === "express" && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-slate-600" />
                      <div>
                        <p className="text-[#1B2340] text-sm">
                          Express Delivery
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          1 – 2 Business Days
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#1B2340]">₹149.00</p>
                  </div>
                </label>
              </div>

              {/* Shipping Banner */}
              {deliveryOption === "standard" && isFreeShipping && (
                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-[18px] flex items-start gap-3 transition-all duration-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-800">
                      <span className="">
                        ✓ You are using FREE Standard Delivery.
                      </span>
                    </p>
                    <p className="text-sm text-emerald-600 mt-0.5">
                      You saved ₹99.00
                    </p>
                  </div>
                </div>
              )}
              {deliveryOption === "express" && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-[18px] flex items-start gap-3 transition-all duration-300">
                  <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900">
                      <span className="">⚡ Express Delivery Selected</span>
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Additional Shipping Charge: <b>₹149</b>
                    </p>
                    <p className="text-xs text-blue-700">
                      Estimated Delivery: <b>1–2 Business Days</b>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                className="w-full h-[60px] mt-6 mb-4 bg-[#1B2340] hover:bg-[#252f52] text-white border-none text-base rounded-2xl flex items-center justify-center gap-2"
              >
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Your information
                is secure and encrypted
              </div>
            </div>
          </form>
        );

      case 2:
        return (
          <form
            id="checkout-form"
            onSubmit={handleNextStep}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1B2340] flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { id: "UPI", name: "UPI", icon: Smartphone },
                {
                  id: "CREDIT_CARD",
                  name: "Credit / Debit Card",
                  icon: CreditCard,
                },
                { id: "COD", name: "Cash on Delivery", icon: Banknote },
              ].map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <label
                    key={method.id}
                    className={`flex flex-col items-center justify-center p-5 border rounded-2xl cursor-pointer transition-all ${isSelected ? "border-blue-600 bg-white ring-1 ring-blue-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={isSelected}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <Icon
                      className={`w-6 h-6 mb-2 ${isSelected ? "text-blue-600" : "text-slate-600"}`}
                    />
                    <span
                      className={`text-sm font-medium text-center ${isSelected ? "text-blue-600 font-bold" : "text-slate-800"}`}
                    >
                      {method.name}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              {paymentMethod === "UPI" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#1B2340] mb-4">
                    Select UPI App
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: "GPAY",
                        name: "Google Pay",
                        icon: () => (
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                            alt="Google Pay"
                            className="h-6 mb-3 object-contain"
                          />
                        ),
                      },
                      {
                        id: "PHONEPE",
                        name: "PhonePe",
                        icon: () => (
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg"
                            alt="PhonePe"
                            className="h-6 mb-3 object-contain"
                          />
                        ),
                      },
                      {
                        id: "PAYTM",
                        name: "Paytm",
                        icon: () => (
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg"
                            alt="Paytm"
                            className="h-4 mb-4 mt-1 object-contain"
                          />
                        ),
                      },
                      {
                        id: "BHIM",
                        name: "BHIM UPI",
                        icon: () => (
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"
                            alt="BHIM UPI"
                            className="h-5 mb-3 mt-0.5 object-contain"
                          />
                        ),
                      },
                      {
                        id: "OTHER",
                        name: "Other UPI ID",
                        icon: () => (
                          <Smartphone className="w-6 h-6 mb-2 text-slate-500" />
                        ),
                      },
                      {
                        id: "QR",
                        name: "Scan QR Code",
                        icon: () => (
                          <QrCode className="w-6 h-6 mb-2 text-slate-500" />
                        ),
                      },
                    ].map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          setPaymentDetails((prev) => ({
                            ...prev,
                            upiProvider: provider.id,
                            upiId: "",
                          }));
                          setTouchedFields((prev) => ({
                            ...prev,
                            upiId: false,
                          }));
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          paymentDetails.upiProvider === provider.id
                            ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <provider.icon />
                        <span className="text-xs text-[#1B2340] text-center">
                          {provider.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {paymentDetails.upiProvider === "OTHER" && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="relative flex items-center py-2 mb-4">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">
                          OR
                        </span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm text-[#1B2340] mb-2">
                          Enter UPI ID
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="yourname@upi"
                            value={paymentDetails.upiId}
                            onBlur={() =>
                              setTouchedFields((prev) => ({
                                ...prev,
                                upiId: true,
                              }))
                            }
                            onChange={(e) =>
                              setPaymentDetails((prev) => ({
                                ...prev,
                                upiId: e.target.value,
                              }))
                            }
                            className={`w-full px-4 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white pr-16 ${
                              touchedFields.upiId && paymentErrors.upiId
                                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                                : "border-slate-200 focus:border-[#1B2340] focus:ring-slate-100"
                            }`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 italic text-slate-400 text-sm">
                            UPI<span className="text-blue-500">》</span>
                          </div>
                        </div>
                        {touchedFields.upiId && paymentErrors.upiId && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {paymentErrors.upiId}
                          </p>
                        )}
                      </div>

                      <div className="bg-[#f0f7ff] border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          You will be redirected to your UPI app to complete the
                          payment securely.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-[#1B2340]">
                            Saved UPI IDs{" "}
                            <span className="text-slate-400">(Optional)</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Pay faster using your saved UPI IDs
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {paymentDetails.upiProvider === "QR" && (
                    <div className="mt-4 p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-40 h-40 bg-white border border-slate-200 rounded-lg p-2 shadow-sm flex items-center justify-center">
                        <QrCode
                          className="w-24 h-24 text-slate-300"
                          strokeWidth={1}
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-4 text-center">
                        Scan this QR code using any UPI app on your phone.
                        <br />
                      </p>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "CREDIT_CARD" && (
                <div className="space-y-5">
                  <div className="relative">
                    <Input
                      label="Name on Card"
                      placeholder="John Doe"
                      value={paymentDetails.nameOnCard}
                      onBlur={() =>
                        setTouchedFields((prev) => ({
                          ...prev,
                          nameOnCard: true,
                        }))
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[A-Za-z\s]{0,80}$/.test(val))
                          setPaymentDetails((prev) => ({
                            ...prev,
                            nameOnCard: val,
                          }));
                      }}
                      className={getInputClassName("nameOnCard")}
                    />
                    {touchedFields.nameOnCard && paymentErrors.nameOnCard && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {paymentErrors.nameOnCard}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm text-slate-700">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      {paymentDetails.cardNumber && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {getCardType(paymentDetails.cardNumber) || "Card"}
                        </span>
                      )}
                    </div>
                    <Input
                      placeholder="0000 0000 0000 0000"
                      value={paymentDetails.cardNumber}
                      onBlur={() =>
                        setTouchedFields((prev) => ({
                          ...prev,
                          cardNumber: true,
                        }))
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s/g, "");
                        if (/^\d{0,19}$/.test(val)) {
                          const formatted = val
                            .replace(/(\d{4})/g, "$1")
                            .trim();
                          setPaymentDetails((prev) => ({
                            ...prev,
                            cardNumber: formatted,
                          }));
                          const cardType = getCardType(formatted);
                          const isAmex = cardType === "AmEx";
                          const maxLength = isAmex ? 15 : 16;
                          if (val.length === maxLength) {
                            setTimeout(() => {
                              expiryRef.current?.focus();
                            }, 50);
                          }
                        }
                      }}
                      className={getInputClassName("cardNumber")}
                    />
                    {touchedFields.cardNumber && paymentErrors.cardNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {paymentErrors.cardNumber}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-sm text-slate-700 mb-1">
                        Expiry (MM/YY) <span className="text-red-500">*</span>
                      </label>
                      <input
                        ref={expiryRef}
                        type="text"
                        placeholder="MM/YY"
                        value={paymentDetails.expiry}
                        onBlur={() =>
                          setTouchedFields((prev) => ({
                            ...prev,
                            expiry: true,
                          }))
                        }
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^\d/]/g, "");
                          if (
                            val.length === 2 &&
                            !val.includes("/") &&
                            paymentDetails.expiry.length !== 3
                          ) {
                            val += "/";
                          }
                          if (val.length <= 5) {
                            setPaymentDetails((prev) => ({
                              ...prev,
                              expiry: val,
                            }));
                          }
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 bg-white ${getInputClassName("expiry") || "border-slate-200 focus:border-[#1B2340] focus:ring-slate-100"}`}
                      />
                      {touchedFields.expiry && paymentErrors.expiry && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {paymentErrors.expiry}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        label="CVC"
                        placeholder="123"
                        value={paymentDetails.cvc}
                        onBlur={() =>
                          setTouchedFields((prev) => ({ ...prev, cvc: true }))
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 4)
                            setPaymentDetails((prev) => ({
                              ...prev,
                              cvc: val,
                            }));
                        }}
                        className={getInputClassName("cvc")}
                      />
                      {touchedFields.cvc && paymentErrors.cvc && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {paymentErrors.cvc}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "COD" && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Cash on Delivery
                  </h3>
                  <p className="text-sm text-slate-500">
                    Pay conveniently at your doorstep when your order arrives.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-1/3 h-[60px] border border-slate-200 rounded-xl text-base font-bold text-[#1B2340] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <Button
                  type="submit"
                  className="flex-1 h-[60px] bg-[#1B2340] hover:bg-[#252f52] text-white border-none text-base rounded-xl flex items-center justify-center gap-2"
                >
                  Review Order <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Your payment
                information is secure and encrypted
              </div>
            </div>
          </form>
        );

      case 3:
        const shippingAddr = addresses.find((a) => a.id === shippingAddressId);
        return (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1B2340] flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" /> Review Your Order
            </h2>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" /> Shipping Details
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              {shippingAddr ? (
                <div className="text-sm space-y-1">
                  <p className="text-[#1B2340]">{shippingAddr.recipientName}</p>
                  <p className="text-slate-500">{shippingAddr.street}</p>
                  <p className="text-slate-500">
                    {shippingAddr.city}, {shippingAddr.state}{" "}
                    {shippingAddr.zipCode}
                  </p>
                  <p className="text-slate-500">{shippingAddr.country}</p>
                  <p className="text-slate-500 mt-2 flex justify-between">
                    <span>
                      Method:{" "}
                      <span className="text-[#1B2340]">
                        {deliveryOption === "express"
                          ? "Express Delivery"
                          : "Standard Delivery"}
                      </span>
                    </span>
                    <span className="text-[#1B2340]">
                      {deliveryOption === "express" ? "₹149" : "FREE"}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-red-500 text-sm">Missing Address</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Payment
                  Details
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="text-sm">
                {paymentMethod === "UPI" && (
                  <p className="text-slate-700">
                    <span className="text-slate-500 mr-2">UPI ID:</span>
                    <span className="">
                      {paymentDetails.upiId || paymentDetails.upiProvider}
                    </span>
                  </p>
                )}
                {paymentMethod === "CREDIT_CARD" && (
                  <>
                    <p className="text-slate-700">
                      <span className="text-slate-500 mr-2">Name:</span>
                      <span className="">{paymentDetails.nameOnCard}</span>
                    </p>
                    <p className="text-slate-700 mt-1">
                      <span className="text-slate-500 mr-2">Card:</span>
                      <span className="">
                        •••• {paymentDetails.cardNumber.slice(-4) || "XXXX"}
                      </span>
                    </p>
                  </>
                )}
                {paymentMethod === "COD" && (
                  <p className="text-[#1B2340]">Cash on Delivery</p>
                )}
              </div>
            </div>

            {checkoutError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {checkoutError}
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto h-[60px] text-slate-700 border-slate-200 hover:bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Payment
              </Button>
              <Button
                onClick={handlePlaceOrder}
                className="w-full h-[60px] bg-[#1B2340] hover:bg-[#252f52] text-white border-none text-base rounded-2xl flex items-center justify-center gap-2 shadow-md flex-1"
                isLoading={isOrderLoading}
              >
                Place Order & Pay {formatPrice(total)}
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ── Benefits Strip ──
  const BENEFITS = [
    { icon: Truck, title: "Free Delivery", sub: "On orders above ₹999" },
    { icon: RefreshCcw, title: "Easy Returns", sub: "Within 30 days" },
    { icon: ShieldCheck, title: "2-Year Warranty", sub: "On all products" },
    { icon: Headphones, title: "Dedicated Support", sub: "We're here to help" },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[32px] pt-[32px] pb-[48px]">
        {renderStepper()}

        <div className="grid grid-cols-1 lg:grid-cols-[65%_calc(35%-24px)] gap-6 w-full items-start">
          {/* Main Content Area (Left Column) */}
          <div className="w-full min-w-0">{renderStepContent()}</div>

          {/* Order Summary Sidebar (Right Column) */}
          <div className="w-full sticky top-24">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#1B2340]">
                  Order Summary{" "}
                  <span className=" text-slate-500">
                    ({validItems.length} Items)
                  </span>
                </h3>
                <Link
                  to="/cart"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Edit Cart <Edit2 className="w-3 h-3" />
                </Link>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {validItems.map((item) => {
                  const itemPrice =
                    item.product.finalPrice || item.product.price;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <ImageFallback
                          src={getOptimizedUrl(
                            item.product.thumbnail,
                            "thumbnail",
                          )}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-[#1B2340] line-clamp-1">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] text-[#1B2340] tabular-nums">
                          {formatPrice(itemPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculations */}
              <div className="border-t border-slate-100 pt-5 space-y-[14px] mb-5">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500">
                    Subtotal ({validItems.length} items)
                  </span>
                  <span className="text-[#1B2340] tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-500">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    <span className="text-[#1B2340] tabular-nums">
                      {formatPrice(shipping)}
                    </span>
                  )}
                </div>
                {savedAmount > 0 && (
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-emerald-600">
                      You saved {formatPrice(savedAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-slate-100 pt-6 pb-6">
                <div className="flex justify-between items-center">
                  <span className="text-base text-[#1B2340]">Total</span>
                  <span className="text-[22px] text-[#1B2340] tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Reward Points Banner */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3 mb-4">
                <Medal className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800">
                  Earn <span className="">{rewardPoints} Reward Points</span> on
                  this order
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                {[
                  { icon: Lock, text: "Secure\nPayments" },
                  { icon: RefreshCcw, text: "Easy\nReturns" },
                  { icon: ShieldCheck, text: "100% Authentic\nProducts" },
                  { icon: Headphones, text: "Dedicated\nSupport" },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-[9px] text-slate-500 leading-tight whitespace-pre-line">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Safe & Secure Blue Banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 mb-4">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-800">
                    Safe and Secure Checkout
                  </p>
                  <p className="text-[10px] text-blue-600 mt-1 leading-snug">
                    We use industry-standard encryption to protect your details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Benefits Strip */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sm:divide-x sm:divide-slate-200">
            {BENEFITS.map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="flex-1 flex items-center justify-center p-6 gap-4"
              >
                <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon
                    className="text-[#1B2340] w-4.5 h-4.5"
                    style={{ width: 18, height: 18 }}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-xs text-[#1B2340]">{title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
