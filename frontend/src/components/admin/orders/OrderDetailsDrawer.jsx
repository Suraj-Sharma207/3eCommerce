import React, { useEffect, useState } from'react';
import { createPortal } from'react-dom';
import { motion, AnimatePresence } from'framer-motion';
import { X, Printer, Copy, User, MapPin, CreditCard, Truck, Calendar, ShoppingBag, Info } from'lucide-react';
import api from'../../../services/api';
import { formatPrice } from'../../../utils/currency';
import { useBrandingStore } from'../../../store/brandingStore';

const PAYMENT_COLORS = {
 PAID:'bg-green-100 text-green-700',
 PENDING:'bg-amber-100 text-amber-700',
 FAILED:'bg-red-100 text-red-700',
 REFUNDED:'bg-gray-200 text-gray-700',
};

const STATUS_COLORS = {
 PENDING:'bg-amber-100 text-amber-700',
 CONFIRMED:'bg-blue-100 text-blue-700',
 SHIPPED:'bg-indigo-100 text-indigo-700',
 OUT_FOR_DELIVERY:'bg-purple-100 text-purple-700',
 DELIVERED:'bg-green-100 text-green-700',
 CANCELLED:'bg-red-100 text-red-700',
};

const OrderDetailsSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Order Overview */}
    <div className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded"></div>
          <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-slate-200 rounded"></div>
          <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-48 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="h-3 w-28 bg-slate-200 rounded"></div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
        <div className="h-4 w-36 bg-slate-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-48 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
          <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
        </div>
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
            <div className="h-3 w-28 bg-slate-200 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Ordered Products */}
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="h-4 w-32 bg-slate-200 rounded"></div>
      </div>
      <div className="divide-y divide-border">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-slate-200 rounded-lg shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-3.5 w-20 bg-slate-200 rounded mt-1"></div>
              </div>
            </div>
            <div className="h-4 w-16 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Payment Info & Order Summary */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
        <div className="h-4 w-24 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
            <div className="h-3.5 w-20 bg-slate-200 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
            <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-3">
        <div className="h-4 w-28 bg-slate-200 rounded mb-1"></div>
        <div className="space-y-2.5">
          <div className="flex justify-between">
            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
            <div className="h-3.5 w-12 bg-slate-200 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
            <div className="h-3.5 w-12 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="pt-3 mt-3 border-t border-border flex justify-between">
          <div className="h-4 w-20 bg-slate-200 rounded"></div>
          <div className="h-5 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4 mb-8">
      <div className="h-4 w-28 bg-slate-200 rounded"></div>
      <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
    </div>

    {/* Padding for bottom */}
    <div className="h-6"></div>
  </div>
);

