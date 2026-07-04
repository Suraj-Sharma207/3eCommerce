import React, { useEffect, useState } from'react';
import { useParams, Link } from'react-router-dom';
import PageContainer from'../../components/layout/PageContainer';
import useOrderStore from'../../store/orderStore';
import toast from'react-hot-toast';
import { 
 Check, ShieldCheck, FileText, Truck, MapPin, 
 Headphones, Package, Clock, RotateCcw, Shield, 
 ChevronRight, Edit2, Mail, Bell, MessageSquare
} from'lucide-react';
import { formatPrice } from'../../utils/currency';
import ImageFallback from'../../components/ui/ImageFallback';
import { getOptimizedUrl } from'../../utils/cloudinary';

const OrderSuccessPage = () => {
 const { id } = useParams();
 const { fetchOrderById, currentOrder } = useOrderStore();
 const [loading, setLoading] = useState(true);
 const toastShownRef = React.useRef(false);

 useEffect(() => {
 const loadOrder = async () => {
 if (id) {
 await fetchOrderById(id);
 setLoading(false);
 }
 };
 loadOrder();
 }, [id, fetchOrderById]);

 useEffect(() => {
 if (currentOrder && !toastShownRef.current) {
 toastShownRef.current = true;
 toast.success(
 <div style={{ display:'flex', flexDirection:'column', gap:'4px', textAlign:'left' }}>
 <div style={{ fontWeight:'400', fontSize:'14px' }}>
 Order placed successfully.
 </div>
 <div style={{ fontSize:'13px', fontWeight:'400', opacity: 0.8 }}>
 A confirmation email has been sent to your registered email address.
 </div>
 </div>,
 {
 id:`order-success-${currentOrder.id}`,
 duration: 5000,
 position:"top-center"
 }
 );
 }
 }, [currentOrder]);

 if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Loading order details...</div>;
 if (!currentOrder) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Order not found</div>;

 const totalItems = currentOrder.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
 const email = currentOrder.user?.email ||'your email';

 return (
 <PageContainer className="py-12 md:py-16 flex justify-center bg-[#fafbfc]">
 <div className="w-full max-w-[1120px] relative">
 
 {/* Top Hero Section */}
 <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
 <div className="relative mb-6">
 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative z-10 shadow-sm">
 <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
 </div>
 {/* Confetti dots simulation */}
 <div className="absolute top-0 left-0 w-full h-full">
 <div className="absolute -top-4 -left-6 w-2 h-2 bg-yellow-400 rounded-full opacity-60"></div>
 <div className="absolute top-2 -right-8 w-2.5 h-2.5 bg-green-400 rounded-full opacity-60"></div>
 <div className="absolute bottom-4 -left-8 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60"></div>
 <div className="absolute -bottom-2 -right-4 w-2 h-2 bg-pink-400 rounded-full opacity-60"></div>
 <div className="absolute -top-2 right-4 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-60"></div>
 </div>
 </div>
 
 <h1 className="text-3xl md:text-4xl font-bold text-[#1B2340] mb-3 tracking-tight">Thank you for your order!</h1>
 <p className="text-slate-500 mb-1">Your order has been placed successfully.</p>
 <p className="text-slate-500 mb-6">We've sent a confirmation email to <span className="text-[#1B2340]">{email}</span></p>

 <div className="bg-green-50/80 border border-green-200 rounded-xl px-6 py-4 flex items-center gap-3 text-green-800 text-sm shadow-sm">
 <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
 Your order is confirmed and payment was successful.
 </div>
 </div>

 {/* 2-Column Grid */}
 <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
 
 {/* Main Content: Left Column (60%) */}
 <div className="w-full lg:w-[60%] flex flex-col gap-6">
 
 {/* Order Details Card */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-6">
 <FileText className="w-5 h-5 text-[#1B2340]" />
 <h2 className="text-lg font-bold text-[#1B2340]">Order Details</h2>
 </div>
 
 <div className="space-y-4 mb-6">
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Order Number</span>
 <span className="text-[#1B2340]">#{currentOrder.id.slice(0, 8).toUpperCase()}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Order Date</span>
 <span className="text-[#1B2340]">{new Intl.DateTimeFormat('en-US', { month:'short', day:'2-digit', year:'numeric', hour:'numeric', minute:'2-digit' }).format(new Date(currentOrder.createdAt))}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Payment Method</span>
 <span className="text-[#1B2340] uppercase">{currentOrder.paymentMethod ||'UPI'}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Payment Status</span>
 <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs tracking-wide">Paid</span>
 </div>
 </div>

 <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
 <span className="text-[#1B2340]">Total Amount</span>
 <span className="text-xl text-[#1B2340]">{formatPrice(currentOrder.totalAmount)}</span>
 </div>
 </div>

 {/* Track Your Order Card */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-2">
 <Truck className="w-5 h-5 text-[#1B2340]" />
 <h2 className="text-lg font-bold text-[#1B2340]">Track Your Order</h2>
 </div>
 <p className="text-sm text-slate-500 mb-8">We'll notify you once your order is shipped.</p>
 
 {/* Stepper */}
 <div className="relative flex justify-between items-start mb-8 px-4">
 <div className="absolute top-5 left-10 right-10 h-[2px] bg-slate-100 -z-10"></div>
 <div className="absolute top-5 left-10 w-[15%] h-[2px] bg-green-500 -z-10"></div>

 {/* Step 1 */}
 <div className="flex flex-col items-center">
 <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center mb-3 shadow-sm shadow-green-200">
 <Check className="w-5 h-5 text-white" strokeWidth={3} />
 </div>
 <span className="text-xs text-green-600 mb-1">Order Placed</span>
 <span className="text-[10px] text-slate-400">{new Intl.DateTimeFormat('en-US', { month:'short', day:'2-digit', year:'numeric' }).format(new Date(currentOrder.createdAt))}</span>
 </div>

 {/* Step 2 */}
 <div className="flex flex-col items-center">
 <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-3">
 <Package className="w-5 h-5 text-slate-400" />
 </div>
 <span className="text-xs text-slate-500">Confirmed</span>
 </div>

 {/* Step 3 */}
 <div className="flex flex-col items-center">
 <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-3">
 <Truck className="w-5 h-5 text-slate-400" />
 </div>
 <span className="text-xs text-slate-500">Shipped</span>
 </div>

 {/* Step 4 */}
 <div className="flex flex-col items-center">
 <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-3">
 <MapPin className="w-5 h-5 text-slate-400" />
 </div>
 <span className="text-xs text-slate-500">Delivered</span>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-100">
 <Link to={`/orders/${currentOrder.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-sm text-[#1B2340] rounded-xl transition-colors">
 View Order Details <ChevronRight className="w-4 h-4" />
 </Link>
 </div>
 </div>

 {/* Need Help Card */}
 <div className="bg-[#f8faff] rounded-2xl border border-blue-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-4 text-left w-full sm:w-auto">
 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-blue-50 shrink-0 shadow-sm">
 <Headphones className="w-6 h-6 text-[#1B2340]" />
 </div>
 <div>
 <h3 className="font-bold text-[#1B2340]">Need help? We're here for you.</h3>
 <p className="text-sm text-slate-500">Our customer support team is available 24/7 to assist you.</p>
 </div>
 </div>
 <button className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-sm text-[#1B2340] rounded-xl transition-colors shrink-0">
 Contact Support
 </button>
 </div>

 {/* Benefits Footer */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap lg:flex-nowrap justify-between gap-6 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
 <Truck className="w-5 h-5 text-[#1B2340]" />
 </div>
 <div>
 <p className="text-xs text-[#1B2340]">Free Delivery</p>
 <p className="text-[11px] text-slate-500">On orders above ₹999</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
 <RotateCcw className="w-5 h-5 text-[#1B2340]" />
 </div>
 <div>
 <p className="text-xs text-[#1B2340]">Easy Returns</p>
 <p className="text-[11px] text-slate-500">Within 30 days</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
 <Shield className="w-5 h-5 text-[#1B2340]" />
 </div>
 <div>
 <p className="text-xs text-[#1B2340]">2-Year Warranty</p>
 <p className="text-[11px] text-slate-500">On all products</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
 <Headphones className="w-5 h-5 text-[#1B2340]" />
 </div>
 <div>
 <p className="text-xs text-[#1B2340]">Dedicated Support</p>
 <p className="text-[11px] text-slate-500">We're here to help</p>
 </div>
 </div>
 </div>

 </div>

 {/* Sidebar: Right Column (40%) */}
 <div className="w-full lg:w-[40%] flex flex-col gap-6 lg:sticky lg:top-24 h-fit">
 
 {/* Order Summary Card */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-2">
 <FileText className="w-5 h-5 text-[#1B2340]" />
 <h2 className="text-lg font-bold text-[#1B2340]">Order Summary <span className="text-slate-500 text-sm">({totalItems} Items)</span></h2>
 </div>
 <Link to="/" className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
 Edit Cart <Edit2 className="w-3 h-3" />
 </Link>
 </div>

 <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
 {currentOrder.items?.map((item, idx) => (
 <div key={idx} className="flex gap-4">
 <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
 <ImageFallback 
 src={getOptimizedUrl(item.product.images[0]?.url, 150, 150)} 
 alt={item.product.name} 
 className="w-full h-full object-cover mix-blend-multiply" 
 />
 </div>
 <div className="flex-1">
 <div className="flex justify-between items-start">
 <p className="text-sm text-[#1B2340] line-clamp-2 pr-4">{item.product.name}</p>
 <p className="text-sm text-[#1B2340] shrink-0">{formatPrice(item.price)}</p>
 </div>
 <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="pt-4 border-t border-slate-100 space-y-3 mb-4">
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Subtotal ({totalItems} items)</span>
 <span className="text-[#1B2340]">{formatPrice(currentOrder.subTotal)}</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Shipping</span>
 {currentOrder.shippingCharge === 0 ? (
 <span className="text-emerald-600">FREE</span>
 ) : (
 <span className="text-[#1B2340]">{formatPrice(currentOrder.shippingCharge)}</span>
 )}
 </div>
 {currentOrder.shippingCharge === 0 && (
 <div className="flex justify-between items-center text-sm">
 <span className="text-emerald-600">You saved ₹99.00</span>
 <span></span>
 </div>
 )}
 </div>

 <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
 <span className="text-lg text-[#1B2340]">Total</span>
 <span className="text-2xl text-[#1B2340]">{formatPrice(currentOrder.totalAmount)}</span>
 </div>
 </div>

 {/* What's Next Card */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
 <h2 className="text-lg font-bold text-[#1B2340] mb-6">What's Next?</h2>
 
 <div className="space-y-6">
 <div className="flex gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm text-[#1B2340] mb-0.5">Order Confirmation</p>
 <p className="text-xs text-slate-500">We've sent the order details to your email</p>
 </div>
 </div>

 <div className="flex gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
 <Package className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm text-[#1B2340] mb-0.5">Processing</p>
 <p className="text-xs text-slate-500">We are preparing your items for shipment</p>
 </div>
 </div>

 <div className="flex gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
 <Truck className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm text-[#1B2340] mb-0.5">Shipping Updates</p>
 <p className="text-xs text-slate-500">You will receive tracking details via email & SMS</p>
 </div>
 </div>

 <div className="flex gap-4">
 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
 <MapPin className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm text-[#1B2340] mb-0.5">Delivery</p>
 <p className="text-xs text-slate-500">Our delivery partner will contact you before arrival</p>
 </div>
 </div>
 </div>
 </div>

 </div>
 
 </div>
 </div>
 </PageContainer>
 );
};

export default OrderSuccessPage;
