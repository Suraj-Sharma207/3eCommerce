import React from 'react';
import HomeSection from '../../../components/layout/HomeSection';

const BrandGrid = () => {
  const brands = [
    { name: "Brand 1", url: "https://via.placeholder.com/150x80?text=Brand+1" },
    { name: "Brand 2", url: "https://via.placeholder.com/150x80?text=Brand+2" },
    { name: "Brand 3", url: "https://via.placeholder.com/150x80?text=Brand+3" },
    { name: "Brand 4", url: "https://via.placeholder.com/150x80?text=Brand+4" },
    { name: "Brand 5", url: "https://via.placeholder.com/150x80?text=Brand+5" },
    { name: "Brand 6", url: "https://via.placeholder.com/150x80?text=Brand+6" }
  ];

  return (
    <HomeSection title="Our Trusted Partners" subtitle="We collaborate with the best to bring you the best">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-70">
        {brands.map((brand, index) => (
          <div key={index} className="flex justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105 cursor-pointer">
            <img src={brand.url} alt={brand.name} className="h-12 object-contain" />
          </div>
        ))}
      </div>
    </HomeSection>
  );
};

export default BrandGrid;
