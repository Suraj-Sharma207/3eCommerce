import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/currency';

const ShippingProgress = ({ subtotal, threshold }) => {
  if (!threshold) {
    return (
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 sm:p-5 mb-6 animate-pulse">
        <div className="h-4 bg-brand-200/50 rounded w-1/3 mb-3"></div>
        <div className="h-2 w-full bg-brand-200/50 rounded-full mb-3"></div>
        <div className="h-3 bg-brand-200/50 rounded w-2/3"></div>
      </div>
    );
  }

  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const isFree = remaining === 0;

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-brand-700 font-bold">
          <Truck className="w-5 h-5" />
          <span>Free Shipping</span>
        </div>
        {!isFree && (
          <div className="text-sm font-medium text-brand-600">
            {formatPrice(remaining)} away
          </div>
        )}
      </div>

      <div className="h-2 w-full bg-brand-200/50 rounded-full overflow-hidden mb-3">
        <motion.div 
          className="h-full bg-brand-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="text-sm font-medium">
        {isFree ? (
          <div className="flex items-center gap-1.5 text-success-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>Congratulations! You unlocked <strong>FREE Shipping</strong>.</span>
          </div>
        ) : (
          <span className="text-brand-700">
            Add <strong>{formatPrice(remaining)}</strong> more to get <strong>FREE delivery!</strong>
          </span>
        )}
      </div>
    </div>
  );
};

export default ShippingProgress;
