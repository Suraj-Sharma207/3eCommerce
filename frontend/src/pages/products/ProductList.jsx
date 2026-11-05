import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import PageContainer from "../../components/layout/PageContainer";
import ProductCard from "../../components/products/ProductCard";
import ProductGrid from "../../components/products/ProductGrid";
import Pagination from "../../components/ui/Pagination";
import useProductStore from "../../store/productStore";
import useCategoryStore from "../../store/categoryStore";
import {
  parseCategoryParam,
  getSlugFromCategoryName,
} from "../../utils/categoryMapping";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Grid,
  List,
  Star,
  ShoppingBag,
} from "lucide-react";

const ALL_RATINGS = [4, 3, 2, 1];

// Premium Skeleton Component for Loading State
const SkeletonLoader = () => {
  return (
    <div className="space-y-8 animate-pulse w-full max-w-[1600px] mx-auto px-4">
      {/* Skeleton Hero */}
      <div className="h-[280px] bg-slate-200 rounded-[32px] w-full" />

      {/* Skeleton Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Skeleton Sidebar */}
        <div className="w-full lg:w-[320px] shrink-0 h-[600px] bg-slate-200 rounded-[28px]" />

        {/* Skeleton Grid */}
        <div className="flex-1 space-y-6">
          <div className="h-16 bg-slate-200 rounded-2xl w-full" />
          <ProductGrid>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/5] bg-slate-200 rounded-[22px] w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-8 bg-slate-200 rounded-full w-full" />
              </div>
            ))}
          </ProductGrid>
        </div>
      </div>
    </div>
  );
};

