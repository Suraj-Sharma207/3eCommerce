import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer';
import Button from '../../components/ui/Button';
import useOrderStore from '../../store/orderStore';
import { Package, ChevronRight } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import { formatPrice } from '../../utils/currency';
import ImageFallback from '../../components/ui/ImageFallback';
import { getOptimizedUrl } from '../../utils/cloudinary';

const OrdersSkeleton = () => (
  <PageContainer className="py-8 lg:py-12 max-w-5xl">
    <div className="h-10 w-48 bg-neutral-200 rounded animate-pulse mb-8"></div>
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-surface-background px-6 py-4 border-b border-border flex justify-between items-center">
            <div className="flex gap-8">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2 hidden sm:block">
                <div className="h-3 w-12 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-8 w-24 bg-neutral-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse mb-6"></div>
            <div className="flex gap-4 overflow-hidden">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="shrink-0 relative w-24 h-24 sm:w-32 sm:h-32 bg-neutral-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </PageContainer>
);

const OrdersPage = () => {
  const { orders, hasFetched, fetchUserOrders } = useOrderStore();

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  if (!hasFetched) {
    return <OrdersSkeleton />;
  }

  if (orders.length === 0) {
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
      <h1 className="text-3xl font-medium text-text-primary mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            
            {/* Header */}
            <div className="bg-surface-background px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="block text-text-muted text-xs mb-1">Order Placed</span>
                  <span className="font-medium text-text-primary">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-text-muted text-xs mb-1">Total</span>
                  <span className="font-medium text-text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
                <div>
                  <span className="block text-text-muted text-xs mb-1">Order #</span>
                  <span className="font-medium text-text-primary">{order.orderNumber}</span>
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
                <Package className="w-5 h-5 text-text-muted" />
                <h3 className="font-medium text-text-primary text-sm flex items-center">
                  Status: 
                  <span className={`ml-2 inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    order.orderStatus === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-200' :
                    order.orderStatus === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' :
                    order.orderStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    order.orderStatus === 'SHIPPED' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                    'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </span>
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {order.items.map((item) => (
                  <Link key={item.id} to={`/products/${item.productId}`} className="shrink-0 relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-border-light group border border-border">
                    <ImageFallback 
                      src={getOptimizedUrl(item.product.thumbnail, 'thumbnail')} 
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
