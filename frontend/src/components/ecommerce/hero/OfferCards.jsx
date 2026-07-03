import React from 'react';
import { offerCards } from './heroData';

const HeroBenefitCard = ({ Icon, title, subtitle, badge }) => (
  <div className="relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-border-light shadow-sm hover:shadow-soft transition-shadow flex-shrink-0 w-52 sm:w-auto font-normal">
    {badge && (
      <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-[10px] uppercase px-2 py-0.5 rounded shadow z-10 font-normal">
        {badge}
      </span>
    )}
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-normal">
      <Icon className="w-5 h-5 font-normal" />
    </div>
    <div>
      <p className="text-sm text-text-primary leading-tight font-normal">{title}</p>
      <p className="text-xs text-text-muted mt-0.5 font-medium">{subtitle}</p>
    </div>
  </div>
);

/**
 * OfferCards — benefit strip shown below category cards.
 * Props:
 *   cards: offer card data (defaults to offerCards from heroData)
 */
const OfferCards = ({ cards = offerCards }) => {
  return (
    <div className="flex overflow-x-auto hide-scrollbar sm:grid sm:grid-cols-5 gap-3 sm:gap-4 pb-1 sm:pb-0 font-normal">
      {cards.map(({ id, Icon, title, subtitle, badge }) => (
        <HeroBenefitCard
          key={id}
          Icon={Icon}
          title={title}
          subtitle={subtitle}
          badge={badge}
        />
      ))}
    </div>
  );
};

export default OfferCards;
