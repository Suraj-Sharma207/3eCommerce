import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useAdminStore from '../../../store/adminStore';
import LoadingSpinner from '../../ui/LoadingSpinner';

// Lazy load the specific panels to save initial bundle size
const RevenuePanel = React.lazy(() => import('./RevenuePanel'));
const OrdersPanel = React.lazy(() => import('./OrdersPanel'));
const CustomersPanel = React.lazy(() => import('./CustomersPanel'));
const ProductsPanel = React.lazy(() => import('./ProductsPanel'));
const DeliveriesPanel = React.lazy(() => import('./DeliveriesPanel'));
const CancellationsPanel = React.lazy(() => import('./CancellationsPanel'));

const panelMap = {
  revenue: { title: 'Revenue Analytics', Component: RevenuePanel },
  orders: { title: 'Orders Analytics', Component: OrdersPanel },
  customers: { title: 'Customers Analytics', Component: CustomersPanel },
  products: { title: 'Products Analytics', Component: ProductsPanel },
  deliveries: { title: 'Delivery Analytics', Component: DeliveriesPanel },
  cancellations: { title: 'Cancellation Analytics', Component: CancellationsPanel },
};

const AnalyticsDrawer = ({ isOpen, onClose, type }) => {
  const { fetchDetailedAnalytics, detailedLoading } = useAdminStore();

  useEffect(() => {
    if (isOpen && type) {
      fetchDetailedAnalytics(type);
    }
  }, [isOpen, type, fetchDetailedAnalytics]);

  const config = panelMap[type];

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && config && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity font-normal"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[420px] lg:w-[480px] bg-white shadow-2xl border-l border-border flex flex-col font-normal"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-background/50 font-normal">
              <h2 className="text-xl text-text-primary font-bold">{config.title}</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors text-text-muted hover:text-text-primary font-medium"
              >
                <X className="w-5 h-5 font-normal" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-6 relative font-normal">
              {detailedLoading[type] ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted font-medium">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-sm font-normal">Aggregating live data...</p>
                </div>
              ) : (
                <React.Suspense fallback={<LoadingSpinner />}>
                  <config.Component />
                </React.Suspense>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsDrawer;
