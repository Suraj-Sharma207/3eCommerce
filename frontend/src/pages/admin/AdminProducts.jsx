import React, { useEffect, useState } from 'react';
import useProductStore from '../../store/productStore';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search, Inbox } from 'lucide-react';
import Input from '../../components/ui/Input';
import ImageFallback from '../../components/ui/ImageFallback';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AdminProducts = () => {
  const { products, isLoading, fetchProducts } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-primary">Products</h1>
        <Button className="shrink-0 group">
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          Add Product
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 text-text-muted text-xs uppercase tracking-wider font-bold border-b border-secondary-200">
                <th className="p-4 pl-6">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6"><SkeletonLoader className="h-10 w-full" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-24" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-16" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-20" /></td>
                    <td className="p-4 pr-6"><SkeletonLoader className="h-8 w-16 float-right" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-secondary-400" />
                      </div>
                      <p className="text-sm font-bold text-text-primary">No products found</p>
                      <p className="text-xs text-text-muted mt-1">Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary-50 transition-colors group">
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <ImageFallback src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-secondary-100" />
                      <div className="font-bold text-text-primary text-sm line-clamp-1 max-w-[250px]">{product.name}</div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{product.category || 'N/A'}</td>
                    <td className="p-4 font-bold text-text-primary">${product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                        product.stock > 10 ? 'bg-success-100 text-success-700' : 
                        product.stock > 0 ? 'bg-warning text-white' : 'bg-danger-light text-danger-dark'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button className="p-2 text-text-muted hover:text-primary-600 bg-white hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-200 shadow-sm opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-muted hover:text-danger hover:bg-danger-light bg-white rounded-lg transition-colors border border-transparent hover:border-danger shadow-sm opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminProducts;
