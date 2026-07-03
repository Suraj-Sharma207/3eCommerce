import React, { useState } from 'react';
import { useCookieConsent } from './CookieContext';
import Button from '../ui/Button';
import { Shield, BarChart, Settings, Megaphone, ArrowLeft } from 'lucide-react';

const CookieBanner = () => {
  const { showBanner, acceptAll, isInitializing } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);

  if (isInitializing || !showBanner) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-start p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300 font-normal">
      
      {!showDetails ? (
        // Small Centered Modal
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 w-full max-w-md flex flex-col gap-5 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300 font-normal">
          <div className="flex flex-col items-start text-left gap-3 font-normal">
            <span className="text-4xl font-normal" role="img" aria-label="Cookie">🍪</span>
            <h3 className="text-xl text-slate-800 font-bold">Cookies & Privacy</h3>
          </div>

          <div className="text-[14px] text-slate-600 leading-relaxed text-left font-normal">
            <p className="mb-3 font-normal">
              We use cookies to improve your shopping experience, personalize content, analyze traffic, and remember your preferences. You must accept these policies to continue using the platform.
            </p>
            <p>
              Read our{' '}
              <button 
                onClick={() => setShowDetails(true)} 
                className="text-brand-600 hover:underline font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600 rounded"
              >
                Cookie Policy
              </button>{' '}
              for more detailed information.
            </p>
          </div>

          <div className="flex flex-col pt-2 font-normal">
            <Button onClick={acceptAll} className="w-full text-base shadow-md py-3 font-normal">
              Accept All Cookies
            </Button>
          </div>
        </div>
      ) : (
        // Big Detailed Modal
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8 w-full max-w-3xl flex flex-col gap-6 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-300 font-normal">
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 font-normal">
            <button 
              onClick={() => setShowDetails(false)}
              aria-label="Go Back"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 font-normal" />
            </button>
            <div>
              <h3 className="text-xl text-slate-800 font-bold">Cookies & Privacy Policy</h3>
              <p className="text-sm text-slate-500 mt-1 font-normal">We value your privacy. Please review our cookie policies.</p>
            </div>
          </div>

          {/* Full Policy Content */}
          <div className="text-[13px] text-slate-600 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 space-y-5 custom-scrollbar font-normal">
            <p className="text-sm text-slate-700 font-normal">
              By clicking "Accept All Cookies", you consent to the use of cookies and similar technologies to enhance site navigation, analyze site usage, and assist in our marketing efforts. You must accept these policies to continue using the platform.
            </p>
            
            <div className="space-y-4 mt-4 font-normal">
              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 font-normal">
                <Shield className="w-6 h-6 text-brand-600 shrink-0 mt-0.5 font-normal" />
                <div>
                  <h4 className="text-slate-800 mb-1 font-normal">Strictly Necessary Cookies</h4>
                  <p>These cookies are essential for the website to function properly. They enable core functionalities such as security, network management, account authentication, cart operations, and the checkout process.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 font-normal">
                <BarChart className="w-6 h-6 text-brand-600 shrink-0 mt-0.5 font-normal" />
                <div>
                  <h4 className="text-slate-800 mb-1 font-normal">Analytics Cookies</h4>
                  <p>We use these cookies to understand how visitors interact with our website. This helps us improve website performance, monitor traffic, and analyze user behavior through tools like Google Analytics.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 font-normal">
                <Settings className="w-6 h-6 text-brand-600 shrink-0 mt-0.5 font-normal" />
                <div>
                  <h4 className="text-slate-800 mb-1 font-normal">Functional Cookies</h4>
                  <p>Functional cookies allow the website to remember choices you make (such as your language, currency, wishlist, or the region you are in) and provide enhanced, more personal features.</p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 font-normal">
                <Megaphone className="w-6 h-6 text-brand-600 shrink-0 mt-0.5 font-normal" />
                <div>
                  <h4 className="text-slate-800 mb-1 font-normal">Marketing & Advertising Cookies</h4>
                  <p>These cookies are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of the advertising campaign.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 font-normal">
            <Button onClick={acceptAll} className="w-full text-base shadow-md py-3 font-normal">
              I Understand and Accept All Cookies
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieBanner;
