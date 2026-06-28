import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useBrandingStore } from '../../store/brandingStore';

import AuthTransition from './AuthTransition';

const AuthLayout = () => {
  const [imageError, setImageError] = useState(false);
  const { branding } = useBrandingStore();

  return (
    <div className="flex flex-col lg:flex-row w-full h-[100dvh] overflow-hidden bg-surface-background font-sans">

      {/* Left side - Form Area */}
      <div className="flex-1 flex flex-col lg:w-1/2 bg-white relative border-r border-border-light shadow-2xl z-10 overflow-y-auto">

        {/* Header inside the form area */}
        <div className="p-6 sm:p-8 shrink-0">
          <Link to="/" className="text-3xl font-extrabold text-brand-600 tracking-tight stagger-1 flex items-center gap-2">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt={branding?.platformName} className="h-10 w-auto" />
            ) : (
              branding?.platformName || 'LuxeHome'
            )}
          </Link>
        </div>

        <main className="flex-1 w-full max-w-[540px] mx-auto py-12 flex flex-col justify-center">
          <AuthTransition />
        </main>
      </div>

      {/* Right side - Lifestyle Image */}
      <div className="hidden lg:block relative lg:w-1/2 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600">
        {!imageError && (
          <img
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[20s] hover:scale-105"
            src="/images/auth/auth-bg.jpg"
            alt="Premium Furniture"
            onError={() => setImageError(true)}
          />
        )}

        {/* Gradient Overlay - Subtle dark gradient */}
        <div className="absolute inset-0 bg-secondary-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/20 to-transparent" />

        {/* Value Prop Overlay - Centered vertically */}
        <div className="absolute inset-0 flex flex-col justify-center p-12 lg:p-16 text-white max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h3 className="text-4xl lg:text-5xl font-extrabold mb-8 tracking-tight leading-tight drop-shadow-sm">
            Elevate your living space with {branding?.platformName || 'LuxeHome'}.
          </h3>
          <div className="flex flex-wrap gap-4">
            {[
              'Secure Checkout',
              'Premium Furniture',
              'Fast Delivery',
              '24×7 Support',
              'Easy Returns'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20">
                <div className="w-6 h-6 rounded-full bg-brand-500/90 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-wide">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
