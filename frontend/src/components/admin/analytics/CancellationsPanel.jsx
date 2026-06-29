import React from 'react';
import useAdminStore from '../../../store/adminStore';
import { formatPrice } from '../../../utils/currency';

const CancellationsPanel = () => {
  const { detailedAnalytics } = useAdminStore();
  const data = detailedAnalytics.cancellations;

  if (!data) return null;

  const { summary, cancelRate, refundAmount } = data;

  return (
    <div className="space-y-8">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Cancelled" value={summary.total} highlight />
        <StatCard title="Today" value={summary.today} />
        <StatCard title="This Week" value={summary.thisWeek} />
        <StatCard title="This Month" value={summary.thisMonth} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <StatCard 
          title="Cancellation Rate" 
          value={`${cancelRate.toFixed(1)}%`} 
          highlight 
        />
        <StatCard 
          title="Estimated Refund Impact" 
          value={formatPrice(refundAmount)} 
        />
      </div>
    </div>
  );
};

const StatCard = ({ title, value, highlight }) => (
  <div className={`p-4 rounded-xl border border-border ${highlight ? 'bg-danger-50' : 'bg-white'}`}>
    <p className="text-xs font-bold text-text-muted mb-1">{title}</p>
    <p className={`text-lg font-extrabold ${highlight ? 'text-danger-600' : 'text-text-primary'}`}>{value}</p>
  </div>
);

export default CancellationsPanel;