const OrderDetailsDrawer = ({ orderId, onClose }) => {
 const [order, setOrder] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const { branding, fetchBranding } = useBrandingStore();

 useEffect(() => {
   fetchBranding();
 }, [fetchBranding]);

 useEffect(() => {
 if (!orderId) {
 setOrder(null);
 setError(null);
 return;
 }

 const fetchOrder = async () => {
 setLoading(true);
 setError(null);
 try {
 const response = await api.get(`/admin/orders/${orderId}`);
 setOrder(response.data.data);
 } catch (err) {
 console.error('Failed to fetch order details:', err);
 setError('Failed to load order details. Please try again.');
 } finally {
 setLoading(false);
 }
 };

 fetchOrder();
 }, [orderId]);

 // Handle ESC to close
 useEffect(() => {
 const handleEsc = (e) => {
 if (e.key ==='Escape') onClose();
 };
 window.addEventListener('keydown', handleEsc);
 return () => window.removeEventListener('keydown', handleEsc);
 }, [onClose]);

 const copyToClipboard = (text, label) => {
 navigator.clipboard.writeText(text);
 // Optional: could trigger a small toast notification here
 };

 const printOrder = () => {
 window.print();
 };

 const formatDate = (dateString) => {
 if (!dateString) return'';
 const date = new Date(dateString);
 const parts = new Intl.DateTimeFormat('en-GB', {
 day:'numeric', month:'short', year:'numeric',
 hour:'numeric', minute:'2-digit', hour12: true
 }).formatToParts(date);
 
 let day ='', month ='', year ='', hour ='', minute ='', dayPeriod ='';
 for (const part of parts) {
 if (part.type ==='day') day = part.value;
 if (part.type ==='month') month = part.value;
 if (part.type ==='year') year = part.value;
 if (part.type ==='hour') hour = part.value;
 if (part.type ==='minute') minute = part.value;
 if (part.type ==='dayPeriod') dayPeriod = part.value.toUpperCase();
 }
 return`${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
 };

 return createPortal(
 <AnimatePresence>
 {orderId && (
 <>
  {/* Backdrop */}
  <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  onClick={onClose}
  className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm print:hidden"
  />

  {/* Drawer */}
  <motion.div
  initial={{ x:'100%' }}
  animate={{ x: 0 }}
  exit={{ x:'100%' }}
  transition={{ type:'spring', damping: 25, stiffness: 200 }}
  className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] md:w-[600px] lg:w-[700px] bg-surface-background z-50 shadow-2xl flex flex-col overflow-hidden min-h-0 print:absolute print:inset-0 print:w-full print:h-auto print:min-h-screen print:bg-white print:shadow-none print:overflow-visible print:p-0"
  >
  {/* Header */}
  <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-white print:hidden">
  <div className="flex items-center gap-3">
  <button
  onClick={onClose}
  className="p-2 -ml-2 rounded-full hover:bg-surface-background text-text-secondary transition-colors"
  >
  <X className="w-5 h-5" />
  </button>
  <h2 className="text-xl font-bold text-text-brand-600 font-mono">
  {order ?`#${order.orderNumber || order.id.split('-')[0]}` :'Order Details'}
  </h2>
  </div>
  
  {order && (
  <div className="flex items-center gap-2">
  <button 
  onClick={() => printOrder()}
  className="p-2 text-text-secondary hover:bg-surface-background hover:text-brand-600 rounded-lg transition-colors flex items-center gap-2"
  title="Print Invoice"
  >
  <Printer className="w-4 h-4" />
  </button>
  </div>
  )}
  </div>

  {/* Content Body */}
  <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-background/50 min-h-0 print:hidden">
  {loading ? (
  <OrderDetailsSkeleton />
 ) : error ? (
 <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-red-50 rounded-xl p-6 border border-red-100">
 <Info className="w-8 h-8 text-red-500" />
 <p className="text-red-700 text-center">{error}</p>
 <button 
 onClick={onClose}
 className="px-4 py-2 bg-white text-text-primary rounded-lg shadow-sm border border-border text-sm hover:bg-gray-50"
 >
 Close
 </button>
 </div>
 ) : order ? (
 <>
 {/* Order Overview */}
 <div className="bg-white rounded-xl border border-border p-5 space-y-4 shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <p className="text-sm text-text-muted mb-1 flex items-center gap-1 font-medium">
 <Calendar className="w-4 h-4" /> Placed On
 </p>
 <p className="text-text-primary">
 {formatDate(order.createdAt)}
 </p>
 </div>
 <div>
 <p className="text-sm text-text-muted mb-1 flex items-center gap-1 font-medium">
 <ShoppingBag className="w-4 h-4" /> Status
 </p>
 <span className={`px-2 py-1 text-xs font-bold rounded-md ${STATUS_COLORS[order.orderStatus] ||'bg-gray-100 text-gray-700'}`}>
 {order.orderStatus}
 </span>
 </div>
 <div>
 <p className="text-sm text-text-muted mb-1 flex items-center gap-1 font-medium">
 <CreditCard className="w-4 h-4" /> Payment
 </p>
 <span className={`px-2 py-1 text-xs font-bold rounded-md ${PAYMENT_COLORS[order.paymentStatus] ||'bg-gray-100 text-gray-700'}`}>
 {order.paymentStatus}
 </span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Customer Info */}
 <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider flex items-center gap-2">
 <User className="w-4 h-4" /> Customer
 </h3>
 <div className="flex items-center gap-3">
 {order.user?.avatar ? (
 <img src={order.user.avatar} alt={order.user.name} className="w-10 h-10 rounded-full object-cover" />
 ) : (
 <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm">
 {order.user?.name?.charAt(0)?.toUpperCase() ||'U'}
 </div>
 )}
 <div>
 <p className="text-text-primary text-sm">{order.user?.name}</p>
 <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(order.user?.email)}>
 <p className="text-sm text-text-secondary">{order.user?.email}</p>
 <Copy className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity font-medium" />
 </div>
 </div>
 </div>
 {order.user?.phone && (
 <p className="text-sm text-text-secondary">{order.user.phone}</p>
 )}
 </div>

 {/* Shipping Address */}
 <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider flex items-center gap-2">
 <MapPin className="w-4 h-4" /> Shipping Address
 </h3>
 {order.shippingAddress ? (
 <div className="text-sm text-text-secondary space-y-1">
 <p className="text-text-primary">
 {order.shippingAddress.recipientName || order.shippingAddress.name || order.user?.name}
 </p>
 {(order.shippingAddress.street || order.shippingAddress.addressLine1) && (
 <p>{order.shippingAddress.street || order.shippingAddress.addressLine1}</p>
 )}
 {(order.shippingAddress.landmark || order.shippingAddress.addressLine2) && (
 <p>{order.shippingAddress.landmark || order.shippingAddress.addressLine2}</p>
 )}
 {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.zipCode || order.shippingAddress.pincode) && (
 <p>
 {[
 order.shippingAddress.city, 
 order.shippingAddress.state, 
 order.shippingAddress.zipCode || order.shippingAddress.pincode
 ].filter(Boolean).join(',')}
 </p>
 )}
 {order.shippingAddress.country && (
 <p>{order.shippingAddress.country}</p>
 )}
 {(order.shippingAddress.phoneNumber || order.shippingAddress.phone) && (
 <p className="pt-1">Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phone}</p>
 )}
 <div className="pt-3 mt-3 border-t border-border space-y-1">
 <p className="flex justify-between"><span className="text-text-muted font-medium">Method:</span> <span className="text-text-primary capitalize">{order.deliveryMethod ==='express' ?'Express Delivery' :'Standard Delivery'}</span></p>
 {order.estimatedDelivery && (
 <p className="flex justify-between"><span className="text-text-muted font-medium">Estimated:</span> <span className="text-text-primary">{order.estimatedDelivery}</span></p>
 )}
 </div>
 </div>
 ) : (
 <p className="text-sm text-text-muted italic font-medium">No shipping address provided.</p>
 )}
 </div>
 </div>

 {/* Ordered Products */}
 <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
 <div className="p-5 border-b border-border">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider">Ordered Items ({order.items?.length || 0})</h3>
 </div>
 <div className="divide-y divide-border">
 {order.items?.map((item) => {
 const thumb = item.product?.images?.[0]?.url;
 return (
 <div key={item.id} className="p-4 flex items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 {thumb ? (
 <img src={thumb} alt={item.product?.name} className="w-14 h-14 object-cover rounded-lg border border-border" />
 ) : (
 <div className="w-14 h-14 bg-gray-100 rounded-lg border border-border flex items-center justify-center">
 <ShoppingBag className="w-6 h-6 text-gray-300" />
 </div>
 )}
 <div>
 <p className="text-text-primary text-sm line-clamp-1">{item.product?.name ||'Unknown Product'}</p>
 <p className="text-xs text-text-muted flex gap-2 font-medium">
 <span>{item.product?.brand ||'No Brand'}</span>
 <span>•</span>
 <span>{item.product?.category ||'Uncategorized'}</span>
 </p>
 <p className="text-xs text-brand-600 mt-1">
 {formatPrice(item.price)} × {item.quantity}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-text-primary text-sm">
 {formatPrice(item.price * item.quantity)}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Order Summary & Payment Info */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider">Payment Info</h3>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-text-muted font-medium">Method</span>
 <span className="text-text-primary">{order.paymentMethod?.replace(/_/g,'') ||'N/A'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-text-muted font-medium">Transaction ID</span>
 <span className="font-mono text-xs text-text-primary break-all ml-4 text-right">
 {order.transactionRef ||'N/A'}
 </span>
 </div>
 {order.cardBrand && (
 <div className="flex justify-between">
 <span className="text-text-muted font-medium">Card</span>
 <span className="text-text-primary">{order.cardBrand} ending in {order.last4Digits}</span>
 </div>
 )}
 {order.maskedUPI && (
 <div className="flex justify-between">
 <span className="text-text-muted font-medium">UPI</span>
 <span className="text-text-primary">{order.maskedUPI}</span>
 </div>
 )}
 </div>
 </div>

 <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-3">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider mb-4">Order Summary</h3>
 <div className="flex justify-between text-sm">
 <span className="text-text-muted font-medium">Subtotal</span>
 <span className="">{formatPrice(order.subtotal || order.totalAmount)}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-text-muted font-medium">Shipping</span>
 <span className="">{formatPrice(order.shippingCharge || 0)}</span>
 </div>
 {(order.discountAmount > 0) && (
 <div className="flex justify-between text-sm text-green-600">
 <span>Discount</span>
 <span className="">-{formatPrice(order.discountAmount)}</span>
 </div>
 )}
 {(order.taxAmount > 0) && (
 <div className="flex justify-between text-sm">
 <span className="text-text-muted font-medium">Tax</span>
 <span className="">{formatPrice(order.taxAmount)}</span>
 </div>
 )}
 <div className="pt-3 mt-3 border-t border-border flex justify-between">
 <span className="text-text-primary text-base">Grand Total</span>
 <span className="text-brand-600 text-lg">{formatPrice(order.totalAmount)}</span>
 </div>
 </div>
 </div>

 {/* Notes & Actions */}
 <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4 mb-8">
 <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider">Internal Notes</h3>
 <p className="text-sm text-text-muted italic font-medium">No notes available.</p>
 </div>
 
 {/* Padding for bottom */}
 <div className="h-6"></div>
 </>
 ) : null}
 </div>
  {/* Footer Actions */}
  {order && !loading && !error && (
  <div className="shrink-0 p-4 border-t border-border bg-white flex justify-end gap-3 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] print:hidden">
  <button 
  onClick={() => copyToClipboard(order.id)}
  className="px-4 py-2 bg-surface-background text-text-secondary border border-border rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
  >
  <Copy className="w-4 h-4" /> Copy ID
  </button>
  <button 
  onClick={() => printOrder()}
  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
  >
  Download Invoice
  </button>
  </div>
  )}

  {/* Print Invoice Container */}
  {order && (
    <div className="hidden print:block w-full bg-white text-text-primary text-sm p-0 m-0">
      
      {/* Email Header Template */}
      <div style={{ backgroundColor: '#0b233f', padding: '24px 32px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700', margin: 0, fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '-0.5px' }}>
          {branding?.platformName || 'Store'}
        </h1>
      </div>

      {/* Invoice Content */}
      <div className="px-8 space-y-6">
        
        {/* Title & Metadata */}
        <div className="flex justify-between items-baseline border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Tax Invoice</h2>
            <p className="text-gray-500 text-xs mt-1">Invoice for Order #{order.orderNumber || order.id.split('-')[0]}</p>
          </div>
          <div className="text-right text-xs text-gray-500 space-y-1">
            <p><span className="font-semibold text-gray-700">Order Date:</span> {formatDate(order.createdAt)}</p>
            <p><span className="font-semibold text-gray-700">Payment Status:</span> <span className="uppercase font-bold text-green-700">{order.paymentStatus}</span></p>
            <p><span className="font-semibold text-gray-700">Payment Method:</span> <span className="uppercase">{order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span></p>
            {order.transactionRef && <p><span className="font-semibold text-gray-700">Transaction Ref:</span> <span className="font-mono">{order.transactionRef}</span></p>}
          </div>
        </div>

        {/* Seller & Customer Details */}
        <div className="grid grid-cols-2 gap-8 border-b border-gray-200 pb-6">
          <div>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Sold By (Seller)</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800 text-sm">{branding?.platformName || 'Store'} Private Limited</p>
              <p>123 Premium Way, Design District</p>
              <p>New Delhi, Delhi - 110001</p>
              <p>Email: support@{(branding?.platformName || 'store').toLowerCase().replace(/\s+/g, '')}.com</p>
              <p>Phone: +91 99999 99999</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Shipped To (Recipient)</h3>
            {order.shippingAddress ? (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800 text-sm">{order.shippingAddress.recipientName || order.shippingAddress.name || order.user?.name}</p>
                {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                {order.shippingAddress.landmark && <p>{order.shippingAddress.landmark}</p>}
                {(order.shippingAddress.city || order.shippingAddress.state || order.shippingAddress.zipCode) && (
                  <p>
                    {[
                      order.shippingAddress.city, 
                      order.shippingAddress.state, 
                      order.shippingAddress.zipCode || order.shippingAddress.pincode
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                {(order.shippingAddress.phoneNumber || order.shippingAddress.phone) && (
                  <p className="pt-0.5">Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phone}</p>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800 text-sm">{order.user?.name}</p>
                <p>Email: {order.user?.email}</p>
                {order.user?.phone && <p>Phone: {order.user.phone}</p>}
                <p className="italic text-gray-400">No shipping address provided.</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-3">Order Items</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">Brand & Category</th>
                <th className="py-2.5 px-3 text-center w-20">Qty</th>
                <th className="py-2.5 px-3 text-right w-24">Price</th>
                <th className="py-2.5 px-3 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order.items?.map((item) => (
                <tr key={item.id} className="text-gray-700">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-gray-800">{item.product?.name || 'Unknown Product'}</p>
                    {item.product?.sku && <p className="text-[10px] text-gray-400">SKU: {item.product.sku}</p>}
                  </td>
                  <td className="py-3 px-3 text-gray-500">
                    {item.product?.brand || 'No Brand'} / {item.product?.category || 'Uncategorized'}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{formatPrice(item.price)}</td>
                  <td className="py-3 px-3 text-right font-semibold">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations & Invoice Summary */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(order.subtotal || order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold">{formatPrice(order.shippingCharge || 0)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-700 font-medium">
                <span>Discount</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">{formatPrice(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-800 font-bold border-t border-gray-300 pt-2 text-sm">
              <span>Grand Total</span>
              <span className="text-brand-600">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes / Terms */}
        <div className="pt-6 border-t border-gray-200 text-[10px] text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">Terms & Conditions:</p>
          <p>1. This is a computer-generated invoice and does not require a physical signature.</p>
          <p>2. Goods once sold cannot be returned unless verified defective under initial inspection guidelines.</p>
          <p>3. Any disputes arising out of this transaction shall be subject to Delhi jurisdiction.</p>
      </div>

    </div>

  </div>
  )}
  </motion.div>
  </>
  )}
  </AnimatePresence>,
  document.body
 );
};

export default OrderDetailsDrawer;
