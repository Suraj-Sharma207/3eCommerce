import React, { useEffect } from 'react';
import { X, User as UserIcon, Mail, Phone, Calendar, MapPin, Package, Heart, Ban, CheckCircle } from 'lucide-react';
import useCustomerStore from '../../store/customerStore';
import Button from '../ui/Button';
import SkeletonLoader from '../ui/SkeletonLoader';
import ImageFallback from '../ui/ImageFallback';
import { formatPrice } from '../../utils/currency';
import toast from 'react-hot-toast';

const CustomerDetailsDrawer = ({ isOpen, onClose, customerId }) => {
  const { selectedCustomer, isLoading, fetchCustomerDetails, updateCustomerStatus } = useCustomerStore();

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails(customerId);
    }
  }, [isOpen, customerId, fetchCustomerDetails]);

  if (!isOpen) return null;

  const handleToggleStatus = async () => {
    if (!selectedCustomer) return;
    const newStatus = !selectedCustomer.active;
    const success = await updateCustomerStatus(selectedCustomer.id, newStatus);
    if (success) {
      toast.success(`Customer account ${newStatus ? 'enabled' : 'disabled'} successfully`);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[60] bg-secondary-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-surface shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-border animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-background">
          <h2 className="text-xl font-extrabold text-text-primary">Customer Details</h2>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors focus:outline-none rounded-lg p-1.5 hover:bg-border-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          {isLoading || !selectedCustomer ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <SkeletonLoader className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <SkeletonLoader className="h-6 w-32" />
                  <SkeletonLoader className="h-4 w-48" />
                </div>
              </div>
              <SkeletonLoader className="h-32 w-full" />
              <SkeletonLoader className="h-48 w-full" />
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div className="flex items-start gap-5">
                <ImageFallback 
                  src={selectedCustomer.avatarUrl} 
                  alt={selectedCustomer.name} 
                  className="w-20 h-20 rounded-full border border-border object-cover" 
                />
                <div>
                  <h3 className="text-xl font-extrabold text-text-brand-600 mb-1">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                    <Mail className="w-4 h-4 text-text-muted" />
                    {selectedCustomer.email}
                  </div>
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                      <Phone className="w-4 h-4 text-text-muted" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.active ? (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded bg-success-50 text-success-700 border border-success-200">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active Account
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded bg-danger-50 text-danger-700 border border-danger-200">
                      <Ban className="w-3.5 h-3.5 mr-1" /> Disabled Account
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-background rounded-xl border border-border">
                  <div className="text-sm font-bold text-text-muted mb-1 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Total Orders
                  </div>
                  <div className="text-2xl font-extrabold text-text-primary">
                    {selectedCustomer.orderCount || 0}
                  </div>
                </div>
                <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                  <div className="text-sm font-bold text-brand-600 mb-1">Total Spend</div>
                  <div className="text-2xl font-extrabold text-brand-700">
                    {formatPrice(selectedCustomer.totalSpend || 0)}
                  </div>
                </div>
              </div>

              {/* Addresses section */}
              <div>
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-muted" /> Saved Addresses
                </h4>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.addresses.map((address) => (
                      <div key={address.id} className="p-3 border border-border rounded-lg text-sm bg-surface-background">
                        <div className="font-bold text-text-primary mb-1 flex justify-between">
                          {address.label} 
                          {address.isDefaultShipping && <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 rounded uppercase">Default</span>}
                        </div>
                        <div className="text-text-secondary">{address.street}, {address.city}</div>
                        <div className="text-text-secondary">{address.state}, {address.zipCode}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text-muted p-4 bg-surface-background rounded-lg border border-dashed border-border-light text-center">
                    No addresses saved yet.
                  </div>
                )}
              </div>

              {/* Recent Orders section */}
              <div>
                <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-text-muted" /> Recent Orders
                </h4>
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-3 border border-border rounded-lg text-sm flex justify-between items-center bg-surface-background">
                        <div>
                          <div className="font-bold text-brand-600">#{order.orderNumber.substring(0, 8).toUpperCase()}</div>
                          <div className="text-text-muted text-xs">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-text-primary">{formatPrice(order.totalAmount)}</div>
                          <span className="text-[10px] uppercase font-bold text-text-secondary">{order.orderStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-text-muted p-4 bg-surface-background rounded-lg border border-dashed border-border-light text-center">
                    No orders placed yet.
                  </div>
                )}
              </div>
              
              {/* Other details */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-text-muted flex items-center gap-2"><Heart className="w-4 h-4" /> Wishlist Items</span>
                  <span className="font-bold text-text-primary">{selectedCustomer.wishlistCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-text-muted flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined Date</span>
                  <span className="font-bold text-text-primary">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-surface-background">
          <Button 
            className="w-full"
            variant={selectedCustomer?.active ? 'outline' : 'primary'}
            onClick={handleToggleStatus}
            disabled={isLoading || !selectedCustomer}
          >
            {selectedCustomer?.active ? (
              <><Ban className="w-4 h-4 mr-2 text-danger-600" /> <span className="text-danger-600 font-bold">Disable Account</span></>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> Enable Account</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default CustomerDetailsDrawer;
