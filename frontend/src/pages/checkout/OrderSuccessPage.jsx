import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import useOrderStore from '../../store/orderStore';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const { fetchOrderById, currentOrder } = useOrderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        await fetchOrderById(id);
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, fetchOrderById]);

  if (loading) return <div className="h-[60vh] flex items-center justify-center">Loading...</div>;
  if (!currentOrder) return <div className="h-[60vh] flex items-center justify-center">Order not found</div>;

  return (
    <PageContainer className="py-20 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 shadow-xl border border-border-light text-center relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-success-50 to-transparent -z-10" />

        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle2 className="w-10 h-10 text-success-600" />
          <div className="absolute inset-0 rounded-full border-4 border-success-200 animate-ping opacity-20"></div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-brand-600 mb-2">Order Confirmed!</h1>
        <p className="text-lg text-text-secondary mb-8">
          Thank you for shopping with LuxeHome. Your order has been placed successfully and is now being processed.
        </p>

        <div className="bg-surface-background rounded-xl p-6 text-left mb-8 border border-border shadow-inner">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <Package className="w-5 h-5 text-text-muted" />
            <span className="font-bold text-text-brand-600 uppercase tracking-wider text-sm">Order Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-y-4 text-sm mb-6 pb-6 border-b border-border">
            <div>
              <p className="text-text-muted mb-1">Order Number</p>
              <p className="font-bold text-text-brand-600">{currentOrder.orderNumber}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Date</p>
              <p className="font-bold text-text-brand-600">{new Date(currentOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Total Paid</p>
              <p className="font-bold text-text-brand-600">{formatPrice(currentOrder.totalAmount)}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Payment Status</p>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                currentOrder.paymentStatus === 'PAID' ? 'bg-success-100 text-success-700' : 'bg-warning text-white'
              }`}>
                {currentOrder.paymentStatus}
              </span>
            </div>
            <div>
              <p className="text-text-muted mb-1">Payment Method</p>
              <p className="font-medium text-text-brand-600">{currentOrder.paymentMethod}</p>
            </div>
            {currentOrder.transactionRef && (
              <div>
                <p className="text-text-muted mb-1">Transaction Ref</p>
                <p className="font-medium text-text-brand-600 text-xs break-all">{currentOrder.transactionRef}</p>
              </div>
            )}
          </div>
          
          <div className="mb-6 pb-6 border-b border-border">
            <p className="text-text-muted text-sm mb-2 font-medium">Shipping Address</p>
            {currentOrder.shippingAddress && (
              <div className="text-sm text-text-brand-600">
                <p className="font-bold">{currentOrder.shippingAddress.recipientName}</p>
                <p>{currentOrder.shippingAddress.street}</p>
                <p>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state} {currentOrder.shippingAddress.zipCode}</p>
                <p>{currentOrder.shippingAddress.country}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-text-muted text-sm mb-3 font-medium">Ordered Products</p>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
              {currentOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text-muted">{item.quantity}x</span>
                    <span className="text-text-brand-600 line-clamp-1">{item.product?.name || 'Product'}</span>
                  </div>
                  <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full mt-10">
          <Button as={Link} to={`/orders`} variant="outline" size="lg" className="flex-1">
            View My Orders
          </Button>
          <Button as={Link} to="/products" size="lg" className="flex-1 group">
            Continue Shopping
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

      </div>
    </PageContainer>
  );
};

export default OrderSuccessPage;
