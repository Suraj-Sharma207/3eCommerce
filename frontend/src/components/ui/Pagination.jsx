import React from 'react';

/**
 * Enterprise Pagination Component
 *
 * Props:
 *  - currentPage:            number
 *  - totalPages:             number
 *  - onPageChange:           (page: number) => void
 *  - itemsPerPage:           number
 *  - onItemsPerPageChange:   (limit: number) => void  (optional)
 *  - itemsPerPageOptions:    number[]
 *  - totalItems:             number   (total unfiltered — from backend)
 *  - filteredItems:          number   (total matching active filters — from backend)
 *  - isFiltered:             boolean  (whether any filters are active)
 *  - label:                  string   (e.g. "Products", "Orders")
 *  - variant:                'default' | 'premium'
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100, 500, 'Max'],
  totalItems,
  filteredItems,
  isFiltered = false,
  label = 'Items',
  variant = 'default'
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

  /**
   * Build the result summary string.
   * - If filtered:    "Showing {filteredItems} of {totalItems} {label}"
   * - If unfiltered:  "Showing {start}–{end} of {totalItems} {label}"
   */
  const buildSummary = () => {
    if (totalItems === undefined || totalItems === null) return null;

    const effectiveFiltered = filteredItems !== undefined ? filteredItems : totalItems;
    const hasFilter = isFiltered || (filteredItems !== undefined && filteredItems < totalItems);

    if (hasFilter) {
      return (
        <span className="text-sm text-text-secondary font-normal">
          Showing{' '}
          <span className="text-text-primary font-normal">{effectiveFiltered}</span>{' '}
          of{' '}
          <span className="text-text-primary font-normal">{totalItems}</span>{' '}
          {label}
        </span>
      );
    }

    const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return (
      <span className="text-sm text-text-secondary font-normal">
        Showing{' '}
        <span className="text-text-primary font-normal">{start}–{end}</span>{' '}
        of{' '}
        <span className="text-text-primary font-normal">{totalItems}</span>{' '}
        {label}
      </span>
    );
  };

  const summary = buildSummary();

  if (variant === 'premium') {
    return (
      <div className="flex items-center justify-center gap-2 select-none font-normal">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
            currentPage === 1
              ? 'border-border-light text-text-muted bg-slate-50 cursor-not-allowed opacity-50'
              : 'border-border text-text-secondary bg-white hover:bg-slate-50 hover:text-brand-600 hover:-translate-y-0.5 active:translate-y-0'
          }`}
          aria-label="Previous page"
        >
          &lt;
        </button>

        {generatePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="w-10 h-10 flex items-center justify-center text-text-muted text-sm font-medium">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-full font-bold text-xs transition-all flex items-center justify-center shadow-sm ${
                  currentPage === page
                    ? 'bg-brand-900 text-white border border-brand-900 hover:bg-brand-950 hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-white text-text-secondary border border-border hover:bg-slate-50 hover:text-brand-600 hover:-translate-y-0.5 active:translate-y-0'
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
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
            currentPage === totalPages
              ? 'border-border-light text-text-muted bg-slate-50 cursor-not-allowed opacity-50'
              : 'border-border text-text-secondary bg-white hover:bg-slate-50 hover:text-brand-600 hover:-translate-y-0.5 active:translate-y-0'
          }`}
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full font-sans font-normal">
      {/* Left: Items per page + summary */}
      <div className="flex flex-wrap items-center gap-3 font-normal">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2 text-sm text-text-secondary font-normal">
            <span>Show</span>
            <select
              value={itemsPerPage === 50000 ? 'Max' : itemsPerPage}
              onChange={(e) => {
                const val = e.target.value;
                onItemsPerPageChange(val === 'Max' ? 50000 : Number(val));
              }}
              className="px-2.5 py-1.5 border border-border rounded-lg bg-white font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-600 text-sm cursor-pointer shadow-sm transition-all"
              aria-label="Items per page"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}

        {summary && (
          <div className="hidden sm:block font-normal">
            {summary}
          </div>
        )}
      </div>

      {/* Right: Page navigation */}
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 font-normal">
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className={`px-3 py-1.5 border rounded text-xs font-bold tracking-wider transition-colors uppercase ${
              currentPage === 1
                ? 'border-border-light text-text-muted bg-surface-background cursor-not-allowed'
                : 'border-border text-text-secondary bg-white hover:bg-surface-background hover:text-text-primary'
            }`}
            aria-label="Previous page"
          >
            PREV
          </button>

          {generatePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="w-8 h-8 flex items-center justify-center text-text-muted text-sm font-medium">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className={`w-8 h-8 rounded font-semibold text-sm transition-all flex items-center justify-center ${
                    currentPage === page
                      ? 'bg-[#082F5C] text-white border border-[#082F5C] shadow-sm'
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
            className={`px-3 py-1.5 border rounded text-xs font-bold tracking-wider transition-colors uppercase ${
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

      {/* Mobile summary */}
      {summary && (
        <div className="sm:hidden text-center w-full font-normal">
          {summary}
        </div>
      )}
    </div>
  );
};

export default Pagination;
