import React, { useEffect, useState } from "react";
import { Tag, Plus, Edit2, Trash2, Calendar, Percent } from "lucide-react";
import usePromotionStore from "../../store/promotionStore";
import useConfirmStore from "../../store/confirmStore";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";
import Pagination from "../../components/ui/Pagination";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import TableLoadingOverlay from "../../components/ui/TableLoadingOverlay";
import { isFormValid } from "../../utils/validators";
import useAdminFilters from "../../hooks/useAdminFilters";
import AdminFilterBar from "../../components/admin/filters/AdminFilterBar";
import FilterDropdown from "../../components/admin/filters/FilterDropdown";

const statusOptions = [
  { label: "All Statuses", value: "All" },
  { label: "Draft", value: "DRAFT" },
  { label: "Enabled", value: "ENABLED" },
  { label: "Disabled", value: "DISABLED" },
];

const typeOptions = [
  { label: "All Types", value: "All" },
  { label: "Percentage", value: "PERCENTAGE_DISCOUNT" },
  { label: "Flat Discount", value: "FLAT_DISCOUNT" },
];

const applyToOptions = [
  { label: "All Targets", value: "All" },
  { label: "Entire Store", value: "STORE" },
  { label: "Categories", value: "CATEGORY" },
  { label: "Brands", value: "BRAND" },
  { label: "Specific Products", value: "PRODUCT" },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Discount (High to Low)", value: "discount_desc" },
  { label: "Discount (Low to High)", value: "discount_asc" },
];

