import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useAdminStore from '../../store/adminStore';
import { Search, Inbox } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
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

const AdminOrders = () => {
  const { orders, isLoading, updatingOrderIds, fetchOrders, updateOrderStatus, ordersPagination, setOrdersItemsPerPage } = useAdminStore();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const { search, setSearch, filters, updateFilter, resetFilters, isInitialized } = useAdminFilters({
    sort: 'newest'
  });

  useEffect(() => {
    if (!isInitialized) return;
    fetchOrders(1, { search: filters.search || '', filters });
  }, [filters, isInitialized, fetchOrders]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  }, [updateOrderStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600">Orders</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider font-bold border-b border-border">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading && orders.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6"><SkeletonLoader className="h-4 w-16" /></td>
                    <td className="p-4"><SkeletonLoader className="h-4 w-24" /></td>
                    <td className="p-4"><SkeletonLoader className="h-4 w-32" /></td>
                    <td className="p-4"><SkeletonLoader className="h-4 w-20" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-16 rounded" /></td>
                    <td className="p-4"><SkeletonLoader className="h-8 w-28 rounded-lg" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-border-light rounded-full flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-secondary-400" />
                      </div>
                      <p className="text-sm font-bold text-text-brand-600">
                        {search ? 'No orders match your search.' : 'No orders found.'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {search ? 'Try a different order ID or customer name.' : 'There are currently no orders matching these filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isUpdating = updatingOrderIds.has(order.id);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`cursor-pointer hover:bg-surface-background transition-colors ${isUpdating ? 'opacity-70' : ''}`}
                    >
                      <td className="p-4 pl-6 font-bold text-text-brand-600 text-sm uppercase font-mono">
                        #{order.orderNumber || order.id.split('-')[0]}
                      </td>
                      <td className="p-4 text-sm text-text-secondary">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-semibold text-text-brand-600">{order.user?.name}</div>
                        {order.user?.email && (
                          <div className="text-xs text-text-muted">{order.user.email}</div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-text-brand-600">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md border ${PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.PENDING}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <StatusDropdown
                          value={order.orderStatus}
                          onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                          isLoading={isUpdating}
                          disabled={isUpdating}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {ordersPagination && ordersPagination.totalPages > 0 && (
          <div className="p-4 border-t border-border bg-surface-background">
            <Pagination 
              currentPage={ordersPagination.currentPage} 
              totalPages={ordersPagination.totalPages} 
              onPageChange={(page) => fetchOrders(page, { search, filters })} 
              itemsPerPage={ordersPagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setOrdersItemsPerPage(limit);
                fetchOrders(1, { search, filters, limit });
              }}
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
