import React from 'react';
import { Tag, ArrowRight, ArrowLeft, ShieldCheck, RefreshCcw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { formatPrice } from '../../utils/currency';

const OrderSummary = ({ 
  itemCount, 
  subtotal, 
  shipping, 
  discount, 
  total, 
  hasUnavailableItems 
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-bold text-text-primary">Order Summary</h2>
      </div>
      
      <div className="space-y-4 text-sm mb-6">
        <div className="flex justify-between items-center text-text-secondary">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-bold text-text-primary">{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between items-center text-text-secondary">
          <span>Delivery</span>
          {shipping === 0 ? (
            <span className="font-bold text-success-600">Free</span>
          ) : shipping === -1 ? (
            <span className="text-xs">Enter address to see cost</span>
          ) : (
            <span className="font-bold text-text-primary">{formatPrice(shipping)}</span>
          )}
        </div>
        {shipping === -1 && (
          <div className="text-[11px] text-text-muted mt-1">
            Sign in or proceed to checkout to see your delivery cost.
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between items-center text-success-600">
            <span>Coupon Discount</span>
            <span className="font-bold">-{formatPrice(discount)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-2xl font-extrabold text-brand-600">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <Button 
          fullWidth 
          onClick={() => navigate('/checkout')}
          disabled={hasUnavailableItems || itemCount === 0}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-full py-3.5 text-base font-bold shadow-sm transition-colors group flex items-center justify-center gap-2"
        >
          Proceed to Checkout
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        
        <Button 
          variant="outline"
          fullWidth 
          onClick={() => navigate('/products')}
          className="border-brand-600 text-brand-600 hover:bg-brand-50 rounded-full py-3.5 text-base font-bold transition-colors group flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Continue Shopping
        </Button>
      </div>

      {/* Security Features */}
      <div className="pt-4 border-t border-border flex flex-col gap-3 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success-500" />
          Your information is protected and secure
        </div>
        <div className="flex items-center gap-2">
          <RefreshCcw className="w-4 h-4 text-brand-500" />
          Free returns within 30 days
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          Responsive Customer Support
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
