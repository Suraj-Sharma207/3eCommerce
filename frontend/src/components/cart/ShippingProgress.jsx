import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/currency';

const ShippingProgress = ({ subtotal, threshold }) => {
  if (!threshold) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 animate-pulse shadow-sm font-normal">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4 font-normal" />
        <div className="h-2 w-full bg-slate-200 rounded-full mb-3 font-normal" />
        <div className="h-3 bg-slate-200 rounded w-2/3 font-normal" />
      </div>
    );
  }

  const remaining = Math.max(0, threshold - subtotal);
  const progress  = Math.min(100, (subtotal / threshold) * 100);
  const isFree    = remaining === 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm font-normal">
      {/* Top row: truck + text + "₹X more to go" */}
      <div className="flex items-center gap-4 mb-4 font-normal">
        {/* Truck icon box */}
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-normal">
          <Truck className="w-5 h-5 text-[#1B2340] font-normal" />
        </div>

        {/* Main text */}
        <div className="flex-1 min-w-0 font-normal">
          <p className="text-sm text-[#1B2340] font-normal">
            {isFree
              ? "You're eligible for FREE Shipping!"
              : 'Unlock FREE Shipping'}
          </p>
        </div>

        {/* Right: remaining text */}
        {!isFree && (
          <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap font-normal">
            {formatPrice(remaining)} more to go
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-3 font-normal">
        <motion.div
          className="h-full rounded-full bg-[#1B2340] font-normal"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Bottom status */}
      {isFree ? (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-normal">
          <CheckCircle2 className="w-4 h-4 shrink-0 font-normal" />
          <span>
            Congratulations! You have unlocked{' '}
            <span className="text-emerald-700 font-normal">FREE Shipping.</span>
          </span>
        </div>
      ) : (
        <p className="text-xs text-slate-500 font-normal">
          Add <span className="text-[#1B2340] font-normal">{formatPrice(remaining)}</span> more to get{' '}
          <span className="text-[#1B2340] font-normal">FREE delivery!</span>
        </p>
      )}
    </div>
  );
};

export default ShippingProgress;
