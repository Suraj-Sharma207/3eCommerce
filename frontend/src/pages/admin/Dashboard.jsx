import React, { useEffect, useState, lazy, Suspense } from'react';
import { useNavigate } from'react-router-dom';
import useAdminStore from'../../store/adminStore';
import SkeletonLoader from'../../components/ui/SkeletonLoader';
import { DollarSign, ShoppingBag, Users, Package, Inbox, PackageCheck, XCircle } from'lucide-react';
import ImageFallback from'../../components/ui/ImageFallback';
import { formatPrice } from'../../utils/currency';
import AnalyticsDrawer from'../../components/admin/analytics/AnalyticsDrawer';

// Lazy load chart components
const RevenueBarChart = lazy(() => import('../../components/admin/RevenueBarChart'));
const InventoryNotifications = lazy(() => import('../../components/admin/InventoryNotifications'));
const OrderStatusChart = lazy(() => import('../../components/admin/OrderStatusChart'));

const Dashboard = () => {
 const navigate = useNavigate();
 const { analytics, dashboardLoading, error, fetchAnalytics } = useAdminStore();
 const [drawerConfig, setDrawerConfig] = useState({ isOpen: false, type: null });

 useEffect(() => {
 fetchAnalytics();
 }, [fetchAnalytics]);

 if (error && Object.keys(analytics).length === 0) {
 return (
 <div className="flex flex-col h-[60vh] w-full items-center justify-center">
 <XCircle className="w-12 h-12 text-danger-500 mb-4" />
 <h2 className="text-xl font-bold text-text-primary mb-2">Unable to load dashboard.</h2>
 <p className="text-text-muted mb-6 font-medium">{error}</p>
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
 kpis, statusDistribution, recentOrders, topProducts,
 mostViewed, highestRevenue, highestSelling, mostWishlisted, mostAddedToCart, lowestStock, neverSold
 } = analytics || {};

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
 {dashboardLoading?.kpis || !kpis ? (
 Array.from({ length: 6 }).map((_, i) => <KPICardSkeleton key={i} />)
 ) : (
 <>
 <KPICard onClick={() => openDrawer('revenue')} title="Total Revenue" value={formatPrice(kpis.revenue)} icon={DollarSign} color="bg-brand-50 text-brand-600" />
 <KPICard onClick={() => openDrawer('orders')} title="Total Orders" value={kpis.orders} icon={ShoppingBag} color="bg-success-50 text-success-600" />
 <KPICard onClick={() => openDrawer('customers')} title="Total Customers" value={kpis.customers} icon={Users} color="bg-accent-50 text-accent-600" />
 <KPICard onClick={() => openDrawer('products')} title="Total Products" value={kpis.products} icon={Package} color="bg-warning-50 text-warning-600" />
 <KPICard onClick={() => openDrawer('deliveries')} title="Delivered Orders" value={kpis.deliveredOrders || 0} icon={PackageCheck} color="bg-green-50 text-green-600" />
 <KPICard onClick={() => openDrawer('cancellations')} title="Cancelled Orders" value={kpis.cancelledOrders || 0} icon={XCircle} color="bg-danger-50 text-danger-600" />
 </>
 )}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Revenue Bar Chart */}
 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
 <h3 className="text-lg font-bold text-text-brand-600 mb-2">Revenue Analytics</h3>
 <Suspense fallback={<div className="flex-1 w-full mt-4 flex items-center justify-center"><SkeletonLoader className="w-full h-[280px] rounded-xl" /></div>}>
 <RevenueBarChart />
 </Suspense>
 </div>

 {/* Order Status Chart */}
 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
 <h3 className="text-lg font-bold text-text-brand-600 mb-2">Orders by Status</h3>
 {dashboardLoading?.orderStatuses || !statusDistribution ? (
 <div className="flex-1 flex items-center justify-center mt-4"><SkeletonLoader type="circle" className="w-56 h-56" /></div>
 ) : (
 <Suspense fallback={<div className="flex-1 flex items-center justify-center mt-4"><SkeletonLoader type="circle" className="w-56 h-56" /></div>}>
 <OrderStatusChart 
 data={statusDistribution} 
 onSliceClick={(statusName) => navigate(`/admin/orders?status=${encodeURIComponent(statusName.toUpperCase())}`)} 
 />
 </Suspense>
 )}
 </div>

 {/* Inventory Notifications */}
 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col min-h-[400px]">
 <Suspense fallback={
 <div className="flex-1 flex flex-col space-y-4 mt-2">
 <SkeletonLoader className="h-6 w-1/2 mb-2" />
 {[1, 2, 3, 4, 5].map(i => <SkeletonLoader key={i} className="w-full h-12 rounded-lg" />)}
 </div>
 }>
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
 <span className="text-sm text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
 </div>
 <div className="space-y-4">
 {dashboardLoading?.recentOrders || !recentOrders ? (
 Array.from({ length: 5 }).map((_, i) => <ListRowSkeleton key={i} />)
 ) : (
 <>
 {recentOrders.map(order => (
 <div 
 key={order.id} 
 onClick={() => navigate(`/admin/orders`)}
 className="flex items-center justify-between p-4 bg-surface-background hover:bg-surface-background/80 rounded-xl cursor-pointer transition-colors"
 >
 <div>
 <p className="text-text-brand-600 text-sm">{order.user.name}</p>
 <p className="text-xs text-text-muted mt-1 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
 </div>
 <div className="text-right">
 <p className="text-brand-600">{formatPrice(order.totalAmount)}</p>
 <p className="text-xs text-text-secondary mt-1">{order.orderStatus}</p>
 </div>
 </div>
 ))}
 {recentOrders.length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
 <Inbox className="w-6 h-6 text-secondary-400" />
 </div>
 <p className="text-sm text-text-brand-600">No recent orders</p>
 <p className="text-xs text-text-muted mt-1 font-medium">When customers place orders, they will appear here.</p>
 </div>
 )}
 </>
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
 <span className="text-sm text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">View All &rarr;</span>
 </div>
 <div className="space-y-4">
 {dashboardLoading?.topProducts || !topProducts ? (
 Array.from({ length: 5 }).map((_, i) => <ListRowSkeleton key={i} />)
 ) : (
 <>
 {topProducts.map(tp => (
 <div 
 key={tp.product.id} 
 onClick={() => navigate(`/admin/products`)}
 className="flex items-center justify-between p-4 bg-surface-background hover:bg-surface-background/80 rounded-xl cursor-pointer transition-colors"
 >
 <div className="flex items-center gap-4">
 <ImageFallback src={tp.product.thumbnail} alt={tp.product.name} className="w-10 h-10 rounded object-cover" />
 <div>
 <p className="text-text-brand-600 text-sm line-clamp-1">{tp.product.name}</p>
 <p className="text-xs text-text-muted mt-1 font-medium">{tp.totalSold} sold</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-success-600">{formatPrice(tp.revenue)}</p>
 </div>
 </div>
 ))}
 {topProducts.length === 0 && (
 <div className="flex flex-col items-center justify-center py-8 text-center">
 <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
 <Package className="w-6 h-6 text-secondary-400" />
 </div>
 <p className="text-sm text-text-brand-600">No products sold yet</p>
 <p className="text-xs text-text-muted mt-1 font-medium">Your best selling items will be listed here.</p>
 </div>
 )}
 </>
 )}
 </div>
 </div>

 </div>

 {/* Extended Product Analytics */}
 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 mt-8">
 <h3 className="text-lg font-bold text-text-brand-600 mb-6">Product Insights</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
 <InsightCard title="Most Viewed" data={mostViewed} valueLabel="views" valueKey="totalViews" loading={dashboardLoading?.extendedStats} />
 <InsightCard title="Highest Revenue" data={highestRevenue} valueLabel="" valueKey="totalRevenue" formatValue={formatPrice} loading={dashboardLoading?.extendedStats} />
 <InsightCard title="Highest Selling" data={highestSelling} valueLabel="sold" valueKey="totalSold" loading={dashboardLoading?.extendedStats} />
 <InsightCard title="Most Wishlisted" data={mostWishlisted} valueLabel="wishlists" valueKey="wishlistCount" loading={dashboardLoading?.extendedStats} />
 <InsightCard title="Most Added To Cart" data={mostAddedToCart} valueLabel="carts" valueKey="cartCount" loading={dashboardLoading?.extendedStats} />
 <InsightCard title="Lowest Stock" data={lowestStock} valueLabel="remaining" valueKey="stock" loading={dashboardLoading?.extendedStats} />
 </div>
 
 {neverSold && neverSold.length > 0 && (
 <div className="mt-6 pt-6 border-t border-border-light">
 <h4 className="text-sm text-text-muted uppercase tracking-wider mb-3 font-medium">Never Sold</h4>
 <div className="flex flex-wrap gap-2">
 {neverSold.map((p, i) => (
 <span key={i} className="px-3 py-1 bg-surface-background text-sm rounded-full border border-border-light">
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

const ListRowSkeleton = () => (
 <div className="flex items-center justify-between p-4 bg-surface-background rounded-xl">
 <div className="flex items-center gap-4 w-full">
 <div className="w-10 h-10 rounded bg-border-light animate-pulse" />
 <div className="flex-1 space-y-2">
 <div className="h-4 bg-border-light rounded w-1/3 animate-pulse" />
 <div className="h-3 bg-border-light rounded w-1/4 animate-pulse" />
 </div>
 </div>
 </div>
);

const KPICardSkeleton = () => (
 <div className="bg-white rounded-2xl shadow-sm border border-border p-6 flex items-center gap-4">
 <div className="w-14 h-14 rounded-xl bg-border-light animate-pulse" />
 <div className="flex-1 space-y-2">
 <div className="h-4 bg-border-light rounded w-1/2 animate-pulse" />
 <div className="h-6 bg-border-light rounded w-3/4 animate-pulse" />
 </div>
 </div>
);

const InsightCard = ({ title, data, valueLabel, valueKey, formatValue, loading }) => (
 <div className="p-4 bg-surface-background rounded-xl border border-border-light">
 <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">{title}</p>
 {loading ? (
 <div className="space-y-2 mt-2">
 <div className="h-4 bg-border-light rounded w-3/4 animate-pulse" />
 <div className="h-3 bg-border-light rounded w-1/2 animate-pulse" />
 </div>
 ) : data ? (
 <div>
 <p className="text-text-brand-600 truncate" title={data.name}>{data.name}</p>
 <p className="text-sm text-brand-600 mt-1">
 {formatValue ? formatValue(data[valueKey]) : data[valueKey]} {valueLabel}
 </p>
 </div>
 ) : (
 <p className="text-sm text-text-muted italic font-medium">No data available</p>
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
 <p className="text-sm text-text-muted uppercase tracking-wider mb-1 group-hover:text-text-primary transition-colors font-medium">{title}</p>
 <p className="text-2xl text-text-brand-600">{value}</p>
 </div>
 </div>
));
KPICard.displayName ='KPICard';

export default Dashboard;
