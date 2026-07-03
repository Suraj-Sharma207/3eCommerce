import React from 'react';

const discounts = [
  { label: 'All Sale', value: 0 },
  { label: '10% Off or more', value: 10 },
  { label: '20% Off or more', value: 20 },
  { label: '30% Off or more', value: 30 },
  { label: '40% Off or more', value: 40 },
  { label: '50% Off or more', value: 50 },
];

const DiscountFilters = ({ selectedDiscount, setSelectedDiscount }) => {
  return (
    <div className="flex flex-col gap-2 font-normal">
      {discounts.map((discount) => {
        const active = selectedDiscount === discount.value;
        return (
          <button
            key={discount.value}
            onClick={() => setSelectedDiscount(discount.value)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              active
                ? 'bg-danger-600 text-white border-danger-600 shadow-md shadow-danger-200'
                : 'bg-transparent text-text-secondary border-transparent hover:bg-danger-50 hover:text-danger-700 hover:border-danger-100'
            }`}
          >
            {discount.label}
          </button>
        );
      })}
    </div>
  );
};

export default DiscountFilters;
