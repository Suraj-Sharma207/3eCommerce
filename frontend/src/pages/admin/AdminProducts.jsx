import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useProductStore from "../../store/productStore";
import Button from "../../components/ui/Button";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Inbox,
  Upload,
  Trash,
  X,
  CheckSquare,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import useVirtual from "../../hooks/useVirtual";
import { getOptimizedUrl } from "../../utils/cloudinary";
import Input from "../../components/ui/Input";
import ImageFallback from "../../components/ui/ImageFallback";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { formatPrice } from "../../utils/currency";
import toast from "react-hot-toast";
import EmptyState from "../../components/ui/EmptyState";
import ProductModal from "../../components/admin/ProductModal";
import BulkImportModal from "../../components/admin/BulkImportModal";
import useConfirmStore from "../../store/confirmStore";
import useSettingsStore from "../../store/settingsStore";
import Pagination from "../../components/ui/Pagination";
import useAdminFilters from "../../hooks/useAdminFilters";
import AdminFilterBar from "../../components/admin/filters/AdminFilterBar";
import FilterDropdown from "../../components/admin/filters/FilterDropdown";
import PriceRangeFilter from "../../components/admin/filters/PriceRangeFilter";

const categoryOptions = [
  { label: "All Categories", value: "All" },
  { label: "Living Room", value: "Living Room" },
  { label: "Bedroom", value: "Bedroom" },
  { label: "Dining", value: "Dining" },
  { label: "Office", value: "Office" },
  { label: "Lighting", value: "Lighting" },
  { label: "Decor", value: "Decor" },
  { label: "Outdoor", value: "Outdoor" },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Price (Low to High)", value: "price_asc" },
  { label: "Price (High to Low)", value: "price_desc" },
  { label: "Name (A to Z)", value: "name_asc" },
  { label: "Name (Z to A)", value: "name_desc" },
  { label: "Stock (High to Low)", value: "stock_desc" },
  { label: "Stock (Low to High)", value: "stock_asc" },
];

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_LIMIT = 10;

// ── Tri-state Header Checkbox ──────────────────────────────────────────────────
const HeaderCheckbox = ({ checked, indeterminate, disabled, onChange, id }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ accentColor: "#2563eb" }}
    />
  );
};

// ── Row Checkbox ───────────────────────────────────────────────────────────────
const RowCheckbox = ({ checked, disabled, onChange, id }) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    disabled={disabled}
    onChange={onChange}
    className="w-4 h-4 rounded accent-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ accentColor: "#2563eb" }}
    onClick={(e) => e.stopPropagation()}
  />
);

