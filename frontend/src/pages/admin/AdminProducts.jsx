import React, { useEffect, useState } from 'react';
import useProductStore from '../../store/productStore';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Search, Inbox } from 'lucide-react';
import Input from '../../components/ui/Input';
import ImageFallback from '../../components/ui/ImageFallback';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatPrice } from '../../utils/currency';
import toast from 'react-hot-toast';
import ProductModal from '../../components/admin/ProductModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import useSettingsStore from '../../store/settingsStore';
import Pagination from '../../components/ui/Pagination';

const AdminProducts = () => {
  const { products, isLoading, updatingProductIds, fetchProducts, createProduct, updateProduct, deleteProduct, pagination, searchQuery, setSearchQuery, setItemsPerPage } = useProductStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const { publicConfig } = useSettingsStore();
  const lowStockThreshold = publicConfig?.lowStockThreshold || 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  const handleOpenModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
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

  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    // Store handles optimistic removal — no refetch needed
    const success = await deleteProduct(productToDelete.id);
    if (success) {
      toast.success('Product deleted successfully.');
      handleCloseDelete();
    } else {
      toast.error(useProductStore.getState().error || 'Unable to delete product.');
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4 border border-border">
                        <Inbox className="w-8 h-8 text-text-muted opacity-50" />
                      </div>
                      <h3 className="text-lg font-extrabold text-text-primary mb-1">No products found.</h3>
                      <p className="text-sm text-text-secondary font-medium">
                        {searchQuery ? 'We couldn\'t find any products matching your search criteria. Try adjusting your filters.' : 'Your store doesn\'t have any products yet. Add a product to get started.'}
                      </p>
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
                      {(() => {
                        const stock = product.stock || 0;
                        if (stock > lowStockThreshold) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-success-50 text-success-700 border border-success-200">
                              {stock} In Stock
                            </span>
                          );
                        } else if (stock > 0) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-warning-50 text-warning-700 border border-warning-200">
                              {stock} Left
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-danger-50 text-danger-700 border border-danger-200">
                              Out of Stock
                            </span>
                          );
                        }
                      })()}
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
              onPageChange={(page) => fetchProducts(page)} 
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                fetchProducts(1);
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

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Product?"
        message="This action cannot be undone. This will permanently delete the product and remove all associations."
        itemTitle={productToDelete?.name}
        isLoading={productToDelete ? updatingProductIds.has(productToDelete.id) : false}
      />
    </div>
  );
};

export default AdminProducts;
