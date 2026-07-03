import React from 'react';
import HomeSection from '../../../components/layout/HomeSection';
import ImageFallback from '../../../components/ui/ImageFallback';

const BrandGrid = () => {
  const brands = [
    { name: "Brand 1", url: null },
    { name: "Brand 2", url: null },
    { name: "Brand 3", url: null },
    { name: "Brand 4", url: null },
    { name: "Brand 5", url: null },
    { name: "Brand 6", url: null }
  ];

  return (
    <HomeSection title="Our Trusted Partners" subtitle="We collaborate with the best to bring you the best">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-70 font-normal">
        {brands.map((brand, index) => (
          <div key={index} className="flex justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105 cursor-pointer font-normal">
            <ImageFallback src={brand.url} alt={brand.name} className="h-12 w-32 object-contain font-normal" />
          </div>
        ))}
      </div>
    </HomeSection>
  );
};

export default BrandGrid;
