import React from 'react';
import useAdminStore from '../../../store/adminStore';
import { formatPrice } from '../../../utils/currency';

const ProductsPanel = () => {
  const { detailedAnalytics } = useAdminStore();
  const data = detailedAnalytics.products;

  if (!data) return null;

  const { summary, performance } = data;

  return (
    <div className="space-y-8 font-normal">
      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4 font-normal">
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
  <div className="overflow-x-auto bg-white rounded-xl border border-border font-normal">
    <table className="w-full text-left text-sm font-normal">
      <thead className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
        <tr>
          <th className="p-3 font-normal">Product</th>
          <th className="p-3 text-center font-normal">Stock</th>
          <th className="p-3 text-right font-normal">Sold</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border font-normal">
        {products.length === 0 ? (
          <tr><td colSpan="3" className="p-4 text-center text-text-muted text-sm font-medium">No data available.</td></tr>
        ) : null}
        {products.map((p, i) => (
          <tr key={i} className="hover:bg-surface-background/50 font-normal">
            <td className="p-3 text-text-primary line-clamp-1 font-normal">{p.name}</td>
            <td className="p-3 text-center font-normal">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.stock === 0 ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'}`}>
                {p.stock}
              </span>
            </td>
            <td className="p-3 text-right text-text-secondary font-normal">{p.qtySold}</td>
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
      <p className="text-xs opacity-80 mb-1 font-normal">{title}</p>
      <p className="text-lg font-normal">{value}</p>
    </div>
  );
};

export default ProductsPanel;