const AdminProducts = () => {
  const {
    products,
    isLoading,
    updatingProductIds,
    fetchAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    pagination,
    inventoryCounts,
    // Bulk selection
    selectedProductIds,
    isBulkDeleting,
    toggleProductSelection,
    selectProductIds,
    clearSelection,
    bulkDeleteProducts: storeBulkDelete,
    fetchFilteredProductIds,
  } = useProductStore();

  const {
    search,
    setSearch,
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    setPage,
    setLimit,
    isInitialized,
  } = useAdminFilters({
    inventoryTab: "all",
    sort: "newest",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [isSyncingAI, setIsSyncingAI] = useState(false);

  // Table virtualization container ref
  const tableContainerRef = useRef(null);

  // Call virtualization hook for performance on large product lists
  const { virtualItems, totalHeight, startOffset, shouldVirtualize } =
    useVirtual({
      items: products,
      rowHeight: 72,
      containerRef: tableContainerRef,
      overscan: 5,
    });

  // Always derive selectedProduct from the live store so image updates propagate automatically
  const selectedProduct = selectedProductId
    ? (products.find((p) => p.id === selectedProductId) ?? null)
    : null;

  const { confirm } = useConfirmStore();

  const [isCreating, setIsCreating] = useState(false);
  const { publicConfig } = useSettingsStore();
  const lowStockThreshold = publicConfig?.lowStockThreshold || 5;

  // Read pagination state from URL params (single source of truth)
  const currentPage = parseInt(filters.page, 10) || 1;
  const itemsPerPage = parseInt(filters.limit, 10) || DEFAULT_LIMIT;

  // Determine if any filters are active (for result summary)
  const hasActiveFilters = Boolean(
    search ||
    (filters.category && filters.category !== "All") ||
    filters.minPrice ||
    filters.maxPrice ||
    (filters.inventoryTab && filters.inventoryTab !== "all"),
  );

  useEffect(() => {
    if (!isInitialized) return;
    fetchAdminProducts(currentPage, {
      search: filters.search || "",
      filters,
      limit: itemsPerPage,
    });
  }, [filters, isInitialized, fetchAdminProducts]);

  // ── Bulk Selection Derived State ─────────────────────────────────────────────

  const selectedCount = selectedProductIds.size;
  const hasSelection = selectedCount > 0;

  // IDs visible on current page
  const pageProductIds = products.map((p) => p.id);
  const selectedOnPage = pageProductIds.filter((id) =>
    selectedProductIds.has(id),
  );
  const allPageSelected =
    pageProductIds.length > 0 &&
    selectedOnPage.length === pageProductIds.length;
  const somePageSelected =
    selectedOnPage.length > 0 && selectedOnPage.length < pageProductIds.length;

  // The header checkbox is"checked" if every product in the ENTIRE filtered set is selected
  const totalFiltered =
    pagination?.filteredItems ?? pagination?.totalItems ?? 0;
  const allDatasetSelected =
    selectedCount > 0 && selectedCount >= totalFiltered;
  const headerIndeterminate = !allDatasetSelected && hasSelection;
  const headerChecked = allDatasetSelected;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleHeaderCheckboxChange = useCallback(async () => {
    if (hasSelection) {
      // Any selection → clear all
      clearSelection();
      return;
    }

    // Nothing selected → select all matching the current filters
    setIsSelectingAll(true);
    try {
      let stockStatus;
      if (filters.inventoryTab === "active") stockStatus = "active";
      else if (filters.inventoryTab === "outOfStock")
        stockStatus = "outOfStock";

      const ids = await fetchFilteredProductIds({
        search: filters.search || search || "",
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sort: filters.sort,
        inventoryTab: filters.inventoryTab,
        stockStatus,
      });
      selectProductIds(ids);
    } catch {
      toast.error("Failed to select all products");
    } finally {
      setIsSelectingAll(false);
    }
  }, [
    hasSelection,
    clearSelection,
    fetchFilteredProductIds,
    selectProductIds,
    filters,
    search,
  ]);

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
      const success = await updateProduct(selectedProduct.id, productData);
      if (success) {
        toast.success("Product updated successfully.");
        handleCloseModal();
      } else {
        toast.error(
          useProductStore.getState().error || "Unable to update product.",
        );
      }
    } else {
      setIsCreating(true);
      const success = await createProduct(productData);
      setIsCreating(false);
      if (success) {
        toast.success("Product created successfully.");
        handleCloseModal();
      } else {
        toast.error(
          useProductStore.getState().error || "Unable to create product.",
        );
      }
    }
  };

  const handleOpenDelete = async (product) => {
    const isConfirmed = await confirm({
      title: "Delete Product?",
      description: `This action cannot be undone. This will permanently delete"${product.name}" and remove all associations.`,
      variant: "danger",
      confirmText: "Delete",
    });

    if (isConfirmed) {
      const success = await deleteProduct(product.id);
      if (success) {
        toast.success("Product deleted successfully.");
      } else {
        toast.error(
          useProductStore.getState().error || "Unable to delete product.",
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedProductIds.size;
    if (count > 100) {
      toast.error(
        "Bulk delete is limited to a maximum of 100 products at a time.",
      );
      return;
    }
    const isConfirmed = await confirm({
      title: `Delete ${count} Product${count !== 1 ? "s" : ""}?`,
      description: `This action cannot be undone. All ${count} selected product${count !== 1 ? "s" : ""} will be permanently removed.`,
      variant: "danger",
      confirmText: `Delete Product${count !== 1 ? "s" : ""}`,
    });

    if (!isConfirmed) return;

    const result = await storeBulkDelete();
    if (result.success) {
      toast.success(
        `${result.deleted} product${result.deleted !== 1 ? "s" : ""} deleted successfully.`,
      );
    } else {
      toast.error(
        useProductStore.getState().error ||
          "Bulk delete failed. Please try again.",
      );
    }
  };

  const handleSyncToAI = async () => {
    setIsSyncingAI(true);
    try {
      const { default: api } = await import("../../services/api");
      const response = await api.post("/chatbot/sync/bulk");
      if (response.data?.success) {
        toast.success(
          `Successfully synced ${response.data.total_synced} products to AI!`,
        );
      } else {
        toast.error("Failed to sync products to AI.");
      }
    } catch (error) {
      console.error("Error syncing to AI:", error);
      toast.error("Error syncing products to AI.");
    } finally {
      setIsSyncingAI(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl text-text-brand-600 font-bold">Products</h1>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            className="group"
            onClick={handleSyncToAI}
            disabled={isSyncingAI}
          >
            {isSyncingAI ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform" />
            )}
            Sync to AI
          </Button>
          <Button
            variant="outline"
            className="group"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-5 h-5 mr-2 group-hover:-translate-y-0.5 transition-transform" />
            Bulk Import
          </Button>
          <Button className="group" onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── Bulk Selection Banner ───────────────────────────────────────────── */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            key="selection-banner"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-xl border border-blue-200 bg-blue-50 shadow-sm"
          >
            {/* Count pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-full shadow-sm select-none">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>
                  {selectedCount.toLocaleString()} Product
                  {selectedCount !== 1 ? "s" : ""} Selected
                </span>
              </div>
              {isSelectingAll && (
                <span className="flex items-center gap-1.5 text-xs text-blue-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Selecting all…
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bulk Delete */}
              <button
                id="bulk-delete-btn"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-white bg-danger-600 hover:bg-danger-700 disabled:bg-danger-400 rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                {isBulkDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash className="w-3.5 h-3.5" />
                )}
                {isBulkDeleting ? "Deleting…" : "Delete Selected"}
              </button>

              {/* Clear Selection */}
              <button
                id="clear-selection-btn"
                onClick={clearSelection}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-blue-700 bg-white hover:bg-blue-100 border border-blue-300 rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="w-3.5 h-3.5" />
                Clear Selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Card — fixed height so only tbody scrolls */}
      <div
        className={`bg-white rounded-2xl shadow-sm border border-border flex flex-col relative ${isLoading ? "overflow-hidden" : ""}`}
        style={{ maxHeight: "80vh" }}
      >
        {/* Inventory Tabs */}
        <div className="flex items-center px-4 pt-4 border-b border-border gap-6 overflow-x-auto hide-scrollbar shrink-0">
          {[
            { id: "all", label: "All Products", count: inventoryCounts.all },
            { id: "active", label: "Active", count: inventoryCounts.active },
            {
              id: "outOfStock",
              label: "Out of Stock",
              count: inventoryCounts.outOfStock,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateFilter("inventoryTab", tab.id)}
              className={`pb-3 text-sm font-bold transition-colors relative whitespace-nowrap ${
                filters.inventoryTab === tab.id
                  ? "text-brand-600"
                  : "text-text-muted hover:text-text-primary"
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
        <div className="p-4 border-b border-border bg-surface-background shrink-0">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            onReset={resetFilters}
          >
            <FilterDropdown
              label="Category"
              options={categoryOptions}
              value={filters.category || "All"}
              onChange={(val) => updateFilter("category", val)}
            />
            <PriceRangeFilter
              label="Price"
              min={filters.minPrice}
              max={filters.maxPrice}
              onChange={(min, max) => {
                updateFilters({ minPrice: min, maxPrice: max });
              }}
            />
            <FilterDropdown
              label="Sort By"
              options={sortOptions}
              value={filters.sort || "newest"}
              onChange={(val) => updateFilter("sort", val)}
            />
          </AdminFilterBar>
        </div>

        {/* Scrollable Table Body */}
        <div
          ref={tableContainerRef}
          className={`flex-1 min-h-0 relative ${isLoading ? "overflow-hidden" : "overflow-auto"}`}
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
                {/* ── Checkbox Column Header ───────────────────────────── */}
                <th className="p-4 pl-5 w-10">
                  <HeaderCheckbox
                    id="header-checkbox"
                    checked={headerChecked}
                    indeterminate={headerIndeterminate}
                    disabled={
                      isBulkDeleting ||
                      isSelectingAll ||
                      (products.length === 0 && !hasSelection)
                    }
                    onChange={handleHeaderCheckboxChange}
                  />
                </th>
                <th className="p-4 pl-2">Product</th>
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
                    <td className="p-4 pl-5 w-10">
                      <SkeletonLoader className="h-4 w-4" />
                    </td>
                    <td className="p-4 pl-2">
                      <SkeletonLoader className="h-10 w-full" />
                    </td>
                    <td className="p-4">
                      <SkeletonLoader className="h-6 w-24" />
                    </td>
                    <td className="p-4">
                      <SkeletonLoader className="h-6 w-16" />
                    </td>
                    <td className="p-4">
                      <SkeletonLoader className="h-6 w-20" />
                    </td>
                    <td className="p-4 pr-6">
                      <SkeletonLoader className="h-8 w-16 float-right" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      {filters.inventoryTab === "outOfStock" && !search ? (
                        <>
                          <div className="w-16 h-16 bg-success-500/10 rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">🎉</span>
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">
                            Great!
                          </h3>
                          <p className="text-text-muted max-w-sm font-medium">
                            No products are currently out of stock. Everything
                            is available for purchase.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4">
                            <Inbox
                              className="w-8 h-8 text-text-muted font-medium"
                              strokeWidth={1.5}
                            />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary mb-2">
                            No products found
                          </h3>
                          <p className="text-text-muted max-w-sm font-medium">
                            Try adjusting your search query or creating a new
                            product.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {shouldVirtualize && startOffset > 0 && (
                    <tr style={{ height: `${startOffset}px` }}>
                      <td colSpan="6" className="p-0 border-none" />
                    </tr>
                  )}
                  {virtualItems.map(({ item: product }) => {
                    const isSelected = selectedProductIds.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        className={`transition-colors group relative ${
                          isSelected
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-surface-background"
                        }`}
                        style={
                          isSelected
                            ? { borderLeft: "3px solid #2563eb" }
                            : { borderLeft: "3px solid transparent" }
                        }
                      >
                        {/* ── Row Checkbox ─────────────────────────────── */}
                        <td className="p-4 pl-4 w-10">
                          <RowCheckbox
                            id={`row-checkbox-${product.id}`}
                            checked={isSelected}
                            disabled={isBulkDeleting}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td className="p-4 pl-2 flex items-center gap-4">
                          <ImageFallback
                            src={getOptimizedUrl(
                              product.thumbnail,
                              "thumbnail",
                            )}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover bg-border-light flex-shrink-0"
                          />
                          <div className="text-text-brand-600 text-sm line-clamp-1 max-w-[220px]">
                            {product.name}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-text-secondary">
                          {product.category || "N/A"}
                        </td>
                        <td className="p-4 text-text-brand-600">
                          {formatPrice(product.price)}
                        </td>
                        <td className="p-4">
                          {product.stock === 0 ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/10 text-danger-600 text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-danger-600"></span>
                              Out of Stock
                            </div>
                          ) : (
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                product.stock <= lowStockThreshold
                                  ? "bg-warning-500/10 text-warning-600"
                                  : "bg-success-500/10 text-success-600"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  product.stock <= lowStockThreshold
                                    ? "bg-warning-500"
                                    : "bg-success-500"
                                }`}
                              ></span>
                              {product.stock} in stock
                            </div>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            disabled={isBulkDeleting}
                            className="p-2 text-text-muted hover:text-brand-600 bg-white hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(product)}
                            disabled={isBulkDeleting}
                            className="p-2 text-text-muted hover:text-danger-600 hover:bg-danger-50 bg-white rounded-lg transition-colors border border-transparent hover:border-danger-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {shouldVirtualize &&
                    totalHeight - startOffset - virtualItems.length * 72 >
                      0 && (
                      <tr
                        style={{
                          height: `${totalHeight - startOffset - virtualItems.length * 72}px`,
                        }}
                      >
                        <td colSpan="6" className="p-0 border-none" />
                      </tr>
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Pagination Footer */}
        {pagination && pagination.totalPages > 0 && (
          <div className="shrink-0 border-t border-border bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              filteredItems={pagination.filteredItems}
              isFiltered={hasActiveFilters}
              label="Products"
              onPageChange={(page) => {
                setPage(page);
                fetchAdminProducts(page, {
                  search: filters.search || "",
                  filters,
                  limit: itemsPerPage,
                });
                // ── Selection persists across pages ── (no clearSelection here)
              }}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setLimit(limit);
                fetchAdminProducts(1, {
                  search: filters.search || "",
                  filters,
                  limit,
                });
                // ── Selection persists across page-size changes ──
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
        isLoading={
          isCreating ||
          (selectedProduct ? updatingProductIds.has(selectedProduct.id) : false)
        }
      />

      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() =>
          fetchAdminProducts(1, {
            search: filters.search || "",
            filters,
            limit: itemsPerPage,
          })
        }
      />
    </div>
  );
};

export default AdminProducts;
