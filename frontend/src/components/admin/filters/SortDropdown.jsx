import React, { useState, useRef, useEffect } from'react';
import { ArrowDownAZ, Check, ArrowDown, ArrowUp } from'lucide-react';

const SortDropdown = ({ options, value, order, onChange }) => {
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

 const handleOrderToggle = (e) => {
 e.stopPropagation();
 onChange(value, order ==='asc' ?'desc' :'asc');
 };

 return (
 <div className="relative" ref={dropdownRef}>
 <div className="flex items-center">
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={`inline-flex items-center justify-between min-w-[120px] px-3 py-2 text-sm font-medium rounded-l-lg border border-r-0 transition-colors bg-white
 ${isOpen ?'border-brand-600 ring-1 ring-brand-600/20 text-brand-700' :'border-border text-text-primary hover:border-border-dark'}
 ${value ?'bg-brand-50 border-brand-200' :''}
`}
 >
 <span className="flex items-center gap-1.5 truncate">
 <ArrowDownAZ className="w-4 h-4 text-text-muted shrink-0 font-medium" />
 <span className="truncate max-w-[100px]">{selectedOption?.label ||'Sort'}</span>
 </span>
 </button>
 <button
 type="button"
 onClick={handleOrderToggle}
 title={order ==='asc' ?'Ascending' :'Descending'}
 className={`inline-flex items-center justify-center px-2 py-2 text-sm border rounded-r-lg transition-colors bg-white hover:bg-surface-hover
 ${isOpen ?'border-brand-600 ring-1 ring-brand-600/20' :'border-border'}
 ${value ?'bg-brand-50 border-brand-200 hover:bg-brand-100' :''}
`}
 >
 {order ==='asc' ? <ArrowUp className="w-4 h-4 text-text-muted shrink-0 font-medium" /> : <ArrowDown className="w-4 h-4 text-text-muted shrink-0 font-medium" />}
 </button>
 </div>

 {isOpen && (
 <div className="absolute right-0 z-50 w-full min-w-[180px] mt-1 bg-white rounded-xl shadow-lg border border-border py-1 overflow-hidden">
 {options.map((option) => (
 <button
 key={option.value}
 onClick={() => {
 onChange(option.value, order ||'desc');
 setIsOpen(false);
 }}
 className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center justify-between transition-colors"
 >
 <span className={value === option.value ?'font-bold text-brand-600' :'text-text-primary'}>
 {option.label}
 </span>
 {value === option.value && <Check className="w-4 h-4 text-brand-600 shrink-0" />}
 </button>
 ))}
 </div>
 )}
 </div>
 );
};

export default SortDropdown;
