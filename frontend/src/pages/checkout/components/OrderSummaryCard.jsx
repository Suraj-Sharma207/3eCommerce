import React from 'react';
import { Calendar, CreditCard, Wallet, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '../../../utils/currency';
import StatusBadge from './StatusBadge';

const OrderSummaryCard = ({ order }) => {
  if (!order) return null;

  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-border-light p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-border-light">
        
        {/* Order Date */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs text-text-muted mb-1 font-medium">Order Date</p>
          <p className="font-bold text-text-brand-700 text-base">{formattedDate}</p>
          <p className="text-xs text-text-muted mt-0.5">{formattedTime}</p>
        </div>

        {/* Total Paid */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs text-text-muted mb-1 font-medium">Total Paid</p>
          <p className="font-bold text-text-brand-700 text-[18px]">{formatPrice(order.totalAmount)}</p>
        </div>

        {/* Payment Status */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs text-text-muted mb-2 font-medium">Payment Status</p>
          <StatusBadge status={order.paymentStatus} type="payment" />
        </div>

        {/* Payment Method */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs text-text-muted mb-1 font-medium">Payment Method</p>
          <p className="font-bold text-text-brand-700 text-base">{order.paymentMethod || 'Online'}</p>
        </div>
        
      </div>
    </div>
  );
};

export default OrderSummaryCard;
