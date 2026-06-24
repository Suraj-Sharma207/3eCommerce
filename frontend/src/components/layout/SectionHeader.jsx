import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SectionHeader = ({ title, subtitle, actionLabel, actionLink }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
      <div>
        <h2 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">{title}</h2>
        {subtitle && <p className="text-lg text-text-secondary">{subtitle}</p>}
      </div>
      
      {actionLabel && actionLink && (
        <Link 
          to={actionLink}
          className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;
