import React, { useState, useEffect } from 'react';
import { ImageOff, User } from 'lucide-react';

const ImageFallback = ({ src, alt, className = '', fallbackClassName = '', type = 'image' }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(!src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(!src);
    setIsLoaded(false);
  }, [src]);

  if (hasError) {
    if (type === 'avatar') {
      return (
        <div className={`flex items-center justify-center bg-brand-100 text-brand-600 ${className} ${fallbackClassName}`}>
          <User className="w-1/2 h-1/2 opacity-70" />
        </div>
      );
    }
    
    return (
      <div className={`flex flex-col items-center justify-center bg-border-light text-secondary-400 ${className} ${fallbackClassName}`}>
        <ImageOff className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-widest opacity-50 text-center px-2">Unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader while loading */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-border-light animate-pulse`} />
      )}
      
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default ImageFallback;
