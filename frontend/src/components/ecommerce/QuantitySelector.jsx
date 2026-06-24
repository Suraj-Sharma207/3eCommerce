import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ quantity, setQuantity, min = 1, max = 99, className = '' }) => {
  const handleDecrease = () => {
    if (quantity > min) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < max) setQuantity(quantity + 1);
  };

  return (
    <div className={`inline-flex items-center border border-secondary-200 rounded-lg bg-surface ${className}`}>
      <button 
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="p-3 text-text-secondary hover:text-primary-600 disabled:opacity-50 transition-colors focus:outline-none"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="w-12 text-center text-base font-semibold text-text-primary select-none">
        {quantity}
      </div>
      <button 
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="p-3 text-text-secondary hover:text-primary-600 disabled:opacity-50 transition-colors focus:outline-none"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default QuantitySelector;
