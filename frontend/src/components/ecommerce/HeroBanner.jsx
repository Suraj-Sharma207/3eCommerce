import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import PageContainer from '../layout/PageContainer';
import { formatPrice } from '../../utils/currency';

const HeroBanner = () => {
  return (
    <div className="bg-secondary-50 py-12 lg:py-20">
      <PageContainer>
        <div className="relative rounded-3xl overflow-hidden bg-white shadow-soft flex flex-col lg:flex-row min-h-[500px] lg:min-h-[600px]">
          
          {/* Content */}
          <div className="flex-1 p-10 lg:p-16 flex flex-col justify-center order-2 lg:order-1 relative z-10 bg-white/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-text-primary leading-tight mb-6">
              Transform Your <br className="hidden lg:block"/> Living Space
            </h1>
            <p className="text-lg lg:text-xl text-text-secondary mb-10 max-w-md">
              Premium furniture crafted for modern living. Discover pieces that bring comfort and elegance to your home.
            </p>
            <div>
              <Button as={Link} to="/products" size="lg" className="px-8 py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                Shop Collection
              </Button>
            </div>
          </div>

          {/* Image Area */}
          <div className="flex-1 relative order-1 lg:order-2 h-64 lg:h-auto">
            {/* Replace this div with an actual img tag pointing to a premium living room photo */}
            <div className="absolute inset-0 bg-secondary-200">
              <img 
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80" 
                alt="Modern Living Room"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/80 lg:from-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 px-4 lg:px-8">
          <TrustBadge icon="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" title="Free Delivery" desc={`On orders over ${formatPrice(4999)}`} />
          <TrustBadge icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" title="30-Day Returns" desc="No questions asked" />
          <TrustBadge icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" title="Premium Quality" desc="Built to last" />
          <TrustBadge icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" title="Secure Payments" desc="100% protected" />
        </div>
      </PageContainer>
    </div>
  );
};

const TrustBadge = ({ icon, title, desc }) => (
  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
    <div className="flex-shrink-0 text-text-primary">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    </div>
    <div>
      <h4 className="font-bold text-text-primary text-sm sm:text-base">{title}</h4>
      <p className="text-xs sm:text-sm text-text-secondary mt-1">{desc}</p>
    </div>
  </div>
);

export default HeroBanner;
