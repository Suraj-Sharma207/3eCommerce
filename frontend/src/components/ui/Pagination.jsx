import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  const generatePages = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 7; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 6; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-border p-3.5 mx-auto w-full max-w-4xl font-sans">
      {onItemsPerPageChange ? (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2.5 py-1.5 border border-border rounded-lg bg-white font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm cursor-pointer shadow-sm transition-all"
          >
            {itemsPerPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>items per page</span>
        </div>
      ) : (
        <div className="hidden sm:block" />
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={`px-4 py-2 border rounded text-xs font-bold tracking-wider transition-colors uppercase ${
              currentPage === 1
                ? 'border-border-light text-text-muted bg-surface-background cursor-not-allowed'
                : 'border-border text-text-secondary bg-white hover:bg-surface-background hover:text-text-primary'
            }`}
            aria-label="Previous page"
          >
            PREVIOUS
          </button>

          {generatePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="w-10 h-10 flex items-center justify-center text-text-muted text-sm font-bold">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-10 h-10 rounded font-semibold text-sm transition-all flex items-center justify-center ${
                    currentPage === page 
                      ? 'bg-[#222222] text-white border border-[#222222] shadow-sm' 
                      : 'bg-white text-text-secondary border border-border hover:bg-surface-background hover:text-text-primary'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          <button 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className={`px-4 py-2 border rounded text-xs font-bold tracking-wider transition-colors uppercase ${
              currentPage === totalPages
                ? 'border-border-light text-text-muted bg-surface-background cursor-not-allowed'
                : 'border-border text-text-secondary bg-white hover:bg-surface-background hover:text-text-primary'
            }`}
            aria-label="Next page"
          >
            NEXT
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Pagination;