const getLocalDateString = (daysToAdd = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysToAdd);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextDayString = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminOffers = () => {
  const {
    promotions,
    isLoading,
    fetchPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    pagination,
  } = usePromotionStore();
  const {
    search,
    setSearch,
    filters,
    updateFilter,
    resetFilters,
    setPage,
    setLimit,
    isInitialized,
  } = useAdminFilters({
    sort: "newest",
  });
  const { confirm } = useConfirmStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const DEFAULT_LIMIT = 10;
  const currentPage = parseInt(filters.page, 10) || 1;
  const itemsPerPage = parseInt(filters.limit, 10) || DEFAULT_LIMIT;

  const hasActiveFilters = Boolean(
    search ||
    (filters.status && filters.status !== "All") ||
    (filters.type && filters.type !== "All") ||
    (filters.applyTo && filters.applyTo !== "All"),
  );

  useEffect(() => {
    if (!isInitialized) return;
    fetchPromotions(currentPage, {
      search: filters.search || search || "",
      filters,
      limit: itemsPerPage,
    });
  }, [filters, isInitialized, fetchPromotions]);

  const initialForm = {
    name: "",
    description: "",
    type: "PERCENTAGE_DISCOUNT",
    status: "DRAFT",
    priority: 0,
    startDate: getLocalDateString(1),
    endDate: getLocalDateString(31),
    applyTo: "STORE",
    discountValue: 0,
    categories: "",
    brands: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const handleOpenModal = (promo = null) => {
    setErrors({});
    if (promo) {
      setEditingId(promo.id);
      setFormData({
        ...promo,
        startDate: promo.startDate.split("T")[0],
        endDate: promo.endDate.split("T")[0],
        categories: promo.categories?.map((c) => c.category).join(",") || "",
        brands: promo.brands?.map((b) => b.brand).join(",") || "",
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Date validations
    const errs = {};
    const localToday = getLocalDateString(0);

    if (!formData.startDate) {
      errs.startDate = "Start date is required.";
    } else if (!editingId && formData.startDate <= localToday) {
      errs.startDate = "Start date must be in the future.";
    }

    if (!formData.endDate) {
      errs.endDate = "End date is required.";
    } else if (formData.endDate <= localToday) {
      errs.endDate = "End date must be in the future.";
    } else if (formData.startDate && formData.endDate <= formData.startDate) {
      errs.endDate = "End date must be after the start date.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      ...formData,
      categories: formData.categories
        ? formData.categories.split(",").map((c) => c.trim())
        : [],
      brands: formData.brands
        ? formData.brands.split(",").map((b) => b.trim())
        : [],
    };

    const success = editingId
      ? await updatePromotion(editingId, payload)
      : await createPromotion(payload);

    if (success) {
      toast.success(
        `Campaign ${editingId ? "updated" : "created"} successfully.`,
      );
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Campaign",
      description: "Are you sure you want to delete this campaign?",
      variant: "danger",
      confirmText: "Delete",
    });
    if (isConfirmed) {
      const success = await deletePromotion(id);
      if (success) toast.success("Campaign deleted.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl text-text-brand-600 flex items-center gap-2 font-bold">
          <Tag className="w-6 h-6" /> Offers & Promotions
        </h1>
        <Button onClick={() => handleOpenModal()} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      <div
        className={`bg-white rounded-2xl shadow-sm border border-border flex flex-col relative ${isLoading ? "overflow-hidden" : ""}`}
        style={{ maxHeight: "80vh" }}
      >
        <TableLoadingOverlay isLoading={isLoading} text="Loading offers..." />
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-surface-background">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            onReset={resetFilters}
          >
            <FilterDropdown
              label="Status"
              options={statusOptions}
              value={filters.status || "All"}
              onChange={(val) => updateFilter("status", val)}
            />
            <FilterDropdown
              label="Type"
              options={typeOptions}
              value={filters.type || "All"}
              onChange={(val) => updateFilter("type", val)}
            />
            <FilterDropdown
              label="Target"
              options={applyToOptions}
              value={filters.applyTo || "All"}
              onChange={(val) => updateFilter("applyTo", val)}
            />
            <FilterDropdown
              label="Sort By"
              options={sortOptions}
              value={filters.sort || "newest"}
              onChange={(val) => updateFilter("sort", val)}
            />
          </AdminFilterBar>
        </div>

        <div
          className={`flex-1 min-h-0 relative ${isLoading ? "overflow-hidden" : "overflow-auto"}`}
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
                <th className="p-4 pl-6">Offer Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {promotions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-12 text-center text-text-muted font-medium"
                  >
                    No promotions found.
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-surface-background transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-text-primary">{promo.name}</div>
                      <div className="text-xs text-text-muted font-medium">
                        {promo.type} • {promo.applyTo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          promo.status === "ENABLED"
                            ? "bg-green-100 text-green-800"
                            : promo.status === "DRAFT"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {promo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                      <div>
                        {new Date(promo.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-text-muted font-medium">
                        to {new Date(promo.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenModal(promo)}
                        className="p-2 text-text-muted hover:text-brand-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-2 text-text-muted hover:text-error transition-colors"
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

        {/* Sticky Pagination Footer */}
        {pagination && pagination.totalPages > 0 && (
          <div className="shrink-0 border-t border-border bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              filteredItems={pagination.filteredItems}
              isFiltered={hasActiveFilters}
              label="Offers"
              onPageChange={(page) => {
                setPage(page);
                fetchPromotions(page, {
                  search: filters.search || search || "",
                  filters,
                  limit: itemsPerPage,
                });
              }}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setLimit(limit);
                fetchPromotions(1, {
                  search: filters.search || search || "",
                  filters,
                  limit,
                });
              }}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Campaign" : "Create Campaign"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Campaign Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="space-y-1.5">
              <label className="text-sm text-text-primary">Status</label>
              <select
                className="w-full px-4 py-3 rounded-[12px] border border-border"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="DRAFT">Draft</option>
                <option value="ENABLED">Enabled</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-text-primary">Type</label>
              <select
                className="w-full px-4 py-3 rounded-[12px] border border-border"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                <option value="FLAT_DISCOUNT">Flat Discount</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({ ...formData, discountValue: e.target.value })
              }
              required
            />

            <div className="space-y-1.5">
              <label className="text-sm text-text-primary">Apply To</label>
              <select
                className="w-full px-4 py-3 rounded-[12px] border border-border"
                value={formData.applyTo}
                onChange={(e) =>
                  setFormData({ ...formData, applyTo: e.target.value })
                }
              >
                <option value="STORE">Entire Store</option>
                <option value="CATEGORY">Specific Categories</option>
                <option value="BRAND">Specific Brands</option>
              </select>
            </div>
            <Input
              label="Priority (Higher = applied first)"
              type="number"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
            />

            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => {
                setFormData({ ...formData, startDate: e.target.value });
                if (errors.startDate)
                  setErrors((prev) => ({ ...prev, startDate: "" }));
              }}
              error={errors.startDate}
              min={!editingId ? getLocalDateString(1) : undefined}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => {
                setFormData({ ...formData, endDate: e.target.value });
                if (errors.endDate)
                  setErrors((prev) => ({ ...prev, endDate: "" }));
              }}
              error={errors.endDate}
              min={
                formData.startDate
                  ? getNextDayString(formData.startDate)
                  : getLocalDateString(1)
              }
              required
            />

            {formData.applyTo === "CATEGORY" && (
              <div className="col-span-2">
                <Input
                  label="Categories (Comma separated)"
                  value={formData.categories}
                  onChange={(e) =>
                    setFormData({ ...formData, categories: e.target.value })
                  }
                  placeholder="Living Room, Bedroom"
                />
              </div>
            )}
            {formData.applyTo === "BRAND" && (
              <div className="col-span-2">
                <Input
                  label="Brands (Comma separated)"
                  value={formData.brands}
                  onChange={(e) =>
                    setFormData({ ...formData, brands: e.target.value })
                  }
                  placeholder="FurnitureCo, LuxeDesign"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={
                !isFormValid(errors, {
                  name: formData.name,
                  discountValue: formData.discountValue,
                  startDate: formData.startDate,
                  endDate: formData.endDate,
                })
              }
            >
              Save Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminOffers;
