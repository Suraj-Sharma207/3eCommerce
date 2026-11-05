import React, { useState, useRef, useEffect } from "react";
import { Calendar, Check } from "lucide-react";

const dateRanges = [
  { label: "All Time", value: "All" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Month", value: "thisMonth" },
  { label: "Last Month", value: "lastMonth" },
];

const DateRangePicker = ({ label = "Date", value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption =
    dateRanges.find((opt) => opt.value === value) || dateRanges[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between min-w-[140px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors bg-white
 ${isOpen ? "border-brand-600 ring-1 ring-brand-600/20 text-brand-700" : "border-border text-text-primary hover:border-border-dark"}
 ${value && value !== "All" ? "bg-brand-50 border-brand-200" : ""}
`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <Calendar className="w-4 h-4 text-text-muted shrink-0 font-medium" />
          <span className="text-text-muted font-medium">{label}:</span>
          <span className="truncate max-w-[100px]">{selectedOption.label}</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-[180px] mt-1 bg-white rounded-xl shadow-lg border border-border py-1 overflow-hidden">
          {dateRanges.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center justify-between transition-colors"
            >
              <span
                className={
                  value === option.value
                    ? "font-bold text-brand-600"
                    : "text-text-primary"
                }
              >
                {option.label}
              </span>
              {value === option.value && (
                <Check className="w-4 h-4 text-brand-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
