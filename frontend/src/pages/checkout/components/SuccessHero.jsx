import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const SuccessHero = ({ customerName }) => {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 mb-10">
      <div className="w-24 h-24 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <CheckCircle2 className="w-12 h-12 text-success-600 relative z-10" />
        <div className="absolute inset-0 rounded-full border-4 border-success-200 animate-ping opacity-20"></div>
        {/* Subtle decorative particles */}
        <div className="absolute -top-2 -left-4 w-2 h-2 bg-success-300 rounded-full opacity-50"></div>
        <div className="absolute top-1/2 -right-6 w-3 h-3 border-2 border-brand-200 rounded-full opacity-50"></div>
        <div className="absolute -bottom-4 left-1/4 w-2 h-2 bg-warning-300 rounded-full opacity-50"></div>
      </div>

      <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-text-brand-700 mb-3 tracking-tight">
        {customerName ? `Thank you, ${customerName}!` : 'Order Confirmed!'}
      </h1>
      <p className="text-lg text-text-secondary max-w-lg mx-auto">
        Your order has been placed successfully. We'll send you an email confirmation shortly.
      </p>
    </div>
  );
};

export default SuccessHero;
