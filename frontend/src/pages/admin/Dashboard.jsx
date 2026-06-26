import React, { useEffect, useState, lazy, Suspense } from 'react';
import useAdminStore from '../../store/adminStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { DollarSign, ShoppingBag, Users, Package, Inbox, PackageCheck, XCircle } from 'lucide-react';
import ImageFallback from '../../components/ui/ImageFallback';
import { formatPrice } from '../../utils/currency';

// Lazy load chart components
const RevenueChart = lazy(() => import('../../components/admin/RevenueChart'));
const OrderStatusChart = lazy(() => import('../../components/admin/OrderStatusChart'));

const Dashboard = () => {
  const { analytics, isLoading, fetchAnalytics } = useAdminStore();
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    
    // Cleanup function for when component unmounts
    return () => {
      // AbortController is handled inside store if we call another fetch, but no need to abort on unmount here
      // unless we specifically want to. We want background refresh to finish if possible.
    };
  }, [fetchAnalytics]);

  // Initial load spinner delay logic
  useEffect(() => {
    let timer;
    if (isLoading && !analytics) {
      timer = setTimeout(() => setShowSpinner(true), 300);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading, analytics]);

  if (!analytics && !showSpinner) {
    // Show absolutely nothing for the first 300ms
    return null;
  }

  if (!analytics && showSpinner) {
    // Show simple centered spinner if taking longer than 300ms and no cache
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { kpis, revenueTrend, statusDistribution, recentOrders, topProducts } = analytics;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard title="Total Revenue" value={formatPrice(kpis.revenue)} icon={DollarSign} color="bg-brand-50 text-brand-600" />
        <KPICard title="Total Orders" value={kpis.orders} icon={ShoppingBag} color="bg-success-50 text-success-600" />
        <KPICard title="Total Customers" value={kpis.customers} icon={Users} color="bg-accent-50 text-accent-600" />
        <KPICard title="Total Products" value={kpis.products} icon={Package} color="bg-warning-50 text-warning-600" />
        <KPICard title="Delivered Orders" value={kpis.deliveredOrders || 0} icon={PackageCheck} color="bg-green-50 text-green-600" />
        <KPICard title="Cancelled Orders" value={kpis.cancelledOrders || 0} icon={XCircle} color="bg-danger-50 text-danger-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-text-brand-600 mb-6">Revenue Trend (Last 7 Days)</h3>
          <Suspense fallback={<div className="h-[300px] w-full flex items-center justify-center"><LoadingSpinner /></div>}>
            <RevenueChart data={revenueTrend} />
          </Suspense>
        </div>

        {/* Order Status Chart */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col">
          <h3 className="text-lg font-bold text-text-brand-600 mb-6">Orders by Status</h3>
          <Suspense fallback={<div className="h-[300px] w-full flex items-center justify-center"><LoadingSpinner /></div>}>
            <OrderStatusChart data={statusDistribution} />
          </Suspense>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-text-brand-600 mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-surface-background rounded-xl">
                <div>
                  <p className="font-bold text-text-brand-600 text-sm">{order.user.name}</p>
                  <p className="text-xs text-text-muted mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-brand-600">{formatPrice(order.totalAmount)}</p>
                  <p className="text-xs font-bold text-text-secondary mt-1">{order.orderStatus}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-bold text-text-brand-600">No recent orders</p>
                <p className="text-xs text-text-muted mt-1">When customers place orders, they will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-text-brand-600 mb-6">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map(tp => (
              <div key={tp.product.id} className="flex items-center justify-between p-4 bg-surface-background rounded-xl">
                <div className="flex items-center gap-4">
                  <ImageFallback src={tp.product.thumbnail} alt={tp.product.name} className="w-10 h-10 rounded object-cover" />
                  <div>
                    <p className="font-bold text-text-brand-600 text-sm line-clamp-1">{tp.product.name}</p>
                    <p className="text-xs text-text-muted mt-1">{tp.totalSold} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-success-600">{formatPrice(tp.revenue)}</p>
                </div>
              </div>
            ))}
             {topProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-bold text-text-brand-600">No products sold yet</p>
                <p className="text-xs text-text-muted mt-1">Your best selling items will be listed here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

// Memoize KPI card to prevent unnecessary re-renders
const KPICard = React.memo(({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-black text-text-brand-600">{value}</p>
    </div>
  </div>
));
KPICard.displayName = 'KPICard';

export default Dashboard;
