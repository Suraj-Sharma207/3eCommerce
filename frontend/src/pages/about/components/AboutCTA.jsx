import React from 'react';
import { Link } from 'react-router-dom';

const AboutCTA = () => {
  return (
    <section className="bg-surface-background py-24 relative overflow-hidden font-normal">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 font-normal"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 font-normal"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 font-normal">
        <h2 className="text-3xl md:text-4xl text-text-primary mb-6 font-bold">Ready to Transform Your Space?</h2>
        <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto font-normal">
          Explore our latest collections and find the perfect pieces that speak to your style and elevate your home.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 font-normal">
          <Link to="/products" className="bg-brand-600 text-white px-8 py-3 rounded-full hover:bg-brand-700 transition-colors shadow-md font-normal">
            Shop Collections
          </Link>
          <Link to="/contact" className="bg-white text-brand-600 border-2 border-brand-600 px-8 py-3 rounded-full hover:bg-brand-50 transition-colors font-normal">
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutCTA;
