import React from 'react';
import { CreditCard } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatPrice } from '../../../utils/currency';

const PaymentCard = ({ order }) => {
  if (!order) return null;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-brand-600" />
        </div>
        <h3 className="font-bold text-text-brand-700 text-sm">Payment Details</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Method</span>
          <span className="font-bold text-text-brand-700">{order.paymentMethod || 'Online'}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Status</span>
          <StatusBadge status={order.paymentStatus} type="payment" />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-text-muted">Amount</span>
          <span className="font-bold text-text-brand-700">{formatPrice(order.totalAmount)}</span>
        </div>
        {order.transactionRef && (
          <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-gray-50">
            <span className="text-text-muted">Txn ID</span>
            <span className="font-medium text-xs text-text-secondary truncate max-w-[120px]" title={order.transactionRef}>
              {order.transactionRef}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;
