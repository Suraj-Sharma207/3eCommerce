import React, { useState } from 'react';

const ProductGallery = ({ images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // If no images provided, use placeholder
  const safeImages = images.length > 0 ? images : ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1000&q=80'];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-border-light shadow-sm relative">
        <img 
          src={safeImages[activeIndex]} 
          alt={`Product View ${activeIndex + 1}`}
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                activeIndex === idx ? 'border-brand-600 shadow-md ring-2 ring-primary-100' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
