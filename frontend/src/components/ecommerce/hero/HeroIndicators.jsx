import React from 'react';
import { motion } from 'framer-motion';

/**
 * HeroIndicators — pagination dots
 * Props:
 *   count: number of slides
 *   current: active index
 *   onChange: (index) => void
 */
const HeroIndicators = ({ count, current, onChange }) => {
  return (
    <div
      className="flex items-center justify-center gap-2 font-normal"
      role="tablist"
      aria-label="Slide indicators"
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onChange(i)}
          className="relative h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
          style={{ width: i === current ? '28px' : '8px' }}
        >
          <span
            className={`absolute inset-0 rounded-full transition-colors duration-300 ${
              i === current ? 'bg-white' : 'bg-white/40'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default HeroIndicators;
