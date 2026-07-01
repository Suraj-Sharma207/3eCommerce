import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Copy, User, MapPin, CreditCard, Truck, Calendar, ShoppingBag, Loader2, Info } from 'lucide-react';
import api from '../../../services/api';
import { formatPrice } from '../../../utils/currency';

const PAYMENT_COLORS = {
  PAID: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-200 text-gray-700',
};

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const OrderDetailsDrawer = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (e.key === 'Escape') onClose();
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
    if (!dateString) return '';
    const date = new Date(dateString);
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).formatToParts(date);
    
    let day = '', month = '', year = '', hour = '', minute = '', dayPeriod = '';
    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    }
    return `${day} ${month} ${year}, ${hour}:${minute} ${dayPeriod}`;
  };

  return (
    <AnimatePresence>
      {orderId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 right-0 w-full sm:w-[500px] md:w-[600px] lg:w-[700px] bg-surface-background z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-full hover:bg-surface-background text-text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-text-brand-600 font-mono">
                  {order ? `#${order.orderNumber || order.id.split('-')[0]}` : 'Order Details'}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-background/50">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                  <p className="text-text-muted text-sm">Loading order details...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4 bg-red-50 rounded-xl p-6 border border-red-100">
                  <Info className="w-8 h-8 text-red-500" />
                  <p className="text-red-700 font-medium text-center">{error}</p>
                  <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-white text-text-primary rounded-lg shadow-sm border border-border text-sm font-medium hover:bg-gray-50"
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
                        <p className="text-sm text-text-muted mb-1 flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> Placed On
                        </p>
                        <p className="font-semibold text-text-primary">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1 flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" /> Status
                        </p>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-text-muted mb-1 flex items-center gap-1">
                          <CreditCard className="w-4 h-4" /> Payment
                        </p>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${PAYMENT_COLORS[order.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
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
                          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                            {order.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-text-primary text-sm">{order.user?.name}</p>
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(order.user?.email)}>
                            <p className="text-sm text-text-secondary">{order.user?.email}</p>
                            <Copy className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
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
                          <p className="font-medium text-text-primary">
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
                              ].filter(Boolean).join(', ')}
                            </p>
                          )}
                          {order.shippingAddress.country && (
                            <p>{order.shippingAddress.country}</p>
                          )}
                          {(order.shippingAddress.phoneNumber || order.shippingAddress.phone) && (
                            <p className="pt-1">Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phone}</p>
                          )}
                          <div className="pt-3 mt-3 border-t border-border space-y-1">
                            <p className="flex justify-between"><span className="text-text-muted">Method:</span> <span className="font-medium text-text-primary capitalize">{order.deliveryMethod === 'express' ? 'Express Delivery' : 'Standard Delivery'}</span></p>
                            {order.estimatedDelivery && (
                              <p className="flex justify-between"><span className="text-text-muted">Estimated:</span> <span className="font-medium text-text-primary">{order.estimatedDelivery}</span></p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic">No shipping address provided.</p>
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
                                <p className="font-medium text-text-primary text-sm line-clamp-1">{item.product?.name || 'Unknown Product'}</p>
                                <p className="text-xs text-text-muted flex gap-2">
                                  <span>{item.product?.brand || 'No Brand'}</span>
                                  <span>•</span>
                                  <span>{item.product?.category || 'Uncategorized'}</span>
                                </p>
                                <p className="text-xs text-brand-600 font-medium mt-1">
                                  {formatPrice(item.price)} × {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-text-primary text-sm">
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
                          <span className="text-text-muted">Method</span>
                          <span className="font-medium text-text-primary">{order.paymentMethod?.replace(/_/g, ' ') || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Transaction ID</span>
                          <span className="font-mono text-xs text-text-primary break-all ml-4 text-right">
                            {order.transactionRef || 'N/A'}
                          </span>
                        </div>
                        {order.cardBrand && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">Card</span>
                            <span className="font-medium text-text-primary">{order.cardBrand} ending in {order.last4Digits}</span>
                          </div>
                        )}
                        {order.maskedUPI && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">UPI</span>
                            <span className="font-medium text-text-primary">{order.maskedUPI}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-3">
                      <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider mb-4">Order Summary</h3>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Subtotal</span>
                        <span className="font-medium">{formatPrice(order.subtotal || order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Shipping</span>
                        <span className="font-medium">{formatPrice(order.shippingCharge || 0)}</span>
                      </div>
                      {(order.discountAmount > 0) && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(order.discountAmount)}</span>
                        </div>
                      )}
                      {(order.taxAmount > 0) && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">Tax</span>
                          <span className="font-medium">{formatPrice(order.taxAmount)}</span>
                        </div>
                      )}
                      <div className="pt-3 mt-3 border-t border-border flex justify-between">
                        <span className="font-bold text-text-primary text-base">Grand Total</span>
                        <span className="font-extrabold text-brand-600 text-lg">{formatPrice(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="bg-white rounded-xl border border-border p-5 shadow-sm space-y-4 mb-8">
                    <h3 className="font-bold text-text-brand-600 text-sm uppercase tracking-wider">Internal Notes</h3>
                    <p className="text-sm text-text-muted italic">No notes available.</p>
                  </div>
                  
                  {/* Padding for bottom */}
                  <div className="h-6"></div>
                </>
              ) : null}
            </div>
            
            {/* Footer Actions */}
            {order && !loading && !error && (
              <div className="shrink-0 p-4 border-t border-border bg-white flex justify-end gap-3 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsDrawer;
