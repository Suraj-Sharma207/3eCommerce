import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminStore from '../../store/adminStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { DollarSign, ShoppingBag, Users, Package, Inbox, PackageCheck, XCircle } from 'lucide-react';
import ImageFallback from '../../components/ui/ImageFallback';
import { formatPrice } from '../../utils/currency';
import AnalyticsDrawer from '../../components/admin/analytics/AnalyticsDrawer';

// Lazy load chart components
const RevenueBarChart = lazy(() => import('../../components/admin/RevenueBarChart'));
const InventoryNotifications = lazy(() => import('../../components/admin/InventoryNotifications'));
const OrderStatusChart = lazy(() => import('../../components/admin/OrderStatusChart'));

const Dashboard = () => {
  const navigate = useNavigate();
  const { analytics, isLoading, error, fetchAnalytics } = useAdminStore();
  const [showSpinner, setShowSpinner] = useState(false);
  const [drawerConfig, setDrawerConfig] = useState({ isOpen: false, type: null });

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

  if (error && !analytics) {
    return (
      <div className="flex flex-col h-[60vh] w-full items-center justify-center">
        <XCircle className="w-12 h-12 text-danger-500 mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Unable to load dashboard.</h2>
        <p className="text-text-muted mb-6">{error}</p>
        <button 
          onClick={() => fetchAnalytics({ force: true })}
          className="px-6 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { 
    kpis, revenueTrend, statusDistribution, recentOrders, topProducts,
    mostViewed, highestRevenue, highestSelling, mostWishlisted, mostAddedToCart, lowestStock, neverSold
  } = analytics;

  const openDrawer = (type) => setDrawerConfig({ isOpen: true, type });
  const closeDrawer = () => setDrawerConfig({ ...drawerConfig, isOpen: false });

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      
      <AnalyticsDrawer 
        isOpen={drawerConfig.isOpen} 
        type={drawerConfig.type} 
        onClose={closeDrawer} 
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard onClick={() => openDrawer('revenue')} title="Total Revenue" value={formatPrice(kpis.revenue)} icon={DollarSign} color="bg-brand-50 text-brand-600" />
        <KPICard onClick={() => openDrawer('orders')} title="Total Orders" value={kpis.orders} icon={ShoppingBag} color="bg-success-50 text-success-600" />
        <KPICard onClick={() => openDrawer('customers')} title="Total Customers" value={kpis.customers} icon={Users} color="bg-accent-50 text-accent-600" />
        <KPICard onClick={() => openDrawer('products')} title="Total Products" value={kpis.products} icon={Package} color="bg-warning-50 text-warning-600" />
        <KPICard onClick={() => openDrawer('deliveries')} title="Delivered Orders" value={kpis.deliveredOrders || 0} icon={PackageCheck} color="bg-green-50 text-green-600" />
        <KPICard onClick={() => openDrawer('cancellations')} title="Cancelled Orders" value={kpis.cancelledOrders || 0} icon={XCircle} color="bg-danger-50 text-danger-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Bar Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-text-brand-600 mb-2">Revenue Analytics</h3>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>}>
            <RevenueBarChart />
          </Suspense>
        </div>

        {/* Order Status Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-text-brand-600 mb-2">Orders by Status</h3>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>}>
            <OrderStatusChart 
              data={statusDistribution} 
              onSliceClick={(statusName) => navigate(`/admin/orders?status=${encodeURIComponent(statusName.toUpperCase())}`)} 
            />
          </Suspense>
        </div>

        {/* Inventory Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>}>
            <InventoryNotifications />
          </Suspense>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <div 
            onClick={() => navigate('/admin/orders')}
            className="flex items-center justify-between cursor-pointer group mb-6"
          >
            <h3 className="text-lg font-bold text-text-brand-600 group-hover:text-brand-600 transition-colors">Recent Orders</h3>
            <span className="text-sm font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
          </div>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div 
                key={order.id} 
                onClick={() => navigate(`/admin/orders`)}
                className="flex items-center justify-between p-4 bg-surface-background hover:bg-surface-background/80 rounded-xl cursor-pointer transition-colors"
              >
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
          <div 
            onClick={() => navigate('/admin/products')}
            className="flex items-center justify-between cursor-pointer group mb-6"
          >
            <h3 className="text-lg font-bold text-text-brand-600 group-hover:text-brand-600 transition-colors">Top Selling Products</h3>
            <span className="text-sm font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
          </div>
          <div className="space-y-4">
            {topProducts.map(tp => (
              <div 
                key={tp.product.id} 
                onClick={() => navigate(`/admin/products`)}
                className="flex items-center justify-between p-4 bg-surface-background hover:bg-surface-background/80 rounded-xl cursor-pointer transition-colors"
              >
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

      {/* Extended Product Analytics */}
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mt-8">
        <h3 className="text-lg font-bold text-text-brand-600 mb-6">Product Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InsightCard title="Most Viewed" data={mostViewed} valueLabel="views" valueKey="totalViews" />
          <InsightCard title="Highest Revenue" data={highestRevenue} valueLabel="" valueKey="totalRevenue" formatValue={formatPrice} />
          <InsightCard title="Highest Selling" data={highestSelling} valueLabel="sold" valueKey="totalSold" />
          <InsightCard title="Most Wishlisted" data={mostWishlisted} valueLabel="wishlists" valueKey="wishlistCount" />
          <InsightCard title="Most Added To Cart" data={mostAddedToCart} valueLabel="carts" valueKey="cartCount" />
          <InsightCard title="Lowest Stock" data={lowestStock} valueLabel="remaining" valueKey="stock" />
        </div>
        
        {neverSold && neverSold.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border-light">
            <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">Never Sold</h4>
            <div className="flex flex-wrap gap-2">
              {neverSold.map((p, i) => (
                <span key={i} className="px-3 py-1 bg-surface-background text-sm font-medium rounded-full border border-border-light">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const InsightCard = ({ title, data, valueLabel, valueKey, formatValue }) => (
  <div className="p-4 bg-surface-background rounded-xl border border-border-light">
    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">{title}</p>
    {data ? (
      <div>
        <p className="font-bold text-text-brand-600 truncate" title={data.name}>{data.name}</p>
        <p className="text-sm font-semibold text-brand-600 mt-1">
          {formatValue ? formatValue(data[valueKey]) : data[valueKey]} {valueLabel}
        </p>
      </div>
    ) : (
      <p className="text-sm text-text-muted italic">No data available</p>
    )}
  </div>
);

// Memoize KPI card to prevent unnecessary re-renders
const KPICard = React.memo(({ title, value, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4 cursor-pointer hover:border-brand-300 hover:shadow-md transition-all group"
  >
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1 group-hover:text-text-primary transition-colors">{title}</p>
      <p className="text-2xl font-black text-text-brand-600">{value}</p>
    </div>
  </div>
));
KPICard.displayName = 'KPICard';

export default Dashboard;
