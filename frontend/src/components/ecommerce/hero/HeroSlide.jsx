import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }
  })
};

const contentVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.1 }
  }
};

/**
 * HeroSlide — renders a single carousel slide.
 * Props:
 *  slide: { id, badge, title, titleHighlight, subtitle, description, buttonText, buttonLink, image }
 *  direction: number (1 = next, -1 = prev) — for animation direction
 *  isActive: boolean
 */
const HeroSlide = ({ slide, direction }) => {
  return (
    <motion.div
      key={slide.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 rounded-2xl overflow-hidden"
      aria-label={`Slide: ${slide.title} ${slide.titleHighlight}`}
    >
      {/* Background image */}
      <img
        src={slide.image}
        alt={`${slide.title} ${slide.titleHighlight}`}
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />

      {/* Dark left-side gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10 pointer-events-none" />

      {/* Slide content */}
      <div className="relative z-10 h-full flex items-center">
        <motion.div
          key={`content-${slide.id}`}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="p-8 md:p-12 lg:p-16 max-w-lg xl:max-w-2xl text-left"
        >
          {slide.badge && (
            <span className="inline-block bg-white/15 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
              {slide.badge}
            </span>
          )}

          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-2 drop-shadow">
            {slide.title}{' '}
            <span className="text-accent-400">{slide.titleHighlight}</span>
          </h2>

          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white/90 mb-4 drop-shadow">
            {slide.subtitle}
          </p>

          <p className="text-sm sm:text-base text-white/80 mb-8 leading-relaxed max-w-md">
            {slide.description}
          </p>

          <Link
            to={slide.buttonLink}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-base px-7 py-3.5 rounded-[14px] shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label={slide.buttonText}
          >
            {slide.buttonText}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HeroSlide;
