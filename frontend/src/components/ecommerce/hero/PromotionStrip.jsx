import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { promotionItems } from './heroData';

const HeroOfferStrip = ({ items = promotionItems }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-brand-900 text-white text-xs sm:text-sm py-2.5 overflow-hidden font-normal">
      <div className="max-w-7xl mx-auto px-4 font-normal">
        {/* Mobile: scroll, Desktop: spread evenly */}
        <div className="flex overflow-x-auto hide-scrollbar sm:overflow-visible sm:justify-center items-center gap-6 sm:gap-10 min-w-max sm:min-w-0 font-normal">
          {items.map((item, i) => (
            <React.Fragment key={item.id}>
              <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 font-normal">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-400 flex-shrink-0 font-normal" />
                <span className="tracking-wide font-normal">{item.text}</span>
              </div>
              {i < items.length - 1 && (
                <span className="hidden sm:inline text-white/30 flex-shrink-0 font-normal">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroOfferStrip;
