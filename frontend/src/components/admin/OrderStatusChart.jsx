import React, { memo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle } from 'lucide-react';

const COLORS = ['#082F5C', '#3F79B5', '#234F84', '#6C7A90', '#B8C2D1'];

const OrderStatusChart = memo(({ data, onSliceClick }) => {
  return (
    <>
      <div className="flex-1 flex items-center justify-center min-h-[300px] font-normal">
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
                onClick={(entry) => onSliceClick && onSliceClick(entry.name)}
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full font-normal">
            <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3 font-normal">
              <AlertCircle className="w-6 h-6 text-secondary-400 font-normal" />
            </div>
            <p className="text-sm text-text-brand-600 font-normal">No order data yet</p>
            <p className="text-xs text-text-muted mt-1 font-medium">Status distribution will appear here once orders are placed.</p>
          </div>
        )}
      </div>
      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 font-normal">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm text-text-secondary font-normal">
            <span className="w-3 h-3 rounded-full font-normal" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
            {entry.name}
          </div>
        ))}
      </div>
    </>
  );
});

OrderStatusChart.displayName = 'OrderStatusChart';

export default OrderStatusChart;
