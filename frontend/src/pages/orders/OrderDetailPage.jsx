import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import useOrderStore from '../../store/orderStore';
import ImageFallback from '../../components/ui/ImageFallback';
import { ChevronLeft, Truck, Package, CreditCard } from 'lucide-react';

const OrderDetailPage = () => {
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
    <PageContainer className="py-8 lg:py-12 max-w-5xl">
      <Link to="/orders" className="inline-flex items-center text-sm font-semibold text-text-muted hover:text-text-primary mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">Order Details</h1>
          <p className="text-text-secondary">Order #{currentOrder.id.split('-')[0].toUpperCase()} • Placed on {new Date(currentOrder.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
            <div className="p-6 border-b border-secondary-200 bg-secondary-50">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-text-muted" /> Items
              </h2>
            </div>
            <div className="divide-y divide-secondary-100">
              {currentOrder.items.map((item) => (
                <div key={item.id} className="p-6 flex gap-6 items-center">
                  <Link to={`/products/${item.productId}`} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-secondary-100">
                    <ImageFallback src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <Link to={`/products/${item.productId}`} className="text-base font-bold text-text-primary hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-text-secondary mb-2">Qty: {item.quantity}</p>
                    <p className="font-extrabold text-text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-bold text-text-primary mb-6 pb-4 border-b border-secondary-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-text-muted" /> Order Summary
            </h2>
            
            <div className="space-y-4 text-sm text-text-secondary mb-6">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-text-primary">${currentOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium text-text-primary">Free</span>
              </div>
            </div>

            <div className="border-t border-secondary-200 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-text-primary">Grand Total</span>
              <span className="text-xl font-extrabold text-text-primary">${currentOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
            <h2 className="text-lg font-bold text-text-primary mb-6 pb-4 border-b border-secondary-100 flex items-center gap-2">
              <Truck className="w-5 h-5 text-text-muted" /> Status
            </h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Order Status</p>
                <p className="font-medium text-text-primary">{currentOrder.orderStatus}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Payment Status</p>
                <p className="font-medium text-text-primary">{currentOrder.paymentStatus}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default OrderDetailPage;
