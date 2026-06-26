import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import useOrderStore from '../../store/orderStore';
import toast from 'react-hot-toast';

import SuccessHero from './components/SuccessHero';
import OrderSummaryCard from './components/OrderSummaryCard';
import ProductListCard from './components/ProductListCard';
import OrderTimeline from './components/OrderTimeline';
import ActionButtons from './components/ActionButtons';
import SuccessSidebar from './components/SuccessSidebar';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
            Order placed successfully.
          </div>
          <div style={{ color: '#6B7280', fontSize: '12px', fontWeight: '400', lineHeight: '1.4' }}>
            A confirmation email has been sent to your registered email address.
          </div>
        </div>,
        {
          id: `order-success-${currentOrder.id}`,
          duration: 5000,
          position: "top-center",
          style: {
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            padding: "12px 18px",
            maxWidth: "360px"
          }
        }
      );
    }
  }, [currentOrder]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>;
  if (!currentOrder) return <div className="min-h-[60vh] flex items-center justify-center">Order not found</div>;

  // Extract first name
  const firstName = currentOrder.shippingAddress?.recipientName?.split(' ')[0] || '';

  return (
    <PageContainer className="py-12 md:py-20 flex justify-center">
      <div className="w-full max-w-[1100px] relative">
        
        {/* Top Hero Section */}
        <SuccessHero customerName={firstName} />

        {/* 2-Column Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content: Left Column (65%) */}
          <div className="w-full lg:w-[65%] flex flex-col">
            <OrderSummaryCard order={currentOrder} />
            <OrderTimeline currentStatus={currentOrder.status || 'CONFIRMED'} />
            <ProductListCard items={currentOrder.items} />
            <div className="hidden lg:block">
              <ActionButtons orderId={currentOrder.id} />
            </div>
          </div>

          {/* Sidebar: Right Column (35%) */}
          <div className="w-full lg:w-[35%] flex flex-col">
            <SuccessSidebar order={currentOrder} />
            
            {/* Mobile Action Buttons (Sticky at bottom on mobile) */}
            <div className="lg:hidden mt-8 sticky bottom-4 z-50 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
              <ActionButtons orderId={currentOrder.id} />
            </div>
          </div>
          
        </div>
      </div>
    </PageContainer>
  );
};

export default OrderSuccessPage;
