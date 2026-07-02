import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
  CONFIRMED:  { label: 'Confirmed',  bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400'   },
  PROCESSING: { label: 'Processing', bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  SHIPPED:    { label: 'Shipped',    bg: 'bg-brand-50',  text: 'text-brand-700',  border: 'border-brand-200',  dot: 'bg-brand-500'  },
  DELIVERED:  { label: 'Delivered',  bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500'   },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400'     },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const StatusDropdown = ({ value, onChange, isLoading = false, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.PENDING;

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 240; // approx max height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const top = spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove
      ? rect.bottom + window.scrollY + 4
      : rect.top + window.scrollY - dropdownHeight - 4;

    setDropdownStyle({
      position: 'absolute',
      top,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 160),
      zIndex: 99999,
    });
  }, []);

  const open = useCallback(() => {
    if (disabled || isLoading) return;
    calculatePosition();
    setIsOpen(true);
  }, [disabled, isLoading, calculatePosition]);

  const close = useCallback(() => setIsOpen(false), []);

  const handleSelect = (status) => {
    if (status !== value) onChange(status);
    close();
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // Close on Escape, reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') close(); };
    const handleScroll = () => { calculatePosition(); };
    document.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', calculatePosition);
    return () => {
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, close, calculatePosition]);

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        disabled={disabled || isLoading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
          border transition-all duration-150 select-none min-w-[120px] justify-between
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-600
          ${cfg.bg} ${cfg.text} ${cfg.border}
          ${isLoading || disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:opacity-90 hover:shadow-sm'}
        `}
      >
        <span className="flex items-center gap-1.5">
          {isLoading
            ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          }
          {cfg.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Portal dropdown */}
      {isOpen && createPortal(
        <ul
          ref={dropdownRef}
          role="listbox"
          aria-label="Order status"
          style={dropdownStyle}
          className="bg-white border border-border rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {STATUS_ORDER.map((status) => {
            const s = STATUS_CONFIG[status];
            const isSelected = status === value;
            return (
              <li
                key={status}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(status)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(status); }}
                tabIndex={0}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold cursor-pointer
                  transition-colors duration-100 focus:outline-none
                  ${isSelected ? `${s.bg} ${s.text}` : 'text-gray-700 hover:bg-gray-50'}
                `}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className="flex-1">{s.label}</span>
                {isSelected && <Check className={`w-3.5 h-3.5 ${s.text}`} />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </>
  );
};

export default StatusDropdown;
