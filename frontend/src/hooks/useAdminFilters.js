import { useSearchParams } from 'react-router-dom';
import { useCallback, useState, useEffect, useMemo } from 'react';

const useAdminFilters = (defaultFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize URL with default filters if they don't exist
  useEffect(() => {
    let changed = false;
    const currentParams = Object.fromEntries(searchParams.entries());
    Object.keys(defaultFilters).forEach(key => {
      if (currentParams[key] === undefined) {
        currentParams[key] = defaultFilters[key];
        changed = true;
      }
    });
    if (changed) {
      setSearchParams(currentParams, { replace: true });
    }
    setIsInitialized(true);
  }, []);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      const current = Object.fromEntries(searchParams.entries());
      if (localSearch) {
        if (current.search !== localSearch) {
          current.search = localSearch;
          current.page = '1';
          setSearchParams(current);
        }
      } else {
        if (current.search !== undefined) {
          delete current.search;
          current.page = '1';
          setSearchParams(current);
        }
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, searchParams, setSearchParams]);

  const updateFilter = useCallback((key, value) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (value === null || value === undefined || value === '' || value === 'All') {
      delete currentParams[key];
    } else {
      currentParams[key] = value;
    }
    currentParams.page = '1';
    setSearchParams(currentParams);
  }, [searchParams, setSearchParams]);

  const updateFilters = useCallback((updates) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    let hasChanges = false;
    Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || value === 'All') {
            if(currentParams[key] !== undefined) {
                delete currentParams[key];
                hasChanges = true;
            }
        } else {
            if(currentParams[key] !== String(value)) {
                currentParams[key] = value;
                hasChanges = true;
            }
        }
    });
    if(hasChanges){
        currentParams.page = '1';
        setSearchParams(currentParams);
    }
  }, [searchParams, setSearchParams]);

  const resetFilters = useCallback(() => {
    setLocalSearch('');
    const params = new URLSearchParams();
    Object.keys(defaultFilters).forEach(key => {
      if (defaultFilters[key]) params.set(key, defaultFilters[key]);
    });
    setSearchParams(params);
  }, [defaultFilters, setSearchParams]);

  const activeFilters = useMemo(() => {
    return Object.fromEntries(searchParams.entries());
  }, [searchParams]);
  
  return {
    search: localSearch,
    setSearch: setLocalSearch,
    filters: activeFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    isInitialized
  };
};

export default useAdminFilters;
