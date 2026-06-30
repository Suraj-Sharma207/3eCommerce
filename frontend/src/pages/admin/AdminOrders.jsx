import React, { useEffect, useState, useCallback, useMemo } from 'react';
import useAdminStore from '../../store/adminStore';
import { Search, Inbox } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import StatusDropdown from '../../components/ui/StatusDropdown';
import { formatPrice } from '../../utils/currency';
import Pagination from '../../components/ui/Pagination';
import OrderDetailsDrawer from '../../components/admin/orders/OrderDetailsDrawer';

const PAYMENT_COLORS = {
  PAID:    'bg-green-50 text-green-700 border-green-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED:  'bg-red-50 text-red-700 border-red-200',
  REFUNDED:'bg-gray-100 text-gray-600 border-gray-200',
};

const AdminOrders = () => {
  const { orders, isLoading, updatingOrderIds, fetchOrders, updateOrderStatus, ordersPagination, searchQuery, setSearchQuery, setOrdersItemsPerPage } = useAdminStore();
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchOrders]);

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
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-background">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
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
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading ? (
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
                        {searchQuery ? 'No orders match your search.' : 'No orders found.'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {searchQuery ? 'Try a different order ID or customer name.' : 'There are currently no orders in the system.'}
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
              onPageChange={(page) => fetchOrders(page)} 
              itemsPerPage={ordersPagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setOrdersItemsPerPage(limit);
                fetchOrders(1, limit);
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
