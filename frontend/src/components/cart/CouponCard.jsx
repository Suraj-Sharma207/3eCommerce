import React, { useState } from 'react';
import { Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const CouponCard = ({ onApplyCoupon }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setStatus('loading');
    setMessage('');
    
    // Simulate API call since no coupon API exists yet
    setTimeout(() => {
      if (code.toUpperCase() === 'WELCOME10') {
        setStatus('success');
        setMessage('Coupon applied successfully!');
        if (onApplyCoupon) onApplyCoupon(10); // 10% discount
      } else {
        setStatus('error');
        setMessage('Invalid or expired referral code.');
      }
    }, 800);
  };

  return (
    <div className="bg-white border border-border rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-bold text-text-primary text-sm">Have a referral code?</h3>
      </div>
      
      <div className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Tag className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status !== 'idle') {
                setStatus('idle');
                setMessage('');
              }
            }}
            placeholder="Enter code"
            className="w-full pl-9 pr-3 py-2.5 bg-surface-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors uppercase placeholder:normal-case"
            disabled={status === 'loading'}
          />
        </div>
        <Button 
          variant="primary" 
          onClick={handleApply}
          disabled={!code.trim() || status === 'loading' || status === 'success'}
          isLoading={status === 'loading'}
          className="px-6 rounded-lg bg-text-primary hover:bg-black text-white" 
        >
          Apply
        </Button>
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-success-600 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-danger-600 font-medium">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}
    </div>
  );
};

export default CouponCard;
