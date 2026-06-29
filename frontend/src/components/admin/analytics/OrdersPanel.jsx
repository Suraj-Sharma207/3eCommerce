import React from 'react';
import useAdminStore from '../../../store/adminStore';
import { formatPrice } from '../../../utils/currency';

const OrdersPanel = () => {
  const { detailedAnalytics } = useAdminStore();
  const data = detailedAnalytics.orders;

  if (!data) return null;

  const { summary, topCustomers } = data;

  return (
    <div className="space-y-8">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Orders" value={summary.total} />
        <StatCard title="Today's Orders" value={summary.today} highlight />
        <StatCard title="Pending" value={summary.pending || 0} />
        <StatCard title="Confirmed" value={summary.confirmed || 0} />
        <StatCard title="Shipped" value={summary.shipped || 0} />
        <StatCard title="Delivered" value={summary.delivered || 0} />
        <StatCard title="Cancelled" value={summary.cancelled || 0} />
      </div>

      {/* Top Customers By Orders */}
      <section>
        <h3 className="font-bold text-text-brand-600 mb-3 text-sm uppercase tracking-wider">Top Customers</h3>
        <div className="overflow-x-auto bg-white rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3 text-center">Orders</th>
                <th className="p-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topCustomers.length === 0 ? (
                <tr><td colSpan="3" className="p-4 text-center text-text-muted text-sm">No data available.</td></tr>
              ) : null}
              {topCustomers.map((c, i) => (
                <tr key={i} className="hover:bg-surface-background/50">
                  <td className="p-3">
                    <div className="font-medium text-text-primary">{c.name}</div>
                    <div className="text-xs text-text-muted truncate max-w-[120px]">{c.email}</div>
                  </td>
                  <td className="p-3 text-center text-text-secondary font-bold">{c.orders}</td>
                  <td className="p-3 text-right font-bold text-brand-600">{formatPrice(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ title, value, highlight }) => (
  <div className={`p-4 rounded-xl border border-border ${highlight ? 'bg-brand-50' : 'bg-white'}`}>
    <p className="text-xs font-bold text-text-muted mb-1">{title}</p>
    <p className={`text-lg font-extrabold ${highlight ? 'text-brand-600' : 'text-text-primary'}`}>{value}</p>
  </div>
);

export default OrdersPanel;
