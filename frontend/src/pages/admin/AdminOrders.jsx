import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import useAdminStore from '../../store/adminStore';
import useVirtual from '../../hooks/useVirtual';
import { Search, Inbox } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusDropdown from '../../components/ui/StatusDropdown';
import { formatPrice } from '../../utils/currency';
import Pagination from '../../components/ui/Pagination';
import OrderDetailsDrawer from '../../components/admin/orders/OrderDetailsDrawer';
import useAdminFilters from '../../hooks/useAdminFilters';
import AdminFilterBar from '../../components/admin/filters/AdminFilterBar';
import FilterDropdown from '../../components/admin/filters/FilterDropdown';
import DateRangePicker from '../../components/admin/filters/DateRangePicker';
const statusOptions = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' }
];

const paymentOptions = [
  { label: 'All Payments', value: 'All' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' }
];

const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Amount (High to Low)', value: 'amount_desc' },
  { label: 'Amount (Low to High)', value: 'amount_asc' }
];

const PAYMENT_COLORS = {
  PAID:    'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED:  'bg-red-50 text-red-700 border-red-200',
  REFUNDED:'bg-gray-100 text-gray-600 border-gray-200',
};

const OrderRow = React.memo(({ order, isUpdating, onSelect, onStatusChange }) => (
  <tr
    onClick={() => onSelect(order.id)}
    className={`cursor-pointer hover:bg-surface-background transition-colors ${isUpdating ? 'opacity-70' : ''}`}
  >
    <td className="p-4 pl-6 text-text-brand-600 text-sm uppercase font-mono font-normal">
      #{order.orderNumber || order.id.split('-')[0]}
    </td>
    <td className="p-4 text-sm text-text-secondary font-normal">
      {new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })}
    </td>
    <td className="p-4 font-normal">
      <div className="text-sm text-text-brand-600 font-normal">{order.user?.name}</div>
      {order.user?.email && (
        <div className="text-xs text-text-muted font-medium">{order.user.email}</div>
      )}
    </td>
    <td className="p-4 text-text-brand-600 font-normal">
      {formatPrice(order.totalAmount)}
    </td>
    <td className="p-4 font-normal">
      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md border ${PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.PENDING}`}>
        {order.paymentStatus}
      </span>
    </td>
    <td className="p-4 font-normal" onClick={(e) => e.stopPropagation()}>
      <StatusDropdown
        value={order.orderStatus}
        onChange={(newStatus) => onStatusChange(order.id, newStatus)}
        isLoading={isUpdating}
        disabled={isUpdating}
      />
    </td>
  </tr>
));

const AdminOrders = () => {
  const { orders, isLoading, updatingOrderIds, fetchOrders, prefetchOrders, ordersPagination } = useAdminStore();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Ref for table scroll container and call virtualization hook
  const tableContainerRef = useRef(null);
  const { virtualItems, totalHeight, startOffset, shouldVirtualize } = useVirtual({
    items: orders,
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
    (filters.paymentStatus && filters.paymentStatus !== 'All') ||
    (filters.dateRange && filters.dateRange !== 'All')
  );

  useEffect(() => {
    if (!isInitialized) return;
    fetchOrders(currentPage, { 
      search: filters.search || search || '', 
      filters,
      limit: itemsPerPage
    });
  }, [filters, isInitialized, fetchOrders]);

  // Predictive Prefetching: silently load the next page
  useEffect(() => {
    if (ordersPagination && ordersPagination.currentPage < ordersPagination.totalPages) {
      prefetchOrders(ordersPagination.currentPage + 1, {
        search: filters.search || search || '',
        filters,
        limit: itemsPerPage
      });
    }
  }, [ordersPagination?.currentPage, ordersPagination?.totalPages, filters, search, itemsPerPage, prefetchOrders]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    const { updateOrderStatus } = useAdminStore.getState();
    await updateOrderStatus(orderId, newStatus);
  }, []);

  return (
    <div className="space-y-6 font-normal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-normal">
        <h1 className="text-2xl text-text-brand-600 font-bold">Orders</h1>
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
            <FilterDropdown 
              label="Payment" 
              options={paymentOptions} 
              value={filters.paymentStatus || 'All'} 
              onChange={(val) => updateFilter('paymentStatus', val)} 
            />
            <DateRangePicker 
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
          <table className="w-full text-left border-collapse font-normal">
            <thead className="sticky top-0 z-10 font-normal">
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider border-b border-border font-medium">
                <th className="p-4 pl-6 font-normal">Order ID</th>
                <th className="p-4 font-normal">Date</th>
                <th className="p-4 font-normal">Customer</th>
                <th className="p-4 font-normal">Total</th>
                <th className="p-4 font-normal">Payment</th>
                <th className="p-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 font-normal">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6 font-normal"><SkeletonLoader className="h-5 w-20 font-normal" /></td>
                    <td className="p-4 font-normal">
                      <SkeletonLoader className="h-4 w-24 mb-1 font-normal" />
                      <SkeletonLoader className="h-3 w-16 font-normal" />
                    </td>
                    <td className="p-4 font-normal">
                      <SkeletonLoader className="h-4 w-32 mb-1 font-normal" />
                      <SkeletonLoader className="h-3 w-40 font-normal" />
                    </td>
                    <td className="p-4 font-normal">
                      <SkeletonLoader className="h-4 w-16 mb-1 font-normal" />
                      <SkeletonLoader className="h-3 w-20 font-normal" />
                    </td>
                    <td className="p-4 font-normal"><SkeletonLoader className="h-6 w-20 font-normal rounded-md" /></td>
                    <td className="p-4 font-normal"><SkeletonLoader className="h-8 w-28 font-normal rounded-lg" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-text-muted font-medium">
                    <div className="flex flex-col items-center justify-center font-normal">
                      <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3 font-normal">
                        <Inbox className="w-6 h-6 text-secondary-400 font-normal" />
                      </div>
                      <p className="text-sm text-text-brand-600 font-normal">
                        {search ? 'No orders match your search.' : 'No orders found.'}
                      </p>
                      <p className="text-xs text-text-muted mt-1 font-medium">
                        {search ? 'Try a different order ID or customer name.' : 'There are currently no orders matching these filters.'}
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
                  {virtualItems.map(({ item: order }) => {
                    const isUpdating = updatingOrderIds.has(order.id);
                    return (
                      <OrderRow
                        key={order.id}
                        order={order}
                        isUpdating={isUpdating}
                        onSelect={setSelectedOrderId}
                        onStatusChange={handleStatusChange}
                      />
                    );
                  })}
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
        {ordersPagination && ordersPagination.totalPages > 0 && (
          <div className="shrink-0 border-t border-border bg-white shadow-[0_-1px_4px_rgba(0,0,0,0.06)] px-4 py-3 font-normal">
            <Pagination
              currentPage={ordersPagination.currentPage}
              totalPages={ordersPagination.totalPages}
              totalItems={ordersPagination.totalItems}
              filteredItems={ordersPagination.filteredItems}
              isFiltered={hasActiveFilters}
              label="Orders"
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setLimit}
            />
          </div>
        )}
      </div>

      <OrderDetailsDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};

export default AdminOrders;
