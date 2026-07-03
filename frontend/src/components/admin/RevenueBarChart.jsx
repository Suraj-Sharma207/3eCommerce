import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAdminStore from '../../store/adminStore';
import { formatPrice } from '../../utils/currency';
import LoadingSpinner from '../ui/LoadingSpinner';

const FILTERS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' }
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-border rounded-xl shadow-lg p-3 min-w-[150px] font-normal">
        <p className="text-sm text-text-muted mb-2 font-medium">{label}</p>
        <div className="space-y-1 font-normal">
          <p className="text-sm text-brand-600 font-normal">
            Revenue: {formatPrice(data.revenue)}
          </p>
          <p className="text-xs text-text-secondary font-normal">
            Orders: {data.orders}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const RevenueBarChart = () => {
  const { analytics, fetchRevenueChartData } = useAdminStore();
  const [activeFilter, setActiveFilter] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchRevenueChartData(activeFilter);
      setIsLoading(false);
    };
    
    // Only fetch if changing away from the default loaded by the dashboard initially
    // or if we just want to ensure it's fresh.
    loadData();
  }, [activeFilter, fetchRevenueChartData]);

  const data = analytics?.revenueTrend || [];

  return (
    <div className="flex flex-col h-full w-full relative font-normal">
      <div className="flex flex-wrap items-center gap-2 mb-6 font-normal">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
              activeFilter === f.id 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'bg-surface-background text-text-muted hover:bg-border-light hover:text-text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] relative font-normal">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] font-normal">
            <LoadingSpinner />
          </div>
        )}
        
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: '400' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748B', fontWeight: '400' }}
                tickFormatter={(val) => `₹${(val / 1000)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F1F5F9' }} />
              <Bar 
                dataKey="revenue" 
                fill="#082F5C" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center font-normal">
            <p className="text-sm text-text-brand-600 font-normal">No data for selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueBarChart;
