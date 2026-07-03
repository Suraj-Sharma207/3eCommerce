import React from 'react';
import { CreditCard } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatPrice } from '../../../utils/currency';

const PaymentCard = ({ order }) => {
  if (!order) return null;

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6 font-normal">
      <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3 font-normal">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center font-normal">
          <CreditCard className="w-4 h-4 text-brand-600 font-normal" />
        </div>
        <h3 className="font-bold text-text-brand-700 text-sm">Payment Details</h3>
      </div>
      
      <div className="space-y-3 font-normal">
        <div className="flex justify-between items-center text-sm font-normal">
          <span className="text-text-muted font-medium">Method</span>
          <span className="text-text-brand-700 font-normal">{order.paymentMethod || 'Online'}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-normal">
          <span className="text-text-muted font-medium">Status</span>
          <StatusBadge status={order.paymentStatus} type="payment" />
        </div>
        <div className="flex justify-between items-center text-sm font-normal">
          <span className="text-text-muted font-medium">Amount</span>
          <span className="text-text-brand-700 font-normal">{formatPrice(order.totalAmount)}</span>
        </div>
        {order.transactionRef && (
          <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-gray-50 font-normal">
            <span className="text-text-muted font-medium">Txn ID</span>
            <span className="text-xs text-text-secondary truncate max-w-[120px] font-normal" title={order.transactionRef}>
              {order.transactionRef}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;
