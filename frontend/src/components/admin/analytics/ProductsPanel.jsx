import React from 'react';
import useAdminStore from '../../../store/adminStore';
import { formatPrice } from '../../../utils/currency';

const ProductsPanel = () => {
  const { detailedAnalytics } = useAdminStore();
  const data = detailedAnalytics.products;

  if (!data) return null;

  const { summary, performance } = data;

  return (
    <div className="space-y-8">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Products" value={summary.total} />
        <StatCard title="Active" value={summary.active} highlight />
        <StatCard title="Drafts" value={summary.draft} />
        <StatCard title="Out of Stock" value={summary.outOfStock} danger />
        <StatCard title="Low Stock" value={summary.lowStock} warning />
      </div>

      <section>
        <h3 className="font-bold text-text-brand-600 mb-3 text-sm uppercase tracking-wider">Best Selling Products</h3>
        <ProductTable products={performance.bestSelling} />
      </section>

      <section>
        <h3 className="font-bold text-text-brand-600 mb-3 text-sm uppercase tracking-wider">Lowest Selling Products</h3>
        <ProductTable products={performance.lowestSelling} />
      </section>
    </div>
  );
};

const ProductTable = ({ products }) => (
  <div className="overflow-x-auto bg-white rounded-xl border border-border">
    <table className="w-full text-left text-sm">
      <thead className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border">
        <tr>
          <th className="p-3">Product</th>
          <th className="p-3 text-center">Stock</th>
          <th className="p-3 text-right">Sold</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {products.length === 0 ? (
          <tr><td colSpan="3" className="p-4 text-center text-text-muted text-sm">No data available.</td></tr>
        ) : null}
        {products.map((p, i) => (
          <tr key={i} className="hover:bg-surface-background/50">
            <td className="p-3 font-medium text-text-primary line-clamp-1">{p.name}</td>
            <td className="p-3 text-center">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.stock === 0 ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}`}>
                {p.stock}
              </span>
            </td>
            <td className="p-3 text-right text-text-secondary font-bold">{p.qtySold}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ title, value, highlight, danger, warning }) => {
  let colorClass = 'bg-white text-text-primary border-border';
  if (highlight) colorClass = 'bg-brand-50 text-brand-600 border-brand-100';
  if (danger) colorClass = 'bg-danger-50 text-danger-600 border-danger-100';
  if (warning) colorClass = 'bg-warning-50 text-warning-600 border-warning-100';

  return (
    <div className={`p-4 rounded-xl border ${colorClass}`}>
      <p className="text-xs font-bold opacity-80 mb-1">{title}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
};

export default ProductsPanel;
