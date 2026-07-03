import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, ChevronDown } from 'lucide-react';
import { getOptimizedUrl } from '../../utils/cloudinary';

const ProductGallery = ({ images = [] }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fading, setFading] = useState(false);

  const safeImages = images.length > 0
    ? images
    : ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1000&q=80'];

  const switchTo = useCallback((idx) => {
    if (idx === activeIndex || fading) return;
    setFading(true);
    setImageLoaded(false);
    setTimeout(() => {
      setActiveIndex(idx);
      setFading(false);
    }, 150);
  }, [activeIndex, fading]);

  const goPrev = useCallback((e) => { e?.stopPropagation(); switchTo((activeIndex - 1 + safeImages.length) % safeImages.length); }, [activeIndex, safeImages.length, switchTo]);
  const goNext = useCallback((e) => { e?.stopPropagation(); switchTo((activeIndex + 1) % safeImages.length); }, [activeIndex, safeImages.length, switchTo]);

  // Keyboard in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handle = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isFullscreen, goPrev, goNext]);

  // Swipe
  const [touchX, setTouchX] = useState(null);
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) { if (diff > 0) goNext(); else goPrev(); }
    setTouchX(null);
  };

  const thumbnailsVisible = 5;
  const [thumbOffset, setThumbOffset] = useState(0);

  const canScrollDown = thumbOffset + thumbnailsVisible < safeImages.length;
  const canScrollUp   = thumbOffset > 0;

  const scrollThumbsDown = () => { if (canScrollDown) setThumbOffset(o => o + 1); };
  const scrollThumbsUp   = () => { if (canScrollUp)   setThumbOffset(o => o - 1); };

  const visibleThumbs = safeImages.slice(thumbOffset, thumbOffset + thumbnailsVisible);

  return (
    <>
      <div className="flex gap-3 items-start font-normal">
        {/* ── Vertical thumbnail strip (left) ── */}
        {safeImages.length > 1 && (
          <div className="flex flex-col items-center gap-2 shrink-0 w-[78px] font-normal">
            {/* Scroll up */}
            {canScrollUp && (
              <button onClick={scrollThumbsUp} className="w-full flex justify-center py-1 text-slate-400 hover:text-slate-600 transition-colors font-normal">
                <ChevronDown className="w-4 h-4 rotate-180 font-normal" />
              </button>
            )}
            {visibleThumbs.map((img, i) => {
              const realIdx = thumbOffset + i;
              return (
                <button
                  key={realIdx}
                  onClick={() => switchTo(realIdx)}
                  aria-label={`View image ${realIdx + 1}`}
                  className={`
                    w-[78px] h-[78px] rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-200 focus:outline-none
                    ${activeIndex === realIdx
                      ? 'border-[#1B2340] shadow-md'
                      : 'border-slate-200 opacity-65 hover:opacity-100 hover:border-slate-300'
                    }
                  `}
                >
                  <img src={getOptimizedUrl(img, 'thumbnail')} alt="" className="w-full h-full object-cover font-normal" loading="lazy" />
                </button>
              );
            })}
            {/* Scroll down */}
            {canScrollDown && (
              <button onClick={scrollThumbsDown} className="w-full flex justify-center py-1 text-slate-400 hover:text-slate-600 transition-colors font-normal">
                <ChevronDown className="w-4 h-4 font-normal" />
              </button>
            )}
          </div>
        )}

        {/* ── Main image ── */}
        <div
          className="relative flex-1 overflow-hidden rounded-2xl bg-[#F4F5F7] cursor-zoom-in group font-normal"
          style={{ aspectRatio: '1 / 1.05' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse z-10 font-normal" />
          )}

          {/* Image */}
          <img
            key={activeIndex}
            src={getOptimizedUrl(safeImages[activeIndex], 'detail')}
            alt={`Product view ${activeIndex + 1}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-[1.04]
              ${fading ? 'opacity-0' : 'opacity-100'}
              ${imageLoaded ? '' : 'invisible'}
            `}
          />

          {/* Arrows */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={goPrev}
                aria-label="Previous"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none hover:bg-slate-50 font-normal"
              >
                <ChevronLeft className="w-5 h-5 text-[#1B2340] font-normal" strokeWidth={2.5} />
              </button>
              <button
                onClick={goNext}
                aria-label="Next"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none hover:bg-slate-50 font-normal"
              >
                <ChevronRight className="w-5 h-5 text-[#1B2340] font-normal" strokeWidth={2.5} />
              </button>
            </>
          )}

          {/* Fullscreen icon */}
          <button
            onClick={() => setIsFullscreen(true)}
            aria-label="Fullscreen"
            className="absolute bottom-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-lg shadow flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none hover:bg-white"
          >
            <Maximize2 className="w-4 h-4 text-[#1B2340] font-normal" />
          </button>
        </div>
      </div>

      {/* ── Fullscreen Lightbox ── */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center font-normal" onClick={() => setIsFullscreen(false)}>
          <button
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors focus:outline-none font-normal"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="w-6 h-6 text-white font-normal" />
          </button>
          {safeImages.length > 1 && (
            <button onClick={goPrev} className="absolute left-5 md:left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center focus:outline-none font-normal">
              <ChevronLeft className="w-7 h-7 text-white font-normal" />
            </button>
          )}
          <img
            src={getOptimizedUrl(safeImages[activeIndex], 'zoom')}
            alt=""
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-xl shadow-2xl font-normal"
            onClick={(e) => e.stopPropagation()}
          />
          {safeImages.length > 1 && (
            <button onClick={goNext} className="absolute right-5 md:right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center focus:outline-none font-normal">
              <ChevronRight className="w-7 h-7 text-white font-normal" />
            </button>
          )}
          {safeImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 font-normal">
              {safeImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); switchTo(idx); }}
                  className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${activeIndex === idx ? 'border-white' : 'border-white/30 opacity-50 hover:opacity-80'}`}
                >
                  <img src={getOptimizedUrl(img, 'thumbnail')} alt="" className="w-full h-full object-cover font-normal" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProductGallery;
