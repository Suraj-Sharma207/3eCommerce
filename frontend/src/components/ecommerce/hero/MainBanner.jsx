import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';

const MainBanner = ({
  image = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=80",
  title = "Luxury Furniture Sale",
  subtitle = "Up to 60% OFF",
  description = "Premium furniture crafted for modern living. Discover pieces that bring comfort and elegance to your home.",
  badge = "Limited Time Offer",
  buttonText = "Shop Now",
  buttonLink = "/products"
}) => {
  return (
    <div className="relative w-full overflow-hidden bg-surface-background sm:rounded-3xl shadow-soft min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center font-normal">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 font-normal">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover object-center font-normal"
          loading="lazy"
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent font-normal"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full p-8 md:p-12 lg:p-16 max-w-3xl flex flex-col justify-center text-left font-normal">
        {badge && (
          <span className="inline-block py-1.5 px-3 rounded-full bg-accent-500/90 text-white text-xs uppercase tracking-wider mb-6 w-max shadow-sm backdrop-blur-sm font-normal">
            {badge}
          </span>
        )}
        
        <h1 className="text-4xl md:text-5xl lg:text-7xl text-white leading-tight mb-4 drop-shadow-md font-bold">
          {title}
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-bold text-brand-100 mb-6 drop-shadow-sm">
          {subtitle}
        </h2>
        
        <p className="text-base md:text-lg text-white/90 mb-8 max-w-lg leading-relaxed drop-shadow-sm font-normal">
          {description}
        </p>
        
        <div>
          <Button 
            as={Link} 
            to={buttonLink} 
            size="lg" 
            className="px-8 py-4 text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all bg-brand-600 hover:bg-brand-700 text-white border-none font-normal"
          >
            {buttonText}
          </Button>
        </div>
      </div>

    </div>
  );
};

export default MainBanner;
