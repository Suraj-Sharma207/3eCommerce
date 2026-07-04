import React from'react';
import useAdminStore from'../../../store/adminStore';

const DeliveriesPanel = () => {
 const { detailedAnalytics } = useAdminStore();
 const data = detailedAnalytics.deliveries;

 if (!data) return null;

 const { summary, successRate } = data;

 return (
 <div className="space-y-8">
 {/* Summary Grid */}
 <div className="grid grid-cols-2 gap-4">
 <StatCard title="Total Delivered" value={summary.total} highlight />
 <StatCard title="Today" value={summary.today} />
 <StatCard title="This Week" value={summary.thisWeek} />
 <StatCard title="This Month" value={summary.thisMonth} />
 </div>

 <div className="grid grid-cols-1 gap-4">
 <StatCard 
 title="Delivery Success Rate" 
 value={`${successRate.toFixed(1)}%`} 
 highlight 
 />
 </div>
 </div>
 );
};

const StatCard = ({ title, value, highlight }) => (
 <div className={`p-4 rounded-xl border border-border ${highlight ?'bg-success-50' :'bg-white'}`}>
 <p className="text-xs text-text-muted mb-1 font-medium">{title}</p>
 <p className={`text-lg font-extrabold ${highlight ?'text-success-600' :'text-text-primary'}`}>{value}</p>
 </div>
);

export default DeliveriesPanel;
