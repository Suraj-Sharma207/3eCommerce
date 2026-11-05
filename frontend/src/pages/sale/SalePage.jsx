import React, { useEffect, useState, useMemo } from "react";
import SaleHero from "./components/SaleHero";
import DiscountFilters from "./components/DiscountFilters";
import SaleToolbar from "./components/SaleToolbar";
import SaleGrid from "./components/SaleGrid";
import EmptySaleState from "./components/EmptySaleState";
import Pagination from "../../components/ui/Pagination";
import productService from "../../services/productService";

const SalePage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDiscount, setSelectedDiscount] = useState(0);
  const [sortParam, setSortParam] = useState("discount_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchSaleProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productService.getProducts({
          sale: true,
          limit: 100,
        });
        if (response?.data?.products) {
          setProducts(response.data.products);
        } else if (response?.products) {
          setProducts(response.products);
        }
      } catch (error) {
        console.error("Failed to fetch sale products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSaleProducts();
  }, []);

  const handleDiscountChange = (discount) => {
    setSelectedDiscount(discount);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortParam(sort);
    setCurrentPage(1);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (selectedDiscount > 0) {
      result = result.filter((p) => p.discountPercentage >= selectedDiscount);
    }
    result.sort((a, b) => {
      const priceA = a.finalPrice || a.price;
      const priceB = b.finalPrice || b.price;
      switch (sortParam) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0);
        case "discount_desc":
          return (b.discountPercentage || 0) - (a.discountPercentage || 0);
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return result;
  }, [products, selectedDiscount, sortParam]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProducts.length / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const element = document.getElementById("sale-products");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-surface-background pb-24">
      {/* ── Premium Hero ── */}
      <SaleHero />

      {/* ── Main content area ── */}
      <div
        id="sale-products"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8"
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sticky Sidebar ── */}
          <aside className="w-full lg:w-60 xl:w-64 flex-shrink-0 lg:sticky lg:top-24 self-start h-fit z-30 transition-all duration-300">
            {/* Mobile: horizontal scroll chip strip */}
            <div className="flex lg:hidden overflow-x-auto pb-2 scrollbar-none gap-2 mb-4">
              {[0, 10, 20, 30, 40, 50].map((v) => (
                <button
                  key={v}
                  onClick={() => handleDiscountChange(v)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedDiscount === v
                      ? "bg-danger-600 text-white border-danger-600 shadow-md"
                      : "bg-white text-text-secondary border-border hover:border-danger-400 hover:text-danger-600"
                  }`}
                >
                  {v === 0 ? "All Sale" : `${v}%+ Off`}
                </button>
              ))}
            </div>

            {/* Desktop: vertical sidebar card */}
            <div className="hidden lg:block bg-white rounded-3xl border border-border-light shadow-sm p-5">
              <h3 className="text-sm text-text-primary uppercase tracking-wider mb-4 pb-3 border-b border-border-light font-bold">
                Filter by Discount
              </h3>
              <DiscountFilters
                selectedDiscount={selectedDiscount}
                setSelectedDiscount={handleDiscountChange}
              />
            </div>
          </aside>

          {/* ── Main grid area ── */}
          <main className="flex-1 min-w-0">
            <SaleToolbar
              totalProducts={isLoading ? "…" : filteredAndSortedProducts.length}
              sortParam={sortParam}
              handleSortChange={handleSortChange}
            />

            {!isLoading && filteredAndSortedProducts.length === 0 ? (
              <EmptySaleState onResetFilter={() => handleDiscountChange(0)} />
            ) : (
              <>
                <SaleGrid
                  products={paginatedProducts}
                  isLoading={isLoading}
                />

                {/* ── Premium Pagination ── */}
                {totalPages > 1 && (
                  <div className="flex justify-center pt-10">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      variant="premium"
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SalePage;