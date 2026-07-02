import React from 'react';
import { Search } from 'lucide-react';
import ResetFiltersButton from './ResetFiltersButton';

const AdminFilterBar = ({ 
  search, 
  onSearchChange, 
  children,
  onReset
}) => {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:max-w-sm shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {children}
          {onReset && <ResetFiltersButton onReset={onReset} />}
        </div>
      </div>
    </div>
  );
};

export default AdminFilterBar;
