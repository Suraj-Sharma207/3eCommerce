import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

const ImageFallback = ({ src, alt, className = '', fallbackClassName = '' }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(!src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(!src);
    setIsLoaded(false);
  }, [src]);

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-secondary-100 text-secondary-400 ${className} ${fallbackClassName}`}>
        <ImageOff className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-widest opacity-50">Image Unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton loader while loading */}
      {!isLoaded && (
        <div className={`absolute inset-0 bg-secondary-100 animate-pulse`} />
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
