import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { formatPrice } from "../../../utils/currency";

const predefinedRanges = [
  { label: "All", value: "All" },
  { label: "₹0 - ₹999", value: "0-999" },
  { label: "₹1000 - ₹5000", value: "1000-5000" },
  { label: "₹5000 - ₹10000", value: "5000-10000" },
  { label: "₹10000+", value: "10000-" },
];

const PriceRangeFilter = ({ label, min, max, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentValue =
    min && max ? `${min}-${max}` : min ? `${min}-` : max ? `0-${max}` : "All";
  const selectedOption = predefinedRanges.find(
    (opt) => opt.value === currentValue,
  ) || { label: "Custom Range" };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    if (value === "All") {
      onChange(null, null);
    } else {
      const [newMin, newMax] = value.split("-");
      onChange(newMin || null, newMax || null);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between min-w-[120px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors bg-white
 ${isOpen ? "border-brand-600 ring-1 ring-brand-600/20 text-brand-700" : "border-border text-text-primary hover:border-border-dark"}
 ${min || max ? "bg-brand-50 border-brand-200" : ""}
`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <span className="text-text-muted font-medium">{label}:</span>
          <span className="truncate max-w-[120px]">{selectedOption.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-1 bg-white rounded-xl shadow-lg border border-border py-1 overflow-hidden">
          {predefinedRanges.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center justify-between transition-colors"
            >
              <span
                className={
                  currentValue === option.value
                    ? "font-bold text-brand-600"
                    : "text-text-primary"
                }
              >
                {option.label}
              </span>
              {currentValue === option.value && (
                <Check className="w-4 h-4 text-brand-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceRangeFilter;
