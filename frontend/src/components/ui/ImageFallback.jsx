import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const ImageFallback = ({ src, alt, className = '', fallbackClassName = '' }) => {
  const [hasError, setHasError] = useState(!src);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError) {
    return (
      <img
        src="/images/placeholders/furniture-placeholder.jpg"
        alt="Placeholder"
        className={`${className} ${fallbackClassName} object-cover`}
      />
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className={`absolute inset-0 bg-secondary-100 animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt || 'Product Image'}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
};

export default ImageFallback;
