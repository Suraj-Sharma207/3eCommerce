import React from'react';
import PageContainer from'../layout/PageContainer';
import { HeroOfferStrip, HeroSection } from'./hero';

/**
 * HeroBanner — top-level wrapper rendered by HomePage.
 * Composes the promotion strip + full hero section inside the page container.
 */
const HeroBanner = () => {
 return (
 <div className="w-full bg-surface-background">
 {/* Dark announcement strip */}
 <HeroOfferStrip />

 {/* Main hero area (carousel + category cards + benefit cards) */}
 <div className="pt-6 pb-2 md:pt-8 lg:pt-10">
 <PageContainer>
 <HeroSection />
 </PageContainer>
 </div>
 </div>
 );
};

export default HeroBanner;
