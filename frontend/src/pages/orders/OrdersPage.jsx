import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import useOrderStore from '../../store/orderStore';
import { Package, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';

const OrdersPage = () => {
  const { orders, isLoading, fetchUserOrders } = useOrderStore();

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  if (!isLoading && orders.length === 0) {
    return (
      <PageContainer className="py-20">
        <EmptyState 
          title="No orders yet"
          message="You haven't placed any orders with us."
          actionLabel="Start Shopping"
          actionLink="/products"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-8 lg:py-12 max-w-5xl">
      <h1 className="text-3xl font-extrabold text-text-primary mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-secondary-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header */}
            <div className="bg-secondary-50 px-6 py-4 border-b border-secondary-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="block text-text-muted uppercase tracking-wider text-xs font-bold mb-1">Order Placed</span>
                  <span className="font-semibold text-text-primary">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-text-muted uppercase tracking-wider text-xs font-bold mb-1">Total</span>
                  <span className="font-semibold text-text-primary">${order.totalAmount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-text-muted uppercase tracking-wider text-xs font-bold mb-1">Order #</span>
                  <span className="font-semibold text-text-primary">{order.id.split('-')[0].toUpperCase()}</span>
                </div>
              </div>
              
              <Link 
                to={`/orders/${order.id}`}
                className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center group"
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-text-muted" />
                <h3 className="font-bold text-text-primary uppercase tracking-wider text-sm">
                  Status: 
                  <span className={`ml-2 inline-flex px-2 py-1 rounded text-xs ${
                    order.orderStatus === 'DELIVERED' ? 'bg-success-100 text-success-700' :
                    order.orderStatus === 'CANCELLED' ? 'bg-danger-light text-danger-dark' :
                    'bg-warning text-white'
                  }`}>
                    {order.orderStatus}
                  </span>
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {order.items.map((item) => (
                  <Link key={item.id} to={`/products/${item.productId}`} className="shrink-0 relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-secondary-100 group">
                    <img 
                      src={item.product.imageUrl || 'https://via.placeholder.com/150'} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold">View</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default OrdersPage;
