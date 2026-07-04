import React, { useEffect, useState } from'react';
import { useNavigate, useLocation } from'react-router-dom';
import useCartStore from'../store/cartStore';
import { ShoppingCart } from'lucide-react';
import { formatPrice } from'../utils/currency';

const FloatingCartBar = () => {
 const { cart } = useCartStore();
 const navigate = useNavigate();
 const location = useLocation();
 const [isVisible, setIsVisible] = useState(false);

 const cartItems = cart?.items || [];
 const validItems = cartItems.filter(item => item.product);
 
 const itemCount = validItems.reduce((acc, item) => acc + item.quantity, 0);
 const subtotal = validItems.reduce((acc, item) => {
 const itemPrice = item.product.finalPrice || item.product.price;
 return acc + (itemPrice * item.quantity);
 }, 0);

 // Hide on checkout
 const isCheckout = location.pathname.includes('/checkout');

 useEffect(() => {
 if (itemCount > 0 && !isCheckout) {
 setIsVisible(true);
 } else {
 setIsVisible(false);
 }
 }, [itemCount, isCheckout]);

 return (
 <div 
 className={`fixed z-50 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-[520px] transition-all duration-300 ease-in-out ${
 isVisible 
 ?'bottom-[16px] sm:bottom-[24px] opacity-100 translate-y-0' 
 :'-bottom-[100px] opacity-0 translate-y-full pointer-events-none'
 }`}
 >
 <div className="bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 rounded-[20px] p-2 flex items-center justify-between h-[72px]">
 {/* Left Section */}
 <div className="flex items-center gap-3 pl-4">
 <div className="bg-[#1B2340]/10 p-2 rounded-full text-[#1B2340]">
 <ShoppingCart className="w-5 h-5" />
 </div>
 <div className="flex flex-col">
 <span className="text-sm text-slate-800">
 {itemCount} {itemCount === 1 ?'Item' :'Items'}
 </span>
 <span className="text-xs text-[#1B2340]">
 {formatPrice(subtotal)}
 </span>
 </div>
 </div>

 {/* Right Section / Primary CTA */}
 <button
 onClick={() => navigate('/checkout')}
 className="h-full bg-[#1B2340] hover:bg-[#252f52] active:scale-[0.98] transition-all text-white font-semibold px-6 rounded-[16px] shadow-sm flex items-center gap-2 flex-shrink-0"
 >
 Proceed <span className="hidden sm:inline">to Checkout</span>
 <span className="text-lg leading-none">&rarr;</span>
 </button>
 </div>
 </div>
 );
};

export default FloatingCartBar;
