import React from'react';
import useAdminStore from'../../../store/adminStore';
import { formatPrice } from'../../../utils/currency';

const CustomersPanel = () => {
 const { detailedAnalytics } = useAdminStore();
 const data = detailedAnalytics.customers;

 if (!data) return null;

 const { summary, ltv } = data;

 return (
 <div className="space-y-8">
 {/* Summary Grid */}
 <div className="grid grid-cols-2 gap-4">
 <StatCard title="Total Customers" value={summary.total} />
 <StatCard title="New Today" value={summary.today} highlight />
 <StatCard title="This Week" value={summary.thisWeek} />
 <StatCard title="This Month" value={summary.thisMonth} />
 </div>

 <div className="grid grid-cols-1 gap-4">
 <StatCard title="Average Lifetime Value (LTV)" value={formatPrice(ltv.averageLifetimeValue)} highlight />
 <StatCard title="Average Orders Per Customer" value={ltv.averageOrdersPerCustomer.toFixed(1)} />
 </div>
 </div>
 );
};

const StatCard = ({ title, value, highlight }) => (
 <div className={`p-4 rounded-xl border border-border ${highlight ?'bg-brand-50' :'bg-white'}`}>
 <p className="text-xs text-text-muted mb-1 font-medium">{title}</p>
 <p className={`text-lg font-extrabold ${highlight ?'text-brand-600' :'text-text-primary'}`}>{value}</p>
 </div>
);

export default CustomersPanel;
