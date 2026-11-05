import React, { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HeroSlide from "./HeroSlide";
import HeroIndicators from "./HeroIndicators";
import { heroSlides } from "./heroData";

const AUTOPLAY_DELAY = 5000;

/**
 * HeroCarousel — orchestrates slide state, auto-play, keyboard & pointer nav.
 * Props:
 * slides: slide data array (defaults to heroSlides)
 * onSlideChange: (index) => void — notifies HeroCategoryCards
 * activeIndex: controlled index (used when category card is clicked)
 */
const HeroCarousel = ({
  slides = heroSlides,
  onSlideChange,
  activeIndex: externalIndex,
}) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Sync with external index (category card click)
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== current) {
      setDirection(externalIndex > current ? 1 : -1);
      setCurrent(externalIndex);
    }
  }, [externalIndex]);

  const goTo = useCallback(
    (index) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      onSlideChange?.(index);
    },
    [current, onSlideChange],
  );

  const prev = useCallback(() => {
    const idx = (current - 1 + slides.length) % slides.length;
    goTo(idx);
  }, [current, slides.length, goTo]);

  const next = useCallback(() => {
    const idx = (current + 1) % slides.length;
    goTo(idx);
  }, [current, slides.length, goTo]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      const idx = (current + 1) % slides.length;
      setDirection(1);
      setCurrent(idx);
      onSlideChange?.(idx);
    }, AUTOPLAY_DELAY);
    return () => clearTimeout(timerRef.current);
  }, [current, paused, slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-soft"
      style={{ minHeight: "340px", height: "clamp(340px, 55vw, 600px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Hero promotional carousel"
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="sync">
        <HeroSlide
          key={slides[current].id}
          slide={slides[current]}
          direction={direction}
        />
      </AnimatePresence>

      {/* Prev button */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-brand-900 transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next button */}
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-brand-900 transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <HeroIndicators
          count={slides.length}
          current={current}
          onChange={goTo}
        />
      </div>
    </div>
  );
};

export default HeroCarousel;
