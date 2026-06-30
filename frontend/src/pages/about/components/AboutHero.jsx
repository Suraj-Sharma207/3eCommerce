import React from 'react';
import { Link } from 'react-router-dom';

const AboutHero = () => {
  return (
    <section className="relative overflow-hidden bg-brand-50 pt-24 pb-32">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-600 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-text-primary mb-6 tracking-tight">
          Crafting Homes, <span className="text-brand-600">Inspiring Lives</span>
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
          We believe that furniture is more than just functional pieces. It's about creating spaces where memories are made, stories unfold, and life happens.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/products" className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30">
            Explore Collection
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
