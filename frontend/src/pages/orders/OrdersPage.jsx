import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import useOrderStore from '../../store/orderStore';
import { Package, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { formatPrice } from '../../utils/currency';
import ImageFallback from '../../components/ui/ImageFallback';

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
      <h1 className="text-3xl font-medium text-neutral-900 mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header */}
            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="block text-neutral-500 text-xs mb-1">Order Placed</span>
                  <span className="font-medium text-neutral-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-neutral-500 text-xs mb-1">Total</span>
                  <span className="font-medium text-neutral-900">{formatPrice(order.totalAmount)}</span>
                </div>
                <div>
                  <span className="block text-neutral-500 text-xs mb-1">Order #</span>
                  <span className="font-medium text-neutral-900">{order.orderNumber}</span>
                </div>
              </div>
              
              <Button 
                as={Link}
                to={`/orders/${order.id}`}
                variant="outline"
                size="sm"
                className="group"
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Package className="w-5 h-5 text-neutral-400" />
                <h3 className="font-medium text-neutral-900 text-sm flex items-center">
                  Status: 
                  <span className={`ml-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.orderStatus === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-200' :
                    order.orderStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                    order.orderStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    order.orderStatus === 'SHIPPED' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {order.items.map((item) => (
                  <Link key={item.id} to={`/products/${item.productId}`} className="shrink-0 relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-neutral-100 group border border-neutral-200">
                    <ImageFallback 
                      src={item.product.thumbnail} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
