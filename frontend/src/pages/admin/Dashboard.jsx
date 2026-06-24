import React, { useEffect } from 'react';
import useAdminStore from '../../store/adminStore';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ShoppingBag, Users, Package, Inbox, AlertCircle } from 'lucide-react';
import ImageFallback from '../../components/ui/ImageFallback';

const COLORS = ['#6366F1', '#F09005', '#10B981', '#EF4444', '#8B5CF6'];

const Dashboard = () => {
  const { analytics, isLoading, fetchAnalytics } = useAdminStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading || !analytics) {
    return <DashboardSkeleton />;
  }

  const { kpis, revenueTrend, statusDistribution, recentOrders, topProducts } = analytics;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Revenue" value={`$${kpis.revenue.toFixed(2)}`} icon={DollarSign} color="bg-primary-50 text-primary-600" />
        <KPICard title="Total Orders" value={kpis.orders} icon={ShoppingBag} color="bg-success-50 text-success-600" />
        <KPICard title="Total Customers" value={kpis.customers} icon={Users} color="bg-accent-50 text-accent-600" />
        <KPICard title="Total Products" value={kpis.products} icon={Package} color="bg-warning-50 text-warning-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Revenue Trend (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dx={-10} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Chart */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-6">Orders by Status</h3>
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-bold text-text-primary">No order data yet</p>
                <p className="text-xs text-text-muted mt-1">Status distribution will appear here once orders are placed.</p>
              </div>
            )}
          </div>
          {/* Custom Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm text-text-secondary font-medium">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                <div>
                  <p className="font-bold text-text-primary text-sm">{order.user.name}</p>
                  <p className="text-xs text-text-muted mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-primary-600">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs font-bold text-text-secondary mt-1">{order.orderStatus}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                  <Inbox className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-bold text-text-primary">No recent orders</p>
                <p className="text-xs text-text-muted mt-1">When customers place orders, they will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6">Top Selling Products</h3>
          <div className="space-y-4">
            {topProducts.map(tp => (
              <div key={tp.product.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <ImageFallback src={tp.product.imageUrl} alt={tp.product.name} className="w-10 h-10 rounded object-cover" />
                  <div>
                    <p className="font-bold text-text-primary text-sm line-clamp-1">{tp.product.name}</p>
                    <p className="text-xs text-text-muted mt-1">{tp.totalSold} sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-success-600">${tp.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
             {topProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-secondary-400" />
                </div>
                <p className="text-sm font-bold text-text-primary">No products sold yet</p>
                <p className="text-xs text-text-muted mt-1">Your best selling items will be listed here.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 p-6 flex items-center gap-4">
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7" />
    </div>
    <div>
      <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-black text-text-primary">{value}</p>
    </div>
  </div>
);

export default Dashboard;
