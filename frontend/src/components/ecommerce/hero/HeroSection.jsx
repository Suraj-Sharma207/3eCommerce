import React, { useState } from 'react';
import HeroCarousel from './HeroCarousel';
import HeroCategoryCards from './HeroCategoryCards';
import OfferCards from './OfferCards';

/**
 * HeroSection — composes all hero sub-components.
 * This is the only component that maintains shared carousel state
 * so category cards and the carousel can communicate.
 */
const HeroSection = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 font-normal">
      {/* Main promotional carousel */}
      <HeroCarousel
        onSlideChange={setActiveSlideIndex}
        activeIndex={activeSlideIndex}
      />

      {/* Category cards — clicking switches carousel slide */}
      <HeroCategoryCards
        activeIndex={activeSlideIndex}
        onCardClick={setActiveSlideIndex}
      />

      {/* Benefits/offers row */}
      <OfferCards />
    </div>
  );
};

export default HeroSection;
