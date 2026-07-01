import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useProductStore from '../../store/productStore';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search, Inbox } from 'lucide-react';
import Input from '../../components/ui/Input';
import ImageFallback from '../../components/ui/ImageFallback';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatPrice } from '../../utils/currency';
import toast from 'react-hot-toast';
import ProductModal from '../../components/admin/ProductModal';
import useConfirmStore from '../../store/confirmStore';
import useSettingsStore from '../../store/settingsStore';
import Pagination from '../../components/ui/Pagination';

const AdminProducts = () => {
  const { products, isLoading, updatingProductIds, fetchAdminProducts, createProduct, updateProduct, deleteProduct, pagination, searchQuery, setSearchQuery, setItemsPerPage, filters, setFilters, inventoryCounts } = useProductStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Always derive selectedProduct from the live store so image updates propagate automatically
  const selectedProduct = selectedProductId
    ? (products.find(p => p.id === selectedProductId) ?? null)
    : null;
  
  const { confirm } = useConfirmStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const { publicConfig } = useSettingsStore();
  const lowStockThreshold = publicConfig?.lowStockThreshold || 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminProducts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filters.inventoryTab, fetchAdminProducts]);

  const handleOpenModal = (product = null) => {
    setSelectedProductId(product?.id ?? null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
  };

  const handleSaveProduct = async (productData) => {
    if (selectedProduct) {
      // Update: store handles optimistic patch, no refetch needed
      const success = await updateProduct(selectedProduct.id, productData);
      if (success) {
        toast.success('Product updated successfully.');
        handleCloseModal();
      } else {
        toast.error(useProductStore.getState().error || 'Unable to update product.');
      }
    } else {
      // Create: store appends to list, no refetch needed
      setIsCreating(true);
      const success = await createProduct(productData);
      setIsCreating(false);
      if (success) {
        toast.success('Product created successfully.');
        handleCloseModal();
      } else {
        toast.error(useProductStore.getState().error || 'Unable to create product.');
      }
    }
  };

  const handleOpenDelete = async (product) => {
    const isConfirmed = await confirm({
      title: 'Delete Product?',
      description: `This action cannot be undone. This will permanently delete "${product.name}" and remove all associations.`,
      variant: 'danger',
      confirmText: 'Delete'
    });
    
    if (isConfirmed) {
      const success = await deleteProduct(product.id);
      if (success) {
        toast.success('Product deleted successfully.');
      } else {
        toast.error(useProductStore.getState().error || 'Unable to delete product.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600">Products</h1>
        <Button className="shrink-0 group" onClick={() => handleOpenModal()}>
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
          Add Product
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        
        {/* Inventory Tabs */}
        <div className="flex items-center px-4 pt-4 border-b border-border gap-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'all', label: 'All Products', count: inventoryCounts.all },
            { id: 'active', label: 'Active', count: inventoryCounts.active },
            { id: 'outOfStock', label: 'Out of Stock', count: inventoryCounts.outOfStock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilters({ inventoryTab: tab.id })}
              className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                filters.inventoryTab === tab.id 
                  ? 'text-brand-600' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {tab.label} <span className="ml-1 opacity-80">({tab.count})</span>
              {filters.inventoryTab === tab.id && (
                <motion.div 
                  layoutId="activeAdminTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
                />
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-background">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider font-bold border-b border-border">
                <th className="p-4 pl-6">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-secondary-100 ${isLoading && products.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              {isLoading && products.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6"><SkeletonLoader className="h-10 w-full" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-24" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-16" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-20" /></td>
                    <td className="p-4 pr-6"><SkeletonLoader className="h-8 w-16 float-right" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      {filters.inventoryTab === 'outOfStock' && !searchQuery ? (
                        <>
                          <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">🎉</span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">Great!</h3>
                          <p className="text-text-muted max-w-sm">No products are currently out of stock. Everything is available for purchase.</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-8 h-8 text-text-muted" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">No products found</h3>
                          <p className="text-text-muted max-w-sm">Try adjusting your search query or creating a new product.</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-background transition-colors group">
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <ImageFallback src={product.thumbnail} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-border-light" />
                      <div className="font-bold text-text-brand-600 text-sm line-clamp-1 max-w-[250px]">{product.name}</div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">{product.category || 'N/A'}</td>
                    <td className="p-4 font-bold text-text-brand-600">{formatPrice(product.price)}</td>
                    <td className="p-4">
                      {product.stock === 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/10 text-danger-600 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-danger-600"></span>
                          Out of Stock
                        </div>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.stock <= lowStockThreshold 
                            ? 'bg-warning-500/10 text-warning-600'
                            : 'bg-success-500/10 text-success-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            product.stock <= lowStockThreshold ? 'bg-warning-500' : 'bg-success-500'
                          }`}></span>
                          {product.stock} in stock
                        </div>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-text-muted hover:text-brand-600 bg-white hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(product)}
                        className="p-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 bg-white rounded-lg transition-colors border border-transparent hover:border-danger-600 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 0 && (
          <div className="p-4 border-t border-border bg-surface-background">
            <Pagination 
              currentPage={pagination.currentPage} 
              totalPages={pagination.totalPages} 
              onPageChange={fetchAdminProducts} 
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                fetchAdminProducts(1);
              }}
            />
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onSave={handleSaveProduct}
        isLoading={isCreating || (selectedProduct ? updatingProductIds.has(selectedProduct.id) : false)}
      />
    </div>
  );
};

export default AdminProducts;