const ProductList = () => {
  const [shopBanner, setShopBanner] = useState(null);
  const [bannerStatus, setBannerStatus] = useState("loading");

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await api.get("/shop-banner");
        if (response.data?.success && response.data.data) {
          setShopBanner(response.data.data);
          setBannerStatus("success");
        } else {
          setBannerStatus("empty");
        }
      } catch (error) {
        console.error("Failed to fetch shop banner:", error);
        if (error.response?.status === 404) {
          setBannerStatus("empty");
        } else {
          setBannerStatus("error");
        }
      }
    };
    fetchBanner();
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    pagination,
    filters,
    clearFilters: clearStoreFilters,
    searchQuery,
    setSearchQuery,
  } = useProductStore();
  const { categories: categoriesList } = useCategoryStore();

  // Sidebar open state (mostly mobile drawer)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); //'grid' or'list'

  // Expandable Accordions state for Filter Sidebar
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    rating: true,
    price: true,
    availability: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Parse parameters from URL search parameters
  const categoryParam = searchParams.get("category");
  const ratingsParam = searchParams.get("ratings") || "";
  const availabilityParam = searchParams.get("availability") || "";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page")) || 1;

  // Local inputs state for prices to allow debouncing
  const [minPriceInput, setMinPriceInput] = useState(minPriceParam);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPriceParam);

  // Sync inputs with searchParams when changed (e.g. on clear all)
  useEffect(() => {
    setMinPriceInput(minPriceParam);
    setMaxPriceInput(maxPriceParam);
  }, [minPriceParam, maxPriceParam]);

  // Read selectedCategories: if categoryParam is null, all categories are selected.
  const selectedCategories = useMemo(() => {
    if (categoryParam === null) {
      return categoriesList.map((c) => c.name);
    }
    return categoryParam ? parseCategoryParam(categoryParam) : [];
  }, [categoryParam, categoriesList]);

  const selectedRatings = useMemo(() => {
    return ratingsParam ? ratingsParam.split(",").map(Number) : [];
  }, [ratingsParam]);

  const selectedAvailability = useMemo(() => {
    return availabilityParam ? availabilityParam.split(",") : [];
  }, [availabilityParam]);

  // Categories are now loaded centrally from App.jsx

  // Sync URL params to store filters and trigger fetch.
  // Uses a ref-guarded approach to batch setFilters + setSearchQuery + fetchProducts
  // into a single synchronous update, preventing re-render cascades that caused
  // duplicate fetchProducts calls.
  const fetchScheduledRef = React.useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches within the same render cycle
    if (fetchScheduledRef.current) return;
    fetchScheduledRef.current = true;

    // Use microtask to batch all state updates before the fetch
    queueMicrotask(() => {
      fetchScheduledRef.current = false;

      let backendCategory = "All";
      if (categoryParam !== null) {
        backendCategory = categoryParam
          ? parseCategoryParam(categoryParam).join(",")
          : "";
      }

      const parsedRatings = ratingsParam
        ? ratingsParam.split(",").map(Number)
        : [];
      const backendMinRating =
        parsedRatings.length > 0 ? Math.min(...parsedRatings) : "";

      const parsedAvailability = availabilityParam
        ? availabilityParam.split(",")
        : [];
      const backendInStock = parsedAvailability.includes("inStock");
      const backendSale = parsedAvailability.includes("sale");

      // Batch: sync search query if changed
      if (searchParam !== useProductStore.getState().searchQuery) {
        setSearchQuery(searchParam);
      }

      // Batch: sync filters — use direct store setState to avoid triggering
      // the pagination reset that setFilters() applies (page is URL-driven)
      useProductStore.setState((state) => ({
        filters: {
          ...state.filters,
          category: backendCategory,
          minRating: backendMinRating,
          inStock: backendInStock,
          sale: backendSale,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          sort: sortParam,
        },
      }));

      // Single fetch with the correct page
      fetchProducts(pageParam);
    });
  }, [
    categoryParam,
    minPriceParam,
    maxPriceParam,
    ratingsParam,
    availabilityParam,
    sortParam,
    pageParam,
    searchParam,
  ]);

  // Debounced price range filters sync to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      let changed = false;

      if (minPriceInput !== minPriceParam) {
        if (minPriceInput) newParams.set("minPrice", minPriceInput);
        else newParams.delete("minPrice");
        changed = true;
      }

      if (maxPriceInput !== maxPriceParam) {
        if (maxPriceInput) newParams.set("maxPrice", maxPriceInput);
        else newParams.delete("maxPrice");
        changed = true;
      }

      if (changed) {
        newParams.set("page", "1");
        setSearchParams(newParams, { replace: true });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    minPriceInput,
    maxPriceInput,
    minPriceParam,
    maxPriceParam,
    searchParams,
    setSearchParams,
  ]);

  // Debounced search sync to URL
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newParams = new URLSearchParams(searchParams);
      const urlSearch = searchParams.get("search") || "";
      if (searchQuery !== urlSearch) {
        if (searchQuery) newParams.set("search", searchQuery);
        else newParams.delete("search");
        newParams.set("page", "1");
        setSearchParams(newParams, { replace: true });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchParams, setSearchParams]);

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryToggle = (cat) => {
    const newParams = new URLSearchParams(searchParams);

    if (cat === "All") {
      const isAllChecked = selectedCategories.length === categoriesList.length;
      if (isAllChecked) {
        newParams.set("category", "");
      } else {
        newParams.delete("category");
      }
    } else {
      let newCats = [...selectedCategories];
      if (newCats.includes(cat)) {
        newCats = newCats.filter((c) => c !== cat);
      } else {
        newCats.push(cat);
      }

      if (newCats.length === categoriesList.length) {
        newParams.delete("category");
      } else {
        newParams.set(
          "category",
          newCats.map((c) => getSlugFromCategoryName(c)).join(","),
        );
      }
    }

    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleRatingToggle = (rating) => {
    const newParams = new URLSearchParams(searchParams);

    if (rating === "All") {
      newParams.delete("ratings");
    } else {
      let newRatings = [...selectedRatings];
      if (selectedRatings.length === 0) {
        newRatings = [4, 3, 2, 1].filter((r) => r !== rating);
      } else {
        if (newRatings.includes(rating)) {
          newRatings = newRatings.filter((r) => r !== rating);
        } else {
          newRatings.push(rating);
        }
      }

      if (newRatings.length === 4 || newRatings.length === 0) {
        newParams.delete("ratings");
      } else {
        newParams.set("ratings", newRatings.join(","));
      }
    }

    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleAvailabilityToggle = (value) => {
    const newParams = new URLSearchParams(searchParams);
    let newAvail = [...selectedAvailability];
    if (newAvail.includes(value)) {
      newAvail = newAvail.filter((v) => v !== value);
    } else {
      newAvail.push(value);
    }

    if (newAvail.length > 0) {
      newParams.set("availability", newAvail.join(","));
    } else {
      newParams.delete("availability");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleClearAllFilters = () => {
    clearStoreFilters();
    setSearchParams(new URLSearchParams());
  };

  const handleSortChange = (value) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", value);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  // Helper to remove a single category chip
  const removeCategoryFilter = (cat) => {
    let newCats = selectedCategories.filter((c) => c !== cat);
    const newParams = new URLSearchParams(searchParams);
    if (newCats.length === 0 || newCats.length === categoriesList.length) {
      newParams.delete("category");
    } else {
      newParams.set(
        "category",
        newCats.map((c) => getSlugFromCategoryName(c)).join(","),
      );
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  // Helper to remove a single rating chip
  const removeRatingFilter = (rating) => {
    let newRatings = selectedRatings.filter((r) => r !== rating);
    const newParams = new URLSearchParams(searchParams);
    if (newRatings.length === 0 || newRatings.length === 4) {
      newParams.delete("ratings");
    } else {
      newParams.set("ratings", newRatings.join(","));
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  // Helper to remove price range filter
  const removePriceFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("minPrice");
    newParams.delete("maxPrice");
    setMinPriceInput("");
    setMaxPriceInput("");
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  // Helper to remove availability chip
  const removeAvailabilityFilter = (value) => {
    let newAvail = selectedAvailability.filter((v) => v !== value);
    const newParams = new URLSearchParams(searchParams);
    if (newAvail.length > 0) {
      newParams.set("availability", newAvail.join(","));
    } else {
      newParams.delete("availability");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const sortOptions = [
    { value: "newest", label: "Newest Arrivals" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "highest_rated", label: "Highest Rated" },
    { value: "discount", label: "Largest Discount" },
  ];

  const startItem =
    pagination.totalItems > 0
      ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1
      : 0;
  const endItem = Math.min(
    startItem + pagination.itemsPerPage - 1,
    pagination.totalItems,
  );

  // Generate lists of active filter chips
  const activeChips = useMemo(() => {
    const chips = [];

    // Categories (if not all are selected)
    if (
      categoryParam !== null &&
      selectedCategories.length < categoriesList.length
    ) {
      selectedCategories.forEach((cat) => {
        chips.push({
          id: `cat-${cat}`,
          label: cat,
          onRemove: () => removeCategoryFilter(cat),
        });
      });
    }

    // Ratings
    selectedRatings.forEach((rating) => {
      chips.push({
        id: `rating-${rating}`,
        label: `${rating} ★ & Up`,
        onRemove: () => removeRatingFilter(rating),
      });
    });

    // Price
    if (minPriceParam || maxPriceParam) {
      let label = "";
      if (minPriceParam && maxPriceParam)
        label = `₹${minPriceParam} - ₹${maxPriceParam}`;
      else if (minPriceParam) label = `Above ₹${minPriceParam}`;
      else if (maxPriceParam) label = `Under ₹${maxPriceParam}`;

      chips.push({
        id: "price-filter",
        label,
        onRemove: removePriceFilter,
      });
    }

    // Availability
    selectedAvailability.forEach((avail) => {
      chips.push({
        id: `avail-${avail}`,
        label: avail === "inStock" ? "In Stock" : "On Sale",
        onRemove: () => removeAvailabilityFilter(avail),
      });
    });

    return chips;
  }, [
    categoryParam,
    selectedCategories,
    selectedRatings,
    minPriceParam,
    maxPriceParam,
    selectedAvailability,
    categoriesList,
  ]);

  if (isLoading && products.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      {/* 1. Premium Hero Header */}
      <div className="relative rounded-[32px] overflow-hidden border border-[#E3D8C8] shadow-sm w-full">
        {bannerStatus === "loading" || bannerStatus === "error" ? (
          <div className="w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[260px] bg-slate-200 animate-pulse" />
        ) : bannerStatus === "empty" ? (
          <div className="w-full h-[140px] sm:h-[180px] md:h-[220px] lg:h-[260px] bg-surface-background flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
              No Shop Banner Uploaded
            </h3>
            <p className="text-text-secondary text-sm sm:text-base">
              Please upload a Shop Banner from
              <br />
              <strong>Admin → Settings → Shop Banner</strong>
            </p>
          </div>
        ) : (
          <img
            src={shopBanner?.image}
            alt="Shop Banner"
            className="w-full h-auto block select-none pointer-events-none"
            draggable={false}
          />
        )}
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Count */}
        <div className="text-sm text-text-secondary">
          Showing{" "}
          <span className="text-text-primary">
            {startItem}–{endItem}
          </span>{" "}
          of <span className="text-text-primary">{pagination.totalItems}</span>{" "}
          Products
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-text-secondary whitespace-nowrap">
              Sort by:
            </span>
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-[#F8FAFC] border border-border text-text-brand-600 py-2 pl-3 pr-8 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer shadow-sm"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none" />
            </div>
          </div>

          {/* Grid/List View Toggles */}
          <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-brand-900 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              aria-label="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-brand-900 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Filter toggle button */}
          <button
            className="md:hidden flex items-center gap-2 px-3 py-2 border border-border rounded-xl text-text-brand-600 text-xs bg-[#F8FAFC]"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* 3 & 4. Sticky Filter Sidebar */}
        <div
          className={`
 w-full md:w-[300px] lg:w-[320px] shrink-0 space-y-6 md:sticky md:top-24 h-fit z-30 transition-all duration-300
 ${isFilterOpen ? "fixed inset-0 bg-white p-6 overflow-y-auto block md:relative md:inset-auto md:p-0 md:bg-transparent" : "hidden md:block"}
`}
        >
          {/* Mobile close button */}
          {isFilterOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-border md:hidden mb-4">
              <span className="text-text-brand-600 text-lg">Filters</span>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-text-primary" />
              </button>
            </div>
          )}

          {/* Sidebar container */}
          <div className="bg-white rounded-[28px] border border-border p-6 shadow-sm space-y-6">
            {/* Header / Clear All */}
            <div className="flex items-center justify-between pb-4 border-b border-border-light">
              <span className="text-text-brand-600 text-base">Filters</span>
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-danger-600 hover:text-danger-700 underline underline-offset-2 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Accordion 1: Categories */}
            <div className="border-b border-border-light pb-4">
              <button
                onClick={() => toggleSection("categories")}
                className="w-full flex items-center justify-between text-sm font-extrabold text-text-brand-600 py-1"
              >
                <span>Categories</span>
                {expandedSections.categories ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.categories && (
                <div className="space-y-2 mt-3 animate-fade-in">
                  <label className="flex items-center justify-between cursor-pointer group py-0.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          selectedCategories.length === categoriesList.length
                            ? "bg-brand-900 border-brand-900"
                            : "border-border group-hover:border-brand-600"
                        }`}
                      >
                        {selectedCategories.length ===
                          categoriesList.length && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span
                        className={`text-xs ${selectedCategories.length === categoriesList.length ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                      >
                        All Categories
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted bg-[#F1F5F9] px-2 py-0.5 rounded-full font-medium">
                      {categoriesList.reduce(
                        (acc, c) => acc + (c.count || 0),
                        0,
                      )}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={
                        selectedCategories.length === categoriesList.length
                      }
                      onChange={() => handleCategoryToggle("All")}
                    />
                  </label>

                  {categoriesList.map((catObj) => {
                    const cat = catObj.name;
                    const isChecked = selectedCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center justify-between cursor-pointer group py-0.5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked
                                ? "bg-brand-900 border-brand-900"
                                : "border-border group-hover:border-brand-600"
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span
                            className={`text-xs ${isChecked ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                          >
                            {cat}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-muted bg-[#F1F5F9] px-2 py-0.5 rounded-full font-medium">
                          {catObj.count}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => handleCategoryToggle(cat)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 2: Rating */}
            <div className="border-b border-border-light pb-4">
              <button
                onClick={() => toggleSection("rating")}
                className="w-full flex items-center justify-between text-sm font-extrabold text-text-brand-600 py-1"
              >
                <span>Rating</span>
                {expandedSections.rating ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.rating && (
                <div className="space-y-2.5 mt-3 animate-fade-in">
                  <label className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <div
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedRatings.length === 0
                          ? "bg-brand-900 border-brand-900"
                          : "border-border group-hover:border-brand-600"
                      }`}
                    >
                      {selectedRatings.length === 0 && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${selectedRatings.length === 0 ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                    >
                      All Ratings
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedRatings.length === 0}
                      onChange={() => handleRatingToggle("All")}
                    />
                  </label>

                  {ALL_RATINGS.map((rating) => {
                    const isChecked =
                      selectedRatings.length === 0 ||
                      selectedRatings.includes(rating);
                    return (
                      <label
                        key={rating}
                        className="flex items-center gap-3 cursor-pointer group py-0.5"
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? "bg-brand-900 border-brand-900"
                              : "border-border group-hover:border-brand-600"
                          }`}
                        >
                          {isChecked && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs ${isChecked ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                          >
                            {rating} Stars & Up
                          </span>
                          <div className="flex items-center text-amber-500">
                            {[...Array(5)].map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3 h-3 ${idx < rating ? "fill-current" : "opacity-20"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={() => handleRatingToggle(rating)}
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion 3: Price Range */}
            <div className="border-b border-border-light pb-4">
              <button
                onClick={() => toggleSection("price")}
                className="w-full flex items-center justify-between text-sm font-extrabold text-text-brand-600 py-1"
              >
                <span>Price Range</span>
                {expandedSections.price ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.price && (
                <div className="space-y-4 mt-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-secondary mb-1 block uppercase tracking-wider">
                        Min (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-border rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white"
                        placeholder="0"
                        value={minPriceInput}
                        onChange={(e) => setMinPriceInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-secondary mb-1 block uppercase tracking-wider">
                        Max (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-border rounded-xl bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-white"
                        placeholder="50000"
                        value={maxPriceInput}
                        onChange={(e) => setMaxPriceInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Availability */}
            <div>
              <button
                onClick={() => toggleSection("availability")}
                className="w-full flex items-center justify-between text-sm font-extrabold text-text-brand-600 py-1"
              >
                <span>Availability</span>
                {expandedSections.availability ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedSections.availability && (
                <div className="space-y-2.5 mt-3 animate-fade-in">
                  <label className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <div
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedAvailability.includes("inStock")
                          ? "bg-brand-900 border-brand-900"
                          : "border-border group-hover:border-brand-600"
                      }`}
                    >
                      {selectedAvailability.includes("inStock") && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${selectedAvailability.includes("inStock") ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                    >
                      In Stock
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedAvailability.includes("inStock")}
                      onChange={() => handleAvailabilityToggle("inStock")}
                    />
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group py-0.5">
                    <div
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedAvailability.includes("sale")
                          ? "bg-brand-900 border-brand-900"
                          : "border-border group-hover:border-brand-600"
                      }`}
                    >
                      {selectedAvailability.includes("sale") && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-xs ${selectedAvailability.includes("sale") ? "font-bold text-brand-900" : "text-text-secondary group-hover:text-text-primary font-medium"}`}
                    >
                      On Sale
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedAvailability.includes("sale")}
                      onChange={() => handleAvailabilityToggle("sale")}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Product Grid Container */}
        <div className="flex-1 space-y-6">
          {/* 7. Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-border-light shadow-inner">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider pl-1.5 mr-1">
                Active Filters:
              </span>
              {activeChips.map((chip) => (
                <div
                  key={chip.id}
                  className="flex items-center gap-1.5 bg-white border border-border pl-3 pr-1.5 py-1 rounded-xl text-xs text-brand-900 shadow-sm transition-all hover:bg-slate-50"
                >
                  <span>{chip.label}</span>
                  <button
                    onClick={chip.onRemove}
                    className="p-0.5 rounded-full hover:bg-slate-100 hover:text-danger-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleClearAllFilters}
                className="text-xs text-danger-600 hover:text-danger-700 underline underline-offset-2 ml-auto pr-1.5 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {error && (
            <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-2xl border border-danger-100 text-sm text-left">
              {error}
            </div>
          )}

          {isLoading ? (
            /* 10. Skeleton Loaders for Products */
            <ProductGrid>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <div className="aspect-[4/5] bg-slate-200 rounded-[22px] w-full" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-8 bg-slate-200 rounded-full w-full" />
                </div>
              ))}
            </ProductGrid>
          ) : products.length > 0 ? (
            /* 5. Product Grid - responsive columns */
            <div className="space-y-8">
              <ProductGrid>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ProductGrid>

              {/* 8. Premium Pagination */}
              <div className="flex justify-center pt-8">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  variant="premium"
                />
              </div>
            </div>
          ) : (
            /* 9. Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[28px] border border-border text-center shadow-sm max-w-xl mx-auto my-8 space-y-5">
              <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 shadow-inner">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl text-text-brand-600 font-bold">
                  No Products Found
                </h3>
                <p className="text-sm text-text-secondary max-w-sm">
                  We couldn't find any products matching your current filters.
                  Try resetting the filters or modifying inputs.
                </p>
              </div>
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 bg-brand-900 text-white rounded-xl hover:bg-brand-950 transition-colors shadow-md flex items-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
