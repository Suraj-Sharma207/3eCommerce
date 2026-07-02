import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const FilterDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between min-w-[120px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors bg-white
          ${isOpen ? 'border-brand-600 ring-1 ring-brand-600/20 text-brand-700' : 'border-border text-text-primary hover:border-border-dark'}
          ${value && value !== 'All' ? 'bg-brand-50 border-brand-200' : ''}
        `}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-text-muted">{label}:</span>
          <span className="font-bold truncate max-w-[100px]">{selectedOption?.label || 'All'}</span>
        </span>
        <ChevronDown className={`w-4 h-4 ml-2 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[160px] mt-1 bg-white rounded-xl shadow-lg border border-border py-1 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center justify-between transition-colors"
            >
              <span className={value === option.value ? 'font-bold text-brand-600' : 'text-text-primary'}>
                {option.label}
              </span>
              {value === option.value && <Check className="w-4 h-4 text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
