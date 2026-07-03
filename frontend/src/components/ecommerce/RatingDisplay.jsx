import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingDisplay = ({ rating, count, className = '', showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center text-accent-500 font-normal">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-current font-normal" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 fill-current font-normal" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-secondary-300 font-normal" />
        ))}
      </div>
      {showCount && (
        <span className="text-xs text-text-secondary font-normal">
          {rating.toFixed(1)} {count !== undefined && `(${count})`}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
