import React, { useEffect } from 'react';
import useAdminStore from '../../store/adminStore';
import { Search, ChevronDown, Inbox } from 'lucide-react';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { formatPrice } from '../../utils/currency';

const AdminOrders = () => {
  const { orders, isLoading, fetchOrders, updateOrderStatus } = useAdminStore();

  useEffect(() => {
    fetchOrders(1, 50); // Fetch first 50 for simplicity
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const statusColors = {
    PENDING: 'bg-warning text-white',
    PROCESSING: 'bg-accent-500 text-white',
    SHIPPED: 'bg-primary-600 text-white',
    DELIVERED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-danger-light text-danger-dark'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-primary">Orders</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by order ID or customer..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 text-text-muted text-xs uppercase tracking-wider font-bold border-b border-secondary-200">
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
                    <td className="p-4"><SkeletonLoader className="h-8 w-28 rounded" /></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-secondary-400" />
                      </div>
                      <p className="text-sm font-bold text-text-primary">No orders found</p>
                      <p className="text-xs text-text-muted mt-1">There are currently no orders in the system.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-text-primary text-sm uppercase">
                      {order.id.split('-')[0]}
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-text-primary font-medium">
                      {order.user.name}
                    </td>
                    <td className="p-4 font-bold text-text-primary">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                        order.paymentStatus === 'PAID' ? 'bg-success-100 text-success-700' : 'bg-warning text-white'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="relative group/select">
                        <select 
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded cursor-pointer border-none focus:ring-2 focus:ring-primary-500 outline-none ${statusColors[order.orderStatus]}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-70" />
                      </div>
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

export default AdminOrders;
