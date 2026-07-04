import React from'react';
import { Tag, ArrowRight, ArrowLeft, ShieldCheck, RefreshCcw, Lock, Headphones } from'lucide-react';
import { useNavigate } from'react-router-dom';
import Button from'../ui/Button';
import { formatPrice } from'../../utils/currency';

const OrderSummary = ({ itemCount, subtotal, shipping, discount, total, hasUnavailableItems }) => {
 const navigate = useNavigate();

 return (
 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
 {/* Header */}
 <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
 <Tag className="w-4 h-4 text-[#1B2340]" />
 <h2 className="text-sm font-bold text-[#1B2340]">Order Summary</h2>
 </div>

 {/* Line items */}
 <div className="px-5 pt-4 pb-2 space-y-3">
 <div className="flex justify-between items-center text-sm text-slate-500">
 <span>Subtotal ({itemCount} {itemCount === 1 ?'item' :'items'})</span>
 <span className="text-slate-800 tabular-nums">{formatPrice(subtotal)}</span>
 </div>

 <div className="flex justify-between items-center text-sm text-slate-500">
 <span>Delivery</span>
 {shipping === 0 ? (
 <span className="text-emerald-600">Free</span>
 ) : shipping === -1 ? (
 <span className="text-xs text-slate-400">Calculated at checkout</span>
 ) : (
 <span className="text-slate-800 tabular-nums">{formatPrice(shipping)}</span>
 )}
 </div>

 {discount > 0 && (
 <div className="flex justify-between items-center text-sm text-emerald-600">
 <span>Coupon Discount</span>
 <span className="tabular-nums">−{formatPrice(discount)}</span>
 </div>
 )}

 {/* You Save row — always visible */}
 <div className="flex justify-between items-center text-sm text-emerald-600">
 <span>You Save</span>
 <span className="tabular-nums">{discount > 0 ?`+${formatPrice(discount)}` : formatPrice(0)}</span>
 </div>
 </div>

 {/* Divider + Total */}
 <div className="px-5 pt-3 pb-4 border-t border-slate-100 mt-2">
 <div className="flex justify-between items-center">
 <span className="text-base text-slate-800">Total</span>
 <span className="text-2xl text-[#1B2340] tabular-nums">{formatPrice(total)}</span>
 </div>
 </div>

 {/* CTAs */}
 <div className="px-5 pb-4 flex flex-col gap-2.5">
 <button
 onClick={() => navigate('/checkout')}
 disabled={hasUnavailableItems || itemCount === 0}
 className="w-full flex items-center justify-center gap-2 bg-[#1B2340] hover:bg-[#252f52] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
 >
 Proceed to Checkout
 <ArrowRight className="w-4 h-4" />
 </button>
 <button
 onClick={() => navigate('/products')}
 className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl py-3.5 text-sm font-bold transition-colors duration-200"
 >
 <ArrowLeft className="w-4 h-4" />
 Continue Shopping
 </button>
 </div>

 {/* Trust indicators */}
 <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-2.5">
 {[
 { icon: ShieldCheck, text:'Your information is protected and secure' },
 { icon: RefreshCcw, text:'Free returns within 30 days' },
 { icon: Lock, text:'100% Secure Payments' },
 { icon: Headphones, text:'Responsive Customer Support' },
 ].map(({ icon: Icon, text }) => (
 <div key={text} className="flex items-center gap-2.5 text-xs text-slate-500">
 <Icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
 {text}
 </div>
 ))}
 </div>
 </div>
 );
};

export default OrderSummary;
