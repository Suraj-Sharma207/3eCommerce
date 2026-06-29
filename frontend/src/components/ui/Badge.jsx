import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-brand-50 text-brand-700 border border-brand-200',
    success: 'bg-success-500 text-white border border-success-600',
    warning: 'bg-warning-500 text-white border border-warning-600',
    danger: 'bg-danger-600 text-white border border-danger-700',
    neutral: 'bg-surface-background text-text-secondary border border-border',
    outline: 'bg-transparent border border-border text-text-secondary',
    sale: 'bg-danger-600 text-white',
    new: 'bg-brand-600 text-white',
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    processing: 'bg-blue-100 text-blue-800 border border-blue-200',
    packed: 'bg-brand-100 text-brand-800 border border-brand-200',
    shipped: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    delivered: 'bg-green-100 text-green-800 border border-green-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200',
    refunded: 'bg-gray-100 text-gray-800 border border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
