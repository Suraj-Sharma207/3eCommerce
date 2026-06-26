import React, { useEffect, useState } from 'react';
import { Search, Inbox, Users, ChevronRight, Ban, CheckCircle } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import ImageFallback from '../../components/ui/ImageFallback';
import { formatPrice } from '../../utils/currency';
import Pagination from '../../components/ui/Pagination';
import CustomerDetailsDrawer from '../../components/admin/CustomerDetailsDrawer';

const AdminCustomers = () => {
  const { customers, isLoading, pagination, fetchCustomers, searchQuery, setSearchQuery, setItemsPerPage } = useCustomerStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCustomers]);

  const handlePageChange = (page) => {
    fetchCustomers(page);
  };

  const handleOpenDrawer = (id) => {
    setSelectedCustomerId(id);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Don't clear ID immediately to allow exit animation
    setTimeout(() => setSelectedCustomerId(null), 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-text-brand-600 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Customers
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-background">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-background text-text-muted text-xs uppercase tracking-wider font-bold border-b border-border">
                <th className="p-4 pl-6">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spend</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="p-4 pl-6"><SkeletonLoader className="h-10 w-full" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-32" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-16" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-24" /></td>
                    <td className="p-4"><SkeletonLoader className="h-6 w-20" /></td>
                    <td className="p-4 pr-6"><SkeletonLoader className="h-8 w-8 float-right rounded-full" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-surface-background rounded-full flex items-center justify-center mb-4 border border-border">
                        <Inbox className="w-8 h-8 text-text-muted opacity-50" />
                      </div>
                      <h3 className="text-lg font-extrabold text-text-primary mb-1">No customers found</h3>
                      <p className="text-sm text-text-secondary font-medium">
                        {searchQuery ? 'Try adjusting your search terms.' : 'You do not have any registered customers yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-brand-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleOpenDrawer(customer.id)}
                  >
                    <td className="p-4 pl-6 flex items-center gap-4">
                      <ImageFallback src={customer.avatarUrl} alt={customer.name} className="w-10 h-10 rounded-full object-cover bg-border-light flex-shrink-0" />
                      <div className="font-bold text-text-brand-600 text-sm">{customer.name}</div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="text-text-primary font-medium">{customer.email}</div>
                      {customer.phone && <div className="text-text-muted text-xs mt-0.5">{customer.phone}</div>}
                    </td>
                    <td className="p-4 font-bold text-text-primary">{customer.orderCount || 0}</td>
                    <td className="p-4 font-bold text-brand-600">{formatPrice(customer.totalSpend || 0)}</td>
                    <td className="p-4">
                      {customer.active ? (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-success-50 text-success-700 border border-success-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md bg-danger-50 text-danger-700 border border-danger-200">
                          <Ban className="w-3.5 h-3.5 mr-1" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="p-2 text-text-muted hover:text-brand-600 bg-white rounded-full transition-colors border border-brand-200 shadow-sm">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <div className="p-4 border-t border-border bg-surface-background">
            <Pagination 
              currentPage={pagination.currentPage} 
              totalPages={pagination.totalPages} 
              onPageChange={handlePageChange} 
              itemsPerPage={pagination.itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                fetchCustomers(1);
              }}
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
