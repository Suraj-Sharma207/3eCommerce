import React from "react";
import useAdminStore from "../../../store/adminStore";
import { formatPrice } from "../../../utils/currency";

const RevenuePanel = () => {
  const { detailedAnalytics } = useAdminStore();
  const data = detailedAnalytics.revenue;

  if (!data) return null;

  const { summary, byProduct, byCategory } = data;

  return (
    <div className="space-y-8">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Revenue" value={formatPrice(summary.total)} />
        <StatCard
          title="Today's Revenue"
          value={formatPrice(summary.today)}
          highlight
        />
        <StatCard title="Yesterday" value={formatPrice(summary.yesterday)} />
        <StatCard title="This Week" value={formatPrice(summary.thisWeek)} />
        <StatCard title="This Month" value={formatPrice(summary.thisMonth)} />
        <StatCard title="This Year" value={formatPrice(summary.thisYear)} />
        <StatCard title="Avg Order Value" value={formatPrice(summary.aov)} />
        <StatCard title="Highest Order" value={formatPrice(summary.highest)} />
      </div>

      {/* Revenue By Category */}
      <section>
        <h3 className="font-bold text-text-brand-600 mb-3 text-sm uppercase tracking-wider">
          Revenue By Category
        </h3>
        <div className="bg-surface-background rounded-xl p-4 space-y-3">
          {byCategory.length === 0 ? (
            <p className="text-text-muted text-sm font-medium">
              No data available.
            </p>
          ) : null}
          {byCategory.map((cat, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-text-primary">{cat.category}</span>
              <span className="text-brand-600">{formatPrice(cat.revenue)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top Products By Revenue */}
      <section>
        <h3 className="font-bold text-text-brand-600 mb-3 text-sm uppercase tracking-wider">
          Top Revenue Products
        </h3>
        <div className="overflow-x-auto bg-white rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Sold</th>
                <th className="p-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byProduct.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="p-4 text-center text-text-muted text-sm font-medium"
                  >
                    No data available.
                  </td>
                </tr>
              ) : null}
              {byProduct.map((p, i) => (
                <tr key={i} className="hover:bg-surface-background/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-md border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md border border-border" />
                      )}
                      <span className="text-text-primary line-clamp-1">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right text-text-secondary">
                    {p.sold}
                  </td>
                  <td className="p-3 text-right text-brand-600">
                    {formatPrice(p.revenue)}
                  </td>
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
  <div
    className={`p-4 rounded-xl border border-border ${highlight ? "bg-brand-50" : "bg-white"}`}
  >
    <p className="text-xs text-text-muted mb-1 font-medium">{title}</p>
    <p
      className={`text-lg font-extrabold ${highlight ? "text-brand-600" : "text-text-primary"}`}
    >
      {value}
    </p>
  </div>
);

export default RevenuePanel;
