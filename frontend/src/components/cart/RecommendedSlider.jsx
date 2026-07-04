import React, { useEffect, useState, useRef } from'react';
import { ChevronRight, ChevronLeft } from'lucide-react';
import useProductStore from'../../store/productStore';
import ProductCard from'../products/ProductCard';

const RecommendedSlider = ({ currentCartItemIds = [] }) => {
 const { recommendedProducts, fetchRecommendedProducts, hasFetchedRecommended } = useProductStore();
 const [products, setProducts] = useState([]);
 const [isLoading, setIsLoading] = useState(!hasFetchedRecommended);
 const sliderRef = useRef(null);

 useEffect(() => {
 const load = async () => {
 setIsLoading(true);
 await fetchRecommendedProducts();
 setIsLoading(false);
 };
 if (!hasFetchedRecommended) load();
 else setIsLoading(false);
 }, [fetchRecommendedProducts, hasFetchedRecommended]);

 useEffect(() => {
 if (!recommendedProducts?.length) return;
 const set = new Set(currentCartItemIds);
 setProducts(recommendedProducts.filter(p => !set.has(p.id)).slice(0, 8));
 }, [currentCartItemIds, recommendedProducts]);

 const scroll = (dir) => {
 const el = sliderRef.current;
 if (!el) return;
 el.scrollBy({ left: dir ==='right' ? 280 : -280, behavior:'smooth' });
 };

 if (isLoading) {
 return (
 <div className="mt-12">
 <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mb-6" />
 <div className="flex gap-5 overflow-hidden">
 {[1,2,3,4,5].map(i => (
 <div key={i} className="min-w-[200px] sm:min-w-[220px] aspect-[4/5] bg-slate-200 rounded-2xl animate-pulse" />
 ))}
 </div>
 </div>
 );
 }

 if (products.length === 0) return null;

 return (
 <div className="mt-12">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-[#1B2340]">Customers also bought</h2>
 <div className="flex gap-2">
 <button
 onClick={() => scroll('left')}
 className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
 aria-label="Scroll left"
 >
 <ChevronLeft className="w-4 h-4 text-slate-600" />
 </button>
 <button
 onClick={() => scroll('right')}
 className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
 aria-label="Scroll right"
 >
 <ChevronRight className="w-4 h-4 text-slate-600" />
 </button>
 </div>
 </div>

 <div
 ref={sliderRef}
 className="flex gap-5 overflow-x-auto pb-2 snap-x hide-scrollbar"
 style={{ scrollbarWidth:'none', msOverflowStyle:'none' }}
 >
 {products.map((product) => (
 <div
 key={product.id}
 className="min-w-[200px] sm:min-w-[220px] snap-start"
 >
 <ProductCard product={product} />
 </div>
 ))}
 </div>
 </div>
 );
};

export default RecommendedSlider;
