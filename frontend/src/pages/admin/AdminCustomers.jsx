import React, { useEffect, useState, useRef } from 'react';
import { Search, Inbox, Users, ChevronRight, Ban, CheckCircle } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import useVirtual from '../../hooks/useVirtual';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ImageFallback from '../../components/ui/ImageFallback';
import { formatPrice } from '../../utils/currency';
import Pagination from '../../components/ui/Pagination';
import CustomerDetailsDrawer from '../../components/admin/CustomerDetailsDrawer';
import useAdminFilters from '../../hooks/useAdminFilters';
import AdminFilterBar from '../../components/admin/filters/AdminFilterBar';
import FilterDropdown from '../../components/admin/filters/FilterDropdown';
import DateRangePicker from '../../components/admin/filters/DateRangePicker';

const statusOptions = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Active', value: 'active' },
  { label: 'Disabled', value: 'inactive' }
];

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Name (A to Z)', value: 'name_asc' },
  { label: 'Name (Z to A)', value: 'name_desc' }
];

const AdminCustomers = () => {
  const { customers, isLoading, pagination, fetchCustomers } = useCustomerStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Table virtualization container ref and hook
  const tableContainerRef = useRef(null);
  const { virtualItems, totalHeight, startOffset, shouldVirtualize } = useVirtual({
    items: customers,
    rowHeight: 65,
    containerRef: tableContainerRef,
    overscan: 5
  });

  const { search, setSearch, filters, updateFilter, resetFilters, setPage, setLimit, isInitialized } = useAdminFilters({
    sort: 'newest'
  });

  const DEFAULT_LIMIT = 10;
  const currentPage = parseInt(filters.page, 10) || 1;
  const itemsPerPage = parseInt(filters.limit, 10) || DEFAULT_LIMIT;

  const hasActiveFilters = Boolean(
    search ||
    (filters.status && filters.status !== 'All') ||
    (filters.dateRange && filters.dateRange !== 'All')
  );

  useEffect(() => {
    if (!isInitialized) return;
    fetchCustomers(currentPage, { 
      search: filters.search || search || '', 
      filters,
      limit: itemsPerPage
    });
  }, [filters, isInitialized, fetchCustomers]);

  const handleOpenDrawer = (id) => {
    setSelectedCustomerId(id);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedCustomerId(null), 300);
  };

  return (
    <div className="space-y-6 font-normal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-normal">
        <h1 className="text-2xl text-text-brand-600 flex items-center gap-2 font-bold">
          <Users className="w-6 h-6 font-normal" />
          Customers
        </h1>
      </div>

      <div className={`bg-white rounded-2xl shadow-sm border border-border flex flex-col relative ${isLoading ? 'overflow-hidden' : ''}`} style={{ maxHeight: '80vh' }}>
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-surface-background font-normal">
          <AdminFilterBar 
            search={search} 
            onSearchChange={setSearch} 
            onReset={resetFilters}
          >
            <FilterDropdown 
              label="Status" 
              options={statusOptions} 
              value={filters.status || 'All'} 
              onChange={(val) => updateFilter('status', val)} 
            />
            <DateRangePicker 
              label="Joined"
              value={filters.dateRange || 'All'} 
              onChange={(val) => updateFilter('dateRange', val)} 
            />
            <FilterDropdown 
              label="Sort By" 
              options={sortOptions} 
              value={filters.sort || 'newest'} 
              onChange={(val) => updateFilter('sort', val)} 
            />
          </AdminFilterBar>
        </div>

        {/* Scrollable Table Body */}
        <div ref={tableContainerRef} className={`flex-1 min-h-0 relative ${isLoading ? 'overflow-hidden' : 'overflow-auto'}`}>
          <table className="w-full text-left border-collapse min-w-[800px] font-normal">
            <thead className="sticky top-0 z-10 font-normal">
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
                <th className="p-4 pl-6 font-normal">Customer</th>
                <th className="p-4 font-normal">Contact</th>
                <th className="p-4 font-normal">Orders</th>
                <th className="p-4 font-normal">Total Spend</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 text-right pr-6 font-normal">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 font-normal">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6 flex items-center gap-4 font-normal">
                      <SkeletonLoader type="circle" className="w-10 h-10 flex-shrink-0 font-normal" />
                      <SkeletonLoader className="h-4 w-32 font-normal" />
                    </td>
                    <td className="p-4 font-normal">
                      <SkeletonLoader className="h-4 w-40 mb-1 font-normal" />
                      <SkeletonLoader className="h-3 w-24 font-normal" />
                    </td>
                    <td className="p-4 font-normal"><SkeletonLoader className="h-4 w-8 font-normal" /></td>
                    <td className="p-4 font-normal"><SkeletonLoader className="h-4 w-24 font-normal" /></td>
                    <td className="p-4 font-normal"><SkeletonLoader className="h-6 w-20 font-normal rounded-md" /></td>
                    <td className="p-4 pr-6 font-normal"><SkeletonLoader type="circle" className="h-9 w-9 ml-auto font-normal" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center font-normal">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto font-normal">
                      <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4 border border-border font-normal">
                        <Inbox className="w-8 h-8 text-text-muted opacity-50 font-medium" />
                      </div>
                      <h3 className="text-lg text-text-primary mb-1 font-bold">No customers found</h3>
                      <p className="text-sm text-text-secondary font-normal">
                        {search ? 'Try adjusting your search terms or filters.' : 'You do not have any registered customers yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {shouldVirtualize && startOffset > 0 && (
                    <tr style={{ height: `${startOffset}px` }}>
                      <td colSpan="6" className="p-0 border-none font-normal" />
                    </tr>
                  )}
                  {virtualItems.map(({ item: customer }) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-brand-50/50 transition-colors cursor-pointer group font-normal"
                      onClick={() => handleOpenDrawer(customer.id)}
                    >
                      <td className="p-4 pl-6 flex items-center gap-4 font-normal">
                        <ImageFallback src={customer.avatarUrl} alt={customer.name} type="avatar" className="w-10 h-10 rounded-full object-cover bg-border-light flex-shrink-0 font-normal" />
                        <div className="text-text-brand-600 text-sm font-normal">{customer.name}</div>
                      </td>
                      <td className="p-4 text-sm font-normal">
                        <div className="text-text-primary font-normal">{customer.email}</div>
                        {customer.phone && <div className="text-text-muted text-xs mt-0.5 font-medium">{customer.phone}</div>}
                      </td>
                      <td className="p-4 text-text-primary font-normal">{customer.orderCount || 0}</td>
                      <td className="p-4 text-brand-600 font-normal">{formatPrice(customer.totalSpend || 0)}</td>
                      <td className="p-4 font-normal">
                        {customer.active ? (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-success-50 text-success-700 border border-success-200 font-normal">
                            <CheckCircle className="w-3.5 h-3.5 mr-1 font-normal" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-danger-50 text-danger-700 border border-danger-200 font-normal">
                            <Ban className="w-3.5 h-3.5 mr-1 font-normal" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right font-normal">
                        <button className="p-2 text-text-muted hover:text-brand-600 bg-white rounded-full transition-colors border border-brand-200 shadow-sm font-medium">
                          <ChevronRight className="w-5 h-5 font-normal" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {shouldVirtualize && (totalHeight - startOffset - (virtualItems.length * 65)) > 0 && (
                    <tr style={{ height: `${totalHeight - startOffset - (virtualItems.length * 65)}px` }}>
                      <td colSpan="6" className="p-0 border-none font-normal" />
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Pagination Footer */}
        {pagination.totalPages > 0 && (
          <div className="shrink-0 border-t border-border bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)] px-4 py-3 font-normal">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              filteredItems={pagination.filteredItems}
              isFiltered={hasActiveFilters}
              label="Customers"
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setLimit}
            />
          </div>
        )}
      </div>

      <CustomerDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={handleCloseDrawer} 
        customerId={selectedCustomerId} 
      />
    </div>
  );
};

export default AdminCustomers;
