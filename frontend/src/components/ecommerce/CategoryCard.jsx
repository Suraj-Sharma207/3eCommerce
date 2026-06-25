import React from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';

const CategoryCard = ({ title, count, iconName = 'Package', to }) => {
  const IconComponent = LucideIcons[iconName] || LucideIcons.Package;

  return (
    <Link to={to} className="group block">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-primary-200">
        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors duration-300 text-neutral-500">
          <IconComponent className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">{title}</h3>
        {count !== undefined && (
          <p className="text-sm text-neutral-500 mt-1">{count} items</p>
        )}
      </div>
    </Link>
  );
};

export default CategoryCard;
