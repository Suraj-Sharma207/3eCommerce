import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import useOrderStore from '../../store/orderStore';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';

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
      <div className="w-full max-w-2xl bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-secondary-100 text-center relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-success-50 to-transparent -z-10" />

        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <CheckCircle2 className="w-10 h-10 text-success-600" />
          <div className="absolute inset-0 rounded-full border-4 border-success-200 animate-ping opacity-20"></div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-2">Order Confirmed!</h1>
        <p className="text-lg text-text-secondary mb-8">
          Thank you for shopping with LuxeHome. Your order has been placed successfully and is now being processed.
        </p>

        <div className="bg-secondary-50 rounded-xl p-6 text-left mb-8 border border-secondary-200 shadow-inner">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-secondary-200">
            <Package className="w-5 h-5 text-text-muted" />
            <span className="font-bold text-text-primary uppercase tracking-wider text-sm">Order Details</span>
          </div>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-text-muted mb-1">Order Number</p>
              <p className="font-bold text-text-primary">{currentOrder.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Date</p>
              <p className="font-bold text-text-primary">{new Date(currentOrder.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Total Amount</p>
              <p className="font-bold text-text-primary">${currentOrder.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Payment Status</p>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                currentOrder.paymentStatus === 'PAID' ? 'bg-success-100 text-success-700' : 'bg-warning text-white'
              }`}>
                {currentOrder.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as={Link} to={`/orders/${currentOrder.id}`} variant="outline" size="lg" className="sm:w-auto">
            View Order Status
          </Button>
          <Button as={Link} to="/products" size="lg" className="sm:w-auto group">
            Continue Shopping
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

      </div>
    </PageContainer>
  );
};

export default OrderSuccessPage;
