import React from 'react';
import { Link } from 'react-router-dom';

const AboutHero = () => {
  return (
    <section className="relative overflow-hidden bg-brand-50 pt-24 pb-32 font-normal">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-600 to-transparent pointer-events-none font-normal"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center font-normal">
        <h1 className="text-5xl md:text-6xl text-text-primary mb-6 tracking-tight font-bold">
          Crafting Homes, <span className="text-brand-600 font-normal">Inspiring Lives</span>
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          We believe that furniture is more than just functional pieces. It's about creating spaces where memories are made, stories unfold, and life happens.
        </p>
        <div className="flex justify-center gap-4 font-normal">
          <Link to="/products" className="bg-brand-600 text-white px-8 py-3 rounded-full hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30 font-normal">
            Explore Collection
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
