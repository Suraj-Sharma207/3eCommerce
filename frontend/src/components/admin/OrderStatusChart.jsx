import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

const COLORS = ['#6366F1', '#F09005', '#10B981', '#EF4444', '#8B5CF6'];

const OrderStatusChart = memo(({ data }) => {
  return (
    <>
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
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
            <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-secondary-400" />
            </div>
            <p className="text-sm font-bold text-text-brand-600">No order data yet</p>
            <p className="text-xs text-text-muted mt-1">Status distribution will appear here once orders are placed.</p>
          </div>
        )}
      </div>
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm text-text-secondary font-medium">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
            {entry.name}
          </div>
        ))}
      </div>
    </>
  );
});

OrderStatusChart.displayName = 'OrderStatusChart';

export default OrderStatusChart;
